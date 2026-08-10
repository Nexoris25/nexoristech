/**
 * The shared meta checks behind every editor's SEO score.
 *
 * Six editors each had their own inline checklist and they disagreed: the description window was
 * 120 to 165 in two of them and 120 to 160 in three, and three spent checks on whether a focus
 * keyword appeared in the title, the description and the body. These pin what replaced all of it.
 */
import { describe, it, expect } from "vitest";
import { describeMetaDescription, metaChecks, metaScore, trimToCompleteSentences, DESCRIPTION_MIN, DESCRIPTION_MAX } from "./meta-quality.js";

/** A description that sits inside the window and finishes its sentence. */
const GOOD = "We design and build websites, apps and custom business software for companies across " +
  "Nigeria and abroad. Tell us the problem, and we will solve it properly.";

describe("describeMetaDescription", () => {
  it("accepts a complete description inside the window", () => {
    const state = describeMetaDescription(GOOD);
    expect(GOOD.length).toBeGreaterThanOrEqual(DESCRIPTION_MIN);
    expect(GOOD.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
    expect(state.inRange).toBe(true);
    expect(state.endsComplete).toBe(true);
    expect(state.hint).toBeNull();
  });

  it("flags a description that stops mid-sentence", () => {
    const state = describeMetaDescription("We design and build custom business software for companies and we");
    expect(state.endsComplete).toBe(false);
    expect(state.hint).toMatch(/finish the last sentence/i);
  });

  it("says how far short it falls", () => {
    const state = describeMetaDescription("Short but finished.");
    expect(state.endsComplete).toBe(true);
    expect(state.inRange).toBe(false);
    expect(state.hint).toMatch(/characters short/);
  });

  it("says how far over it runs", () => {
    const state = describeMetaDescription(`${"A complete sentence. ".repeat(12)}`.trim());
    expect(state.inRange).toBe(false);
    expect(state.hint).toMatch(/over/);
  });

  it("treats an empty field as unfinished rather than passing it", () => {
    const state = describeMetaDescription("   ");
    expect(state.inRange).toBe(false);
    expect(state.endsComplete).toBe(false);
  });
});

describe("metaChecks", () => {
  const base = { title: "How Nigerian businesses use automation", metaTitle: "How Nigerian businesses use automation", metaDesc: GOOD };

  it("passes a well formed page", () => {
    expect(metaScore(metaChecks(base))).toBe(100);
  });

  it("does not reward keyword repetition, because nothing measures it any more", () => {
    // The same page with a phrase repeated three times scores no higher than without it.
    const stuffed = { ...base, metaDesc: GOOD };
    expect(metaScore(metaChecks(stuffed))).toBe(metaScore(metaChecks(base)));
  });

  it("marks down a truncated description", () => {
    const truncated = { ...base, metaDesc: "We design and build custom business software for companies across Nigeria and abroad and we" };
    expect(metaScore(metaChecks(truncated))).toBeLessThan(100);
  });

  it("marks down an over-long meta title", () => {
    const long = { ...base, metaTitle: "A".repeat(80) };
    expect(metaScore(metaChecks(long))).toBeLessThan(100);
  });

  it("adds the optional checks only when asked", () => {
    expect(metaChecks(base)).toHaveLength(4);
    expect(metaChecks({ ...base, body: "<h2>x</h2><a href='/y'>y</a>", words: 500, minWords: 300, requireStructure: true, requireLinks: true })).toHaveLength(7);
  });
});

describe("trimToCompleteSentences", () => {
  it("offers a fix that keeps whole sentences", () => {
    const over = "We build software for Nigerian businesses that removes manual work every day. " +
      "Our team designs, builds and supports the whole system. " +
      "Tell us the problem and we will scope it honestly for you.";
    const fixed = trimToCompleteSentences(over);
    expect(fixed.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
    expect(fixed).toMatch(/[.!?]$/);
    expect(over.startsWith(fixed)).toBe(true);
  });
});
