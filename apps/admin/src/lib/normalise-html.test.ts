/**
 * The paste normaliser.
 *
 * These are the shapes real sources actually produce. Whatever comes out of this function is what the
 * website publishes and what search engines and AI assistants read, so each case here is a thing that
 * would otherwise reach a live page.
 */
import { describe, it, expect } from "vitest";
import { normaliseHtml, normalisePlainText } from "./normalise-html.js";

describe("stripping presentation", () => {
  it("drops inline styles, keeping the paragraph", () => {
    expect(normaliseHtml('<p style="font-family:Calibri;font-size:11pt;color:#222">Hello</p>'))
      .toBe("<p>Hello</p>");
  });

  it("unwraps the span around every word that Google Docs emits", () => {
    expect(normaliseHtml('<p><span class="c1">One</span> <span class="c1">two</span></p>'))
      .toBe("<p>One two</p>");
  });

  it("drops classes, which belong to the site's stylesheet and not to pasted copy", () => {
    expect(normaliseHtml('<p class="MsoNormal">Body</p>')).toBe("<p>Body</p>");
  });

  it("removes a script outright, content and all", () => {
    expect(normaliseHtml('<p>Before</p><script>alert(1)</script><p>After</p>'))
      .toBe("<p>Before</p><p>After</p>");
  });

  it("refuses a javascript: link while keeping its text", () => {
    expect(normaliseHtml('<p><a href="javascript:alert(1)">Click</a></p>')).toBe("<p><a>Click</a></p>");
  });

  it("adds rel to a link that opens a new tab", () => {
    expect(normaliseHtml('<p><a href="https://x.com" target="_blank">X</a></p>'))
      .toBe('<p><a href="https://x.com" target="_blank" rel="noreferrer">X</a></p>');
  });

  it("drops Word's namespaced tags and conditional comments", () => {
    expect(normaliseHtml('<p>Real<o:p></o:p></p><!--[if gte mso 9]><xml>junk</xml><![endif]-->'))
      .toBe("<p>Real</p>");
  });
});

describe("meaning over appearance", () => {
  it("turns b and i into strong and em", () => {
    expect(normaliseHtml("<p><b>Bold</b> and <i>italic</i></p>"))
      .toBe("<p><strong>Bold</strong> and <em>italic</em></p>");
  });

  it("turns a layout div into a paragraph", () => {
    expect(normaliseHtml("<div>A block</div>")).toBe("<p>A block</p>");
  });
});

describe("heading hierarchy", () => {
  it("demotes a pasted H1, because the page title is the H1", () => {
    expect(normaliseHtml("<h1>Title</h1><p>Body</p>")).toBe("<h2>Title</h2><p>Body</p>");
  });

  it("closes a skipped level so H1 then H4 becomes H2 then H3", () => {
    expect(normaliseHtml("<h1>One</h1><h4>Two</h4>")).toBe("<h2>One</h2><h3>Two</h3>");
  });

  it("keeps the order of a well-formed document", () => {
    expect(normaliseHtml("<h2>A</h2><h3>B</h3><h2>C</h2>")).toBe("<h2>A</h2><h3>B</h3><h2>C</h2>");
  });

  it("never emits more than one H1 from a document with several", () => {
    const out = normaliseHtml("<h1>A</h1><h1>B</h1><h1>C</h1>");
    expect(out).not.toContain("<h1>");
    expect(out).toBe("<h2>A</h2><h2>B</h2><h2>C</h2>");
  });

  it("does not push a deep document past H6", () => {
    const out = normaliseHtml("<h1>1</h1><h2>2</h2><h3>3</h3><h4>4</h4><h5>5</h5><h6>6</h6>");
    expect(out).toBe("<h2>1</h2><h3>2</h3><h4>3</h4><h5>4</h5><h6>5</h6><h6>6</h6>");
  });
});

describe("tables", () => {
  it("gives a first row of bold cells real column headers", () => {
    const pasted = "<table><tr><td><strong>Name</strong></td><td><strong>Role</strong></td></tr><tr><td>Ada</td><td>Engineer</td></tr></table>";
    expect(normaliseHtml(pasted)).toBe(
      '<table><thead><tr><th scope="col">Name</th><th scope="col">Role</th></tr></thead><tbody><tr><td>Ada</td><td>Engineer</td></tr></tbody></table>');
  });

  it("marks a first column of headings as row headers", () => {
    const pasted = "<table><tr><th>Metric</th><th>Q1</th></tr><tr><th>Revenue</th><td>10</td></tr><tr><th>Cost</th><td>4</td></tr></table>";
    const out = normaliseHtml(pasted);
    expect(out).toContain('<th scope="row">Revenue</th>');
    expect(out).toContain("<td>10</td>");
  });

  it("leaves a data first column as data", () => {
    const pasted = "<table><tr><th>A</th><th>B</th></tr><tr><td>1</td><td>2</td></tr></table>";
    expect(normaliseHtml(pasted)).not.toContain('scope="row"');
  });

  it("drops a table with no rows rather than emitting an empty one", () => {
    expect(normaliseHtml("<table></table>")).toBe("");
  });
});

describe("lists", () => {
  it("turns numbered paragraphs into an ordered list", () => {
    expect(normaliseHtml("<p>1. First</p><p>2. Second</p>"))
      .toBe("<ol><li>First</li><li>Second</li></ol>");
  });

  it("turns bulleted paragraphs into an unordered list", () => {
    expect(normaliseHtml("<p>- One</p><p>• Two</p>"))
      .toBe("<ul><li>One</li><li>Two</li></ul>");
  });

  it("does not merge a numbered run into a bulleted one", () => {
    expect(normaliseHtml("<p>1. A</p><p>- B</p>"))
      .toBe("<ol><li>A</li></ol><ul><li>B</li></ul>");
  });

  it("leaves a real list alone", () => {
    expect(normaliseHtml("<ul><li>Kept</li></ul>")).toBe("<ul><li>Kept</li></ul>");
  });

  it("does not mistake a sentence beginning with a year for a list", () => {
    expect(normaliseHtml("<p>2026 was the year the rules changed.</p>"))
      .toBe("<p>2026 was the year the rules changed.</p>");
  });
});

describe("spacing", () => {
  it("drops the empty paragraphs people use to space things out", () => {
    expect(normaliseHtml("<p>A</p><p></p><p>&nbsp;</p><p><br></p><p>B</p>"))
      .toBe("<p>A</p><p>B</p>");
  });

  it("drops a trailing line break inside a block", () => {
    expect(normaliseHtml("<p>Line<br></p>")).toBe("<p>Line</p>");
  });

  it("keeps a line break that separates two lines", () => {
    expect(normaliseHtml("<p>One<br>Two</p>")).toBe("<p>One<br>Two</p>");
  });

  it("collapses the runs of whitespace an export pads tags with", () => {
    expect(normaliseHtml("<p>Spaced    out</p>")).toBe("<p>Spaced out</p>");
  });

  it("returns nothing for empty input rather than an empty tag", () => {
    expect(normaliseHtml("")).toBe("");
    expect(normaliseHtml("   ")).toBe("");
  });
});

describe("normalisePlainText", () => {
  it("makes a paragraph of each blank-line-separated block", () => {
    expect(normalisePlainText("First para.\n\nSecond para.")).toBe("<p>First para.</p><p>Second para.</p>");
  });

  it("keeps a single newline as a line break within the paragraph", () => {
    expect(normalisePlainText("Line one\nLine two")).toBe("<p>Line one<br>Line two</p>");
  });

  it("escapes markup so pasted text cannot become markup", () => {
    expect(normalisePlainText("5 < 6 & 7 > 2")).toBe("<p>5 &lt; 6 &amp; 7 &gt; 2</p>");
  });

  it("finds the list in pasted plain text", () => {
    expect(normalisePlainText("1. One\n\n2. Two")).toBe("<ol><li>One</li><li>Two</li></ol>");
  });
});
