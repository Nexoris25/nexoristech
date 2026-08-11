/**
 * The excerpt must describe the article, not the summary sitting on top of it.
 *
 * The assistant inserts the TL;DR at the very top of the body as `<h2>TL;DR</h2><ul>...</ul>`, and
 * the excerpt was built from "the first two sentences of the body". So every article whose TL;DR had
 * been inserted got its summary back as its card excerpt.
 *
 * These also guard the regex itself. It has twice been silently corrupted by shell escaping, once
 * into a pattern containing a literal backspace byte that matched nothing at all, so a test that
 * only checked the happy path would have passed while the strip did nothing.
 */
import { describe, it, expect } from "vitest";
import { stripTldrBlock } from "./oge-content.js";

const TLDR = "<h2>TL;DR</h2><ul><li>First summary point.</li><li>Second summary point.</li></ul>";
const ARTICLE = "<p>Nigerian manufacturers lose hours to manual stock counts. This is what to do about it.</p>";

describe("stripTldrBlock", () => {
  it("removes the heading and its list together", () => {
    const out = stripTldrBlock(TLDR + ARTICLE);
    expect(out).not.toMatch(/TL;?DR/i);
    expect(out).not.toContain("First summary point");
    expect(out).not.toContain("Second summary point");
  });

  it("keeps the article itself", () => {
    expect(stripTldrBlock(TLDR + ARTICLE)).toContain("Nigerian manufacturers lose hours");
  });

  it("handles an ordered list and a different heading level", () => {
    const out = stripTldrBlock("<h3>TL;DR</h3><ol><li>Point one.</li></ol>" + ARTICLE);
    expect(out).not.toContain("Point one");
    expect(out).toContain("Nigerian manufacturers");
  });

  it("removes a bare TLDR label with no list", () => {
    expect(stripTldrBlock("<h2>TLDR</h2><p>Body starts here.</p>")).not.toMatch(/TLDR/i);
  });

  it("leaves an article with no summary untouched", () => {
    expect(stripTldrBlock(ARTICLE).trim()).toBe(ARTICLE);
  });

  it("actually matches, rather than silently doing nothing", () => {
    // The corruption this guards against left a pattern that matched no input, so the strip was a
    // no-op and every test above would still have passed had they only checked the article text.
    expect(stripTldrBlock(TLDR + ARTICLE)).not.toBe(TLDR + ARTICLE);
  });
});
