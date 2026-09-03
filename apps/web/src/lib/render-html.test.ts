/**
 * Sanitising and sectioning CMS HTML for the public site.
 *
 * This decides what reaches a live page, so the refusals are the important cases: anything that gets
 * through here is served to every visitor and every crawler.
 */
import { describe, it, expect } from "vitest";
import { sanitiseHtml, splitSections, stepsOf } from "./render-html.js";

describe("sanitiseHtml", () => {
  it("keeps ordinary formatting", () => {
    expect(sanitiseHtml("<p>Hello <strong>there</strong></p>")).toBe("<p>Hello <strong>there</strong></p>");
  });

  it("removes a script and everything inside it", () => {
    expect(sanitiseHtml("<p>A</p><script>steal()</script><p>B</p>")).toBe("<p>A</p><p>B</p>");
  });

  it("removes an iframe outright", () => {
    expect(sanitiseHtml('<iframe src="https://evil.test"></iframe><p>Safe</p>')).toBe("<p>Safe</p>");
  });

  it("drops a javascript: href but keeps the words", () => {
    expect(sanitiseHtml('<p><a href="javascript:alert(1)">Click</a></p>')).toBe("<p><a>Click</a></p>");
  });

  it("drops an onerror handler while keeping the image", () => {
    expect(sanitiseHtml('<img src="/a.png" alt="A" onerror="steal()">')).toBe('<img src="/a.png" alt="A">');
  });

  it("drops inline styles, which belong to the stylesheet", () => {
    expect(sanitiseHtml('<p style="color:red">Red</p>')).toBe("<p>Red</p>");
  });

  it("adds rel to a link that opens a new tab", () => {
    expect(sanitiseHtml('<a href="https://x.test" target="_blank">X</a>'))
      .toBe('<a href="https://x.test" target="_blank" rel="noreferrer">X</a>');
  });

  it("keeps table structure including scoped headers", () => {
    const table = '<table><thead><tr><th scope="col">A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>';
    expect(sanitiseHtml(table)).toBe(table);
  });

  it("drops an H1, because the page title is the H1", () => {
    expect(sanitiseHtml("<h1>Nope</h1><p>Body</p>")).toBe("Nope<p>Body</p>");
  });

  it("returns nothing for empty input", () => {
    expect(sanitiseHtml("")).toBe("");
  });
});

describe("splitSections", () => {
  const body = "<h2>First</h2><p>One.</p><h2>Second</h2><p>Two.</p>";

  it("makes one section per heading", () => {
    const s = splitSections(body);
    expect(s).toHaveLength(2);
    expect(s.map((x) => x.heading)).toEqual(["First", "Second"]);
  });

  it("gives each section an anchor id for the contents list", () => {
    expect(splitSections(body).map((s) => s.id)).toEqual(["first", "second"]);
  });

  it("keeps each section's own body and nothing else", () => {
    expect(splitSections(body)[0]!.html).toBe("<p>One.</p>");
  });

  it("keeps copy before the first heading as an unnumbered preamble", () => {
    const s = splitSections("<p>Intro.</p><h2>First</h2><p>One.</p>");
    expect(s[0]!.heading).toBe("");
    expect(s[0]!.html).toBe("<p>Intro.</p>");
    expect(s[1]!.heading).toBe("First");
  });

  it("strips markup out of the heading text used in the contents list", () => {
    expect(splitSections("<h2>Your <em>rights</em></h2><p>x</p>")[0]!.heading).toBe("Your rights");
  });

  it("falls back to a positional id when a heading has no usable text", () => {
    expect(splitSections("<h2>—</h2><p>x</p>")[0]!.id).toBe("section-1");
  });

  it("returns nothing for an empty body, so the page shows its own fallback", () => {
    expect(splitSections("")).toEqual([]);
    expect(splitSections("   ")).toEqual([]);
  });

  it("sanitises while splitting, so a script cannot ride in on a section", () => {
    const s = splitSections("<h2>A</h2><p>ok</p><script>bad()</script>");
    expect(s[0]!.html).toBe("<p>ok</p>");
  });
});

describe("stepsOf", () => {
  const guide = "<h2>Register</h2><p>Submit the details.</p><h2>Map services</h2><p>Match each code.</p>";

  it("makes one step per heading, in order", () => {
    const steps = stepsOf(guide);
    expect(steps.map((s) => s.name)).toEqual(["Register", "Map services"]);
  });

  it("uses the copy under the heading as the step text, stripped of markup", () => {
    expect(stepsOf(guide)[0]!.text).toBe("Submit the details.");
  });

  it("carries the anchor so a step can be linked directly", () => {
    expect(stepsOf(guide)[0]!.anchor).toBe("register");
  });

  it("skips a heading with no copy, because a step with no text is invalid", () => {
    expect(stepsOf("<h2>Empty</h2><h2>Real</h2><p>Do this.</p>").map((s) => s.name)).toEqual(["Real"]);
  });

  it("ignores a preamble before the first heading, which is not a step", () => {
    expect(stepsOf("<p>Intro.</p><h2>One</h2><p>Do it.</p>")).toHaveLength(1);
  });

  it("returns nothing for a document with no headings", () => {
    expect(stepsOf("<p>Just prose.</p>")).toEqual([]);
  });
});

describe("sanitiseHtml paragraph repair", () => {
  it("unwraps the outer paragraph that wrapped a whole article body", () => {
    // The exact shape published on the live article: a <p> wrapping the document, and a stray </p>
    // and <br> at the end. The browser turned both halves into empty paragraphs.
    const stored = "<p><p>First para.</p><p>Second para.</p><br></p>";
    expect(sanitiseHtml(stored)).toBe("<p>First para.</p><p>Second para.</p>");
  });

  it("drops paragraphs that hold nothing", () => {
    expect(sanitiseHtml("<p>Real.</p><p></p><p>&nbsp;</p><p><br></p>")).toBe("<p>Real.</p>");
  });

  it("keeps a paragraph that wraps an image", () => {
    const html = '<p><img src="/a.png" alt="A chart"></p>';
    expect(sanitiseHtml(html)).toContain("<img");
  });

  it("does not unwrap a paragraph holding real text", () => {
    expect(sanitiseHtml("<p>Text <strong>here</strong>.</p>")).toBe("<p>Text <strong>here</strong>.</p>");
  });

  it("unwraps a paragraph wrapped around a list", () => {
    expect(sanitiseHtml("<p><ul><li>One</li></ul></p>")).toBe("<ul><li>One</li></ul>");
  });

  it("leaves a trailing break inside a paragraph out of the text", () => {
    expect(sanitiseHtml("<p>Line.<br></p>")).toBe("<p>Line.</p>");
  });
});

/**
 * Internal links in body HTML point at the URL the site actually serves.
 *
 * The site is configured with trailing slashes, so /case-studies is answered with a 308. Editor
 * tools write internal links absolutely — https://nexoristech.com/case-studies — and internalise
 * already reduced those to a path; it just left the path without its slash. So a reader following a
 * link inside an article paid for a redirect, and a crawler was pointed at a non-canonical URL.
 */
describe("internal links get the trailing slash", () => {
  it("adds it when reducing an absolute link to a path", () => {
    expect(sanitiseHtml('<p><a href="https://nexoristech.com/case-studies">Work</a></p>')).toContain(
      'href="/case-studies/"',
    );
  });

  it("adds it to a link already written as a path", () => {
    expect(sanitiseHtml('<p><a href="/about">About</a></p>')).toContain('href="/about/"');
  });

  it("leaves one that already has it", () => {
    expect(sanitiseHtml('<p><a href="/contact/">Contact</a></p>')).toContain('href="/contact/"');
  });

  it("leaves an external link untouched", () => {
    expect(sanitiseHtml('<p><a href="https://example.com/page">Away</a></p>')).toContain(
      'href="https://example.com/page"',
    );
  });

  it("does not touch an anchor or a query", () => {
    expect(sanitiseHtml('<p><a href="#top">Top</a></p>')).toContain('href="#top"');
    expect(sanitiseHtml('<p><a href="/insights?page=2">More</a></p>')).toContain('href="/insights?page=2"');
  });

  it("does not put a slash after a file", () => {
    expect(sanitiseHtml('<p><a href="/uploads/brief.pdf">Brief</a></p>')).toContain('href="/uploads/brief.pdf"');
  });
})
;
