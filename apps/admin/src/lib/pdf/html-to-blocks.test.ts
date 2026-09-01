// @vitest-environment jsdom
/**
 * The parser decides three things no renderer can recover afterwards: what the pasted text's own
 * numbering is, whether a block of lines is an outline, and which line breaks were meant. Each of
 * those has already been got wrong once in a document that went to a client, so each is pinned here.
 */
import { describe, it, expect } from "vitest";
import { htmlToBlocks } from "./html-to-blocks.js";
import { oneLine, splitLeadingNumber } from "./brand.js";

const parse = (html: string) => htmlToBlocks(html, new DOMParser().parseFromString(`<body>${html}</body>`, "text/html"));
const textOf = (runs: { text: string }[] | undefined) => (runs ?? []).map((r) => r.text).join("");

describe("lists", () => {
  it("keeps the numbering the source starts at", () => {
    const [list] = parse('<ol start="5"><li>One</li><li>Two</li></ol>');
    expect(list?.itemMarkers).toEqual(["5.", "6."]);
  });

  it("numbers a nested level in its own sequence, under its parent", () => {
    const [list] = parse('<ol start="5"><li>One<ol><li>Deep</li><li>Deeper</li></ol></li><li>Two</li></ol>');
    expect(list?.itemMarkers).toEqual(["5.", "a.", "b.", "6."]);
    expect(list?.itemLevels).toEqual([0, 1, 1, 0]);
  });

  it("honours an explicit list type", () => {
    const [list] = parse('<ol type="a"><li>Notices in writing</li><li>Effective on delivery</li></ol>');
    expect(list?.itemMarkers).toEqual(["a.", "b."]);
  });

  it("does not sweep a nested list into its parent item's text", () => {
    const [list] = parse("<ul><li>Documentation<ul><li>Runbook</li></ul></li></ul>");
    expect(textOf(list?.items?.[0]).trim()).toBe("Documentation");
    expect(textOf(list?.items?.[1]).trim()).toBe("Runbook");
  });
});

describe("the pattern the writer typed", () => {
  it("folds consecutive bulleted paragraphs into one list, keeping the mark", () => {
    const [list] = parse("<p>• Discovery report.</p><p>• Architecture confirmed.</p>");
    expect(list?.type).toBe("bulleted");
    expect(list?.itemMarkers).toEqual(["•", "•"]);
    expect(textOf(list?.items?.[0])).toBe("Discovery report.");
  });

  it("leaves a lone marked paragraph alone, because one item is not a list", () => {
    const blocks = parse("<p>- A single aside.</p>");
    expect(blocks[0]?.type).toBe("paragraph");
    expect(textOf(blocks[0]?.runs)).toBe("- A single aside.");
  });

  it("keeps the sentence that introduces a list out of it", () => {
    const blocks = parse("<p>The following apply:<br>(a) Notices in writing.<br>(b) Effective on delivery.</p>");
    expect(blocks.map((b) => b.type)).toEqual(["paragraph", "numbered"]);
    expect(textOf(blocks[0]?.runs)).toBe("The following apply:");
    expect(blocks[1]?.itemMarkers).toEqual(["(a)", "(b)"]);
    // Every item sits at the top level: an ordered list's marks differ from each other by design.
    expect(blocks[1]?.itemLevels).toEqual([0, 0]);
  });

  it("uses the bullet the list asks for", () => {
    const [list] = parse('<ul style="list-style-type: square"><li>One</li><li>Two</li></ul>');
    expect(list?.itemMarkers).toEqual(["-", "-"]);
  });

  it("reads a second bullet character as a sub-level", () => {
    const [list] = parse("<p>• Top point.</p><p>– Something under it.</p><p>• Another top point.</p>");
    expect(list?.itemLevels).toEqual([0, 1, 0]);
  });
});

describe("diagrams and illustrations", () => {
  const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==";

  it("keeps a pasted picture and the caption under it", () => {
    const [figure] = parse(`<figure><img src="${PNG}" alt="Architecture"><figcaption>Figure 1. The draw engine.</figcaption></figure>`);
    expect(figure?.type).toBe("image");
    expect(figure?.src).toBe(PNG);
    expect(textOf(figure?.caption)).toBe("Figure 1. The draw engine.");
  });

  it("finds a picture inside a paragraph", () => {
    const [figure] = parse(`<p><img src="${PNG}" alt="Topology"></p>`);
    expect(figure?.type).toBe("image");
    expect(textOf(figure?.caption)).toBe("Topology");
  });

  /*
   * A remote address would have the renderer fetching whatever a document points at, from the
   * server. The caption survives so the gap is visible to whoever checks the document.
   */
  it("refuses to carry an image that is only a link, but keeps what it was", () => {
    const [figure] = parse('<figure><img src="https://example.com/a.png"><figcaption>Figure 2. Topology.</figcaption></figure>');
    expect(figure?.type).toBe("image");
    expect(figure?.src).toBeUndefined();
    expect(textOf(figure?.caption)).toBe("Figure 2. Topology.");
  });

  it("drops an image that has neither a picture nor anything to say", () => {
    expect(parse('<img src="https://example.com/a.png">')).toEqual([]);
  });
});

describe("heading hierarchy", () => {
  it("carries the level that was written", () => {
    const blocks = parse("<h1>Part</h1><h2>Section</h2><h3>Sub</h3><h4>Detail</h4><h6>Deeper</h6>");
    expect(blocks.map((b) => b.type)).toEqual(["h1", "h2", "h3", "h4", "h4"]);
  });
});

describe("tables", () => {
  it("keeps cells apart instead of running them into a sentence", () => {
    const [table] = parse("<table><tr><th>Item</th><th>Cost</th></tr><tr><td>SMS</td><td>NGN 480,000</td></tr></table>");
    expect(table?.type).toBe("table");
    expect(table?.headerRow).toBe(true);
    expect(table?.rows?.[1]?.map(textOf)).toEqual(["SMS", "NGN 480,000"]);
  });

  it("reads a table that a wrapper div hides", () => {
    const blocks = parse("<div><table><tr><td>A</td><td>B</td></tr></table></div>");
    expect(blocks[0]?.type).toBe("table");
  });
});

describe("outlines", () => {
  const SITEMAP = "<pre>Home\n  Games\n    Lottery\n  Results</pre>";

  it("reads indentation as depth", () => {
    const [tree] = parse(SITEMAP);
    expect(tree?.type).toBe("tree");
    expect(tree?.itemLevels).toEqual([0, 1, 2, 1]);
    expect(tree?.items?.map((i) => textOf(i))).toEqual(["Home", "Games", "Lottery", "Results"]);
  });

  it("strips the connector characters of an ASCII tree", () => {
    const [tree] = parse("<pre>Home\n├── Games\n│   └── Lottery\n└── Results</pre>");
    expect(tree?.type).toBe("tree");
    expect(tree?.items?.map((i) => textOf(i))).toEqual(["Home", "Games", "Lottery", "Results"]);
  });

  it("leaves ordinary prose alone", () => {
    const [block] = parse("<p>One sentence.<br>Another sentence.<br>A third.</p>");
    expect(block?.type).toBe("paragraph");
  });
});

describe("line breaks", () => {
  it("keeps a deliberate break as a line", () => {
    const [block] = parse("<p>Line one<br>Line two<br>Line three</p>");
    expect(block?.lines?.map((l) => textOf(l))).toEqual(["Line one", "Line two", "Line three"]);
  });

  /*
   * The crash this exists to prevent.
   *
   * HTML is written with its tags on separate lines, so a list item arrives with a newline and some
   * indentation trailing it. A raw newline inside a single <Text> kills the whole render, so no run
   * may ever carry one.
   */
  it("never leaves a raw newline in a run", () => {
    const blocks = parse("<ol>\n  <li>Responsive web application\n    <ol><li>Live draw</li></ol>\n  </li>\n</ol>\n<p>Some\ncopy that merely wrapped.</p>");
    const every = blocks.flatMap((b) => [...(b.items ?? []).flat(), ...(b.runs ?? []), ...(b.lines ?? []).flat()]);
    expect(every.length).toBeGreaterThan(0);
    for (const run of every) expect(run.text).not.toMatch(/[\r\n]/);
  });
});

describe("oneLine", () => {
  /*
   * The whole point of it: pressing Enter in the confidentiality notice made a proposal impossible to
   * generate, because a newline inside a single Text ends the render rather than wrapping.
   */
  it("leaves no line break in a field that prints on one line", () => {
    const typed = ["Confidential.", "", "Not to be copied without consent."].join("\n");
    expect(oneLine(typed)).toBe("Confidential. Not to be copied without consent.");
    expect(oneLine("A\r\nB")).toBe("A B");
    expect(oneLine("A\rB")).toBe("A B");
  });

  it("leaves an ordinary value alone", () => {
    expect(oneLine("Scope of Work")).toBe("Scope of Work");
  });
});

describe("splitLeadingNumber", () => {
  it("takes the drafter's own number off the heading", () => {
    expect(splitLeadingNumber("14. Confidentiality")).toEqual({ number: "14", title: "Confidentiality" });
    expect(splitLeadingNumber("07 Security Schedule")).toEqual({ number: "07", title: "Security Schedule" });
    expect(splitLeadingNumber("4.2 Notices")).toEqual({ number: "4.2", title: "Notices" });
    expect(splitLeadingNumber("Clause 9 — Payment")).toEqual({ number: "9", title: "Payment" });
  });

  it("leaves a heading that carries no number", () => {
    expect(splitLeadingNumber("Confidentiality")).toEqual({ title: "Confidentiality" });
    // A year is not a clause number, and neither is a figure the heading opens with.
    expect(splitLeadingNumber("2026 outlook")).toEqual({ number: "2026", title: "outlook" });
  });
});
