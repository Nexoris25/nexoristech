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

  /*
   * The demotion above is right for an article, which is published inside a page that already has an
   * H1. It is wrong for a document that is a page in its own right: a proposal's H1 is its title and
   * its H2s are its numbered sections, and shifting everything down one turned every section into a
   * sub-heading and left the numbering with nothing to count.
   */
  describe("keepHeadingLevels, for content that is a document in itself", () => {
    const keep = { keepHeadingLevels: true } as const;

    it("leaves a pasted H1 as an H1", () => {
      expect(normaliseHtml("<h1>Title</h1><p>Body</p>", keep)).toBe("<h1>Title</h1><p>Body</p>");
    });

    it("keeps sections at the level they were written", () => {
      expect(normaliseHtml("<h1>Title</h1><h2>Section</h2><h3>Under it</h3>", keep))
        .toBe("<h1>Title</h1><h2>Section</h2><h3>Under it</h3>");
    });

    it("leaves a document that starts at H2 exactly where it starts", () => {
      expect(normaliseHtml("<h2>One</h2><h3>Under</h3><h2>Two</h2>", keep))
        .toBe("<h2>One</h2><h3>Under</h3><h2>Two</h2>");
    });

    it("still strips presentation and dangerous markup", () => {
      expect(normaliseHtml('<h2 style="color:red" class="x">Section</h2><script>alert(1)</script>', keep))
        .toBe("<h2>Section</h2>");
    });
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

/**
 * Paste brings the words, not the source page's links.
 *
 * Copying from a search result or a Google Doc dragged that page's anchors in with the text, so a
 * paragraph arrived speckled with links to somewhere else that nobody had chosen. Links belong to
 * the writer, added with the link tool or suggested by Oge, so stripping is on for paste only and
 * off everywhere else.
 */
describe("normaliseHtml stripLinks", () => {
  it("keeps the words and drops the link", () => {
    expect(normaliseHtml('<p>See <a href="https://elsewhere.test/x">this guide</a> for more.</p>', { stripLinks: true }))
      .toBe("<p>See this guide for more.</p>");
  });

  it("leaves links alone by default, which is what generated content relies on", () => {
    expect(normaliseHtml('<p>See <a href="https://nexoristech.com/x">this guide</a>.</p>'))
      .toBe('<p>See <a href="https://nexoristech.com/x">this guide</a>.</p>');
  });

  it("strips several links across several blocks", () => {
    const out = normaliseHtml(
      '<p><a href="/a">One</a> and <a href="/b">two</a></p><ul><li><a href="/c">three</a></li></ul>',
      { stripLinks: true },
    );
    expect(out).not.toContain("<a");
    expect(out).toContain("One");
    expect(out).toContain("three");
  });

  it("does not eat tags that merely start with an a", () => {
    // /<a[^>]*>/ without a lookahead also matches <abbr>, which a naive version of this did.
    const out = normaliseHtml("<p>An <abbr>API</abbr> call</p>", { stripLinks: true });
    expect(out).toContain("API");
  });
});

/**
 * Paste brings words, not the source page's pictures or wrappers.
 *
 * An image copied from another page is that page's file on that page's server: it hotlinks outside
 * our control, carries no alt text we wrote, and can change or vanish. Images belong in the media
 * library, added with the image tool.
 *
 * These also guard the patterns themselves. Three times in this work a regex written through a shell
 * heredoc lost its backslash and silently matched nothing, so each block below includes a case that
 * fails if the pattern stops matching at all rather than only checking what should survive.
 */
describe("normaliseHtml stripImages", () => {
  const paste = { stripLinks: true, stripImages: true };

  it("removes a pasted image and keeps the words around it", () => {
    const out = normaliseHtml('<p>Before <img src="https://elsewhere.test/p.jpg" alt="x"> after</p>', paste);
    expect(out).not.toContain("<img");
    expect(out).toContain("Before");
    expect(out).toContain("after");
  });

  it("removes the whole figure, not just the picture", () => {
    // A caption with no image describes nothing.
    const out = normaliseHtml('<figure><img src="/a.png" alt="a"><figcaption>Chart of revenue</figcaption></figure><p>Body</p>', paste);
    expect(out).not.toContain("<img");
    expect(out).not.toContain("Chart of revenue");
    expect(out).toContain("Body");
  });

  it("leaves images alone when not pasting, which the image tool relies on", () => {
    const out = normaliseHtml('<p><img src="/media/hero.png" alt="Hero"></p>');
    expect(out).toContain("<img");
  });

  it("actually matches, rather than silently doing nothing", () => {
    const input = '<p><img src="/a.png" alt="a"></p>';
    expect(normaliseHtml(input, paste)).not.toBe(normaliseHtml(input));
  });
});

describe("normaliseHtml removes an image with no usable source", () => {
  /*
   * A base64 picture is how a pasted diagram or screenshot actually arrives — the clipboard carries
   * the image, not a link to one — so it is kept, pinned to a real image type. Anything else wearing
   * a data: URL is not a picture and is still refused.
   */
  it("keeps a pasted base64 image", () => {
    const out = normaliseHtml('<p>Text <img src="data:image/png;base64,iVBORw0KGgo=" alt="inline"> more</p>');
    expect(out).toContain("data:image/png;base64,iVBORw0KGgo=");
    expect(out).toContain("Text");
    expect(out).toContain("more");
  });

  it("drops a data URL that is not an image, rather than leaving an empty box", () => {
    const out = normaliseHtml('<p>Text <img src="data:text/html;base64,PHNjcmlwdD4=" alt="inline"> more</p>');
    expect(out).not.toContain("<img");
    expect(out).toContain("Text");
  });

  it("keeps an image that does have a source", () => {
    expect(normaliseHtml('<p><img src="/media/x.png" alt="x"></p>')).toContain("<img");
  });
});

describe("normaliseHtml unwraps an inline element around block content", () => {
  it("handles the Google Docs wrapper", () => {
    // Docs wraps everything in <b style="font-weight:normal">, which became a real <strong>
    // containing the whole document: invalid, and it rendered the entire paste bold.
    const out = normaliseHtml('<b style="font-weight:normal" id="docs-internal-guid-1"><p>One</p><p>Two</p></b>');
    expect(out).not.toMatch(/<strong>\s*<p>/);
    expect(out).toContain("<p>One</p>");
    expect(out).toContain("<p>Two</p>");
  });

  it("keeps genuine inline emphasis inside a paragraph", () => {
    const out = normaliseHtml("<p>Some <strong>bold</strong> words</p>");
    expect(out).toContain("<strong>bold</strong>");
  });

  it("actually matches, rather than silently doing nothing", () => {
    const input = "<strong><p>Block inside inline</p></strong>";
    expect(normaliseHtml(input)).not.toContain("<strong>");
  });
});

describe("pasted tables", () => {
  it("keeps a Word table, dropping its mso styling", () => {
    const word = `<table class=MsoTableGrid border=1 style='border-collapse:collapse'>
      <tr><td style='width:150.0pt'><p class=MsoNormal><b><span style='font-size:11.0pt'>Phase</span></b></p></td>
      <td><p class=MsoNormal><b>Duration</b></p></td></tr>
      <tr><td><p class=MsoNormal>Discovery</p></td><td><p class=MsoNormal>2 weeks</p></td></tr></table>`;
    expect(normaliseHtml(word)).toBe(
      '<table><thead><tr><th scope="col">Phase</th><th scope="col">Duration</th></tr></thead>' +
        "<tbody><tr><td>Discovery</td><td>2 weeks</td></tr></tbody></table>",
    );
  });

  it("lifts a Google Docs table out of the paragraph its div became", () => {
    // Docs wraps the table in a <div>, which becomes a <p> here. A table inside a paragraph is
    // invalid and the browser tears it apart, which is why this paste used to arrive broken.
    const docs = `<div><table style="border-collapse:collapse"><colgroup><col width="311"/></colgroup><tbody>
      <tr><td style="border:1pt solid #000"><p dir="ltr"><span style="font-weight:700">Phase</span></p></td></tr>
      <tr><td><p dir="ltr"><span>Discovery</span></p></td></tr></tbody></table></div>`;
    const out = normaliseHtml(docs);
    expect(out.startsWith("<table>")).toBe(true);
    expect(out).not.toContain("<p><table");
  });

  it("preserves merged cells, which carry the shape of a schedule or a price table", () => {
    expect(
      normaliseHtml('<table><tbody><tr><th colspan="2">Schedule</th></tr><tr><td>a</td><td>b</td></tr></tbody></table>'),
    ).toContain('<th scope="col" colspan="2">Schedule</th>');
    expect(
      normaliseHtml('<table><tbody><tr><td rowspan="2">a</td><td>b</td></tr><tr><td>c</td></tr></tbody></table>'),
    ).toContain('rowspan="2"');
  });

  it("unwraps the single paragraph a pasted cell arrives wrapped in", () => {
    // Two rows, because the first row of a pasted table is read as its header.
    const out = normaliseHtml(
      "<table><tbody><tr><td><p>Phase</p></td></tr><tr><td><p>Discovery</p></td></tr></tbody></table>",
    );
    expect(out).toContain("<td>Discovery</td>");
    expect(out).toContain('<th scope="col">Phase</th>');
  });
});
