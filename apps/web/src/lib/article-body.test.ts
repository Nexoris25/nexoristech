/**
 * Removing blocks the page already renders elsewhere.
 *
 * The assistant used to insert the TL;DR at the top of the body and the FAQ at the bottom, while
 * also saving both to the article's own fields. The template renders those fields, so an article
 * with either inserted published it twice. These cover the removal and, just as importantly, what
 * must survive it: an editor's own prose is not the assistant's leftovers.
 */
import { describe, it, expect } from "vitest";
import { stripDuplicateBlocks } from "./article-body.js";

const TLDR_BLOCK = "<h2>TL;DR</h2><ul><li>Point one.</li><li>Point two.</li></ul>";
const ARTICLE = "<p>Manual stock counts cost Nigerian manufacturers hours every week.</p>";
const FAQ_BLOCK =
  "<h2>Frequently asked questions</h2>" +
  "<h3>What does it cost?</h3><p>It depends on scope.</p>" +
  "<h3>How long does it take?</h3><p>Usually six weeks.</p>";

const STORED_FAQ = [{ question: "What does it cost?" }, { question: "How long does it take?" }];

describe("stripDuplicateBlocks", () => {
  it("removes an inserted TL;DR when one is stored", () => {
    const out = stripDuplicateBlocks(TLDR_BLOCK + ARTICLE, { tldr: ["Point one.", "Point two."] });
    expect(out).not.toMatch(/TL;?DR/i);
    expect(out).not.toContain("Point one");
    expect(out).toContain("Manual stock counts");
  });

  it("leaves a TL;DR block alone when nothing is stored", () => {
    // Then it is the only copy, and removing it would lose the content.
    const out = stripDuplicateBlocks(TLDR_BLOCK + ARTICLE, {});
    expect(out).toContain("Point one");
  });

  it("removes questions the accordion already shows", () => {
    const out = stripDuplicateBlocks(ARTICLE + FAQ_BLOCK, { faq: STORED_FAQ });
    expect(out).not.toContain("What does it cost");
    expect(out).not.toContain("How long does it take");
    expect(out).not.toMatch(/Frequently asked questions/i);
    expect(out).toContain("Manual stock counts");
  });

  it("keeps a question the editor wrote that is not in the stored set", () => {
    const body = ARTICLE + "<h3>Do you work outside Lagos?</h3><p>Yes, across Nigeria.</p>";
    const out = stripDuplicateBlocks(body, { faq: STORED_FAQ });
    expect(out).toContain("Do you work outside Lagos");
    expect(out).toContain("Yes, across Nigeria");
  });

  it("keeps ordinary section headings and their paragraphs", () => {
    const body = "<h2>How we approach this</h2><p>We start from the bottleneck.</p>" + ARTICLE;
    const out = stripDuplicateBlocks(body, { faq: STORED_FAQ, tldr: ["x"] });
    expect(out).toContain("How we approach this");
    expect(out).toContain("We start from the bottleneck");
  });

  it("matches a question despite punctuation and casing differences", () => {
    const body = "<h3>What Does It Cost</h3><p>It depends.</p>";
    expect(stripDuplicateBlocks(body, { faq: STORED_FAQ })).not.toContain("What Does It Cost");
  });

  it("removes both blocks together", () => {
    const out = stripDuplicateBlocks(TLDR_BLOCK + ARTICLE + FAQ_BLOCK, { tldr: ["Point one."], faq: STORED_FAQ });
    expect(out).not.toMatch(/TL;?DR/i);
    expect(out).not.toContain("What does it cost");
    expect(out).toContain("Manual stock counts");
  });

  it("leaves an untouched article exactly as it was", () => {
    expect(stripDuplicateBlocks(ARTICLE, { tldr: ["x"], faq: STORED_FAQ })).toBe(ARTICLE);
  });
});
