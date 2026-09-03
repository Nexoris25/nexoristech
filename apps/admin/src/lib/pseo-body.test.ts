/**
 * The written page body that backs programmatic pages.
 *
 * It is what an editor gets when the AI gateway is unavailable, and what tops up a short generated
 * page, so it has to clear the same 500-word floor the publish gate enforces. It did not: the version
 * this replaces came to roughly 280 words, which is a page the gate would have refused to publish.
 */
import { describe, it, expect } from "vitest";
import { composePageBody, bodyWordCount, PSEO_MIN_WORDS } from "./oge-content.js";
import { evaluatePseoGate, MIN_BODY_WORDS } from "./pseo-gate.js";

const sample = (): string => composePageBody(
  "AI Solutions for Healthcare in Lagos", "ai solutions for healthcare", "Healthcare", "AI Solutions");

describe("composePageBody", () => {
  it("clears the word floor", () => {
    expect(bodyWordCount(sample())).toBeGreaterThanOrEqual(PSEO_MIN_WORDS);
  });

  it("clears the floor even with nothing to work from", () => {
    expect(bodyWordCount(composePageBody("", "", "", ""))).toBeGreaterThanOrEqual(PSEO_MIN_WORDS);
  });

  it("satisfies the publish gate's body check", () => {
    // Only the body condition is under test here, so the other failures are filtered out.
    const failures = evaluatePseoGate({
      body: sample(), authorId: "a1", metaDescription: "Set.",
    }).failures;
    expect(failures.some((f) => /words|no body content/i.test(f))).toBe(false);
  });

  it("uses the same floor the gate enforces", () => {
    expect(PSEO_MIN_WORDS).toBe(MIN_BODY_WORDS);
  });

  it("carries the topic, industry and service through the copy", () => {
    const html = sample();
    expect(html).toContain("Healthcare");
    // The topic keeps its acronym casing. This used to assert the lowercase form, which was the
    // bug: the page published "Ai solutions for healthcare" in its opening line and a heading.
    expect(html).toContain("AI solutions for healthcare");
    expect(html).not.toContain("Ai solutions");
    expect(html).toContain("AI Solutions");
  });

  it("writes headings and a list rather than one wall of text", () => {
    const html = sample();
    expect((html.match(/<h2>/g) ?? []).length).toBeGreaterThanOrEqual(4);
    expect(html).toContain("<ul>");
  });

  it("contains no em dashes", () => {
    // House style: em dashes read as machine-written, so the composer strips them.
    expect(sample()).not.toContain("—");
  });
});

describe("bodyWordCount", () => {
  it("counts words of visible text, ignoring tags and attributes", () => {
    expect(bodyWordCount('<p class="a-long-class">one two three</p>')).toBe(3);
  });

  it("is zero for markup with no text", () => {
    expect(bodyWordCount("<p></p><div>   </div>")).toBe(0);
    expect(bodyWordCount("")).toBe(0);
  });
});

/**
 * Answer-first and the experience signals E-E-A-T asks for.
 *
 * The page used to open by describing itself: "This page explains what X means for your business."
 * A reader skimming, and an AI system extracting an answer, both had to get past that before
 * anything useful appeared. These pin the opening down so it cannot drift back.
 */
describe("answer-first structure", () => {
  const html = sample();
  const firstParagraph = (html.match(/<p>([\s\S]*?)<\/p>/)?.[1] ?? "").replace(/<[^>]+>/g, "");

  it("answers in the first paragraph instead of describing the page", () => {
    for (const preamble of ["this page explains", "this article", "in this guide", "we will look at"]) {
      expect(firstParagraph.toLowerCase(), preamble).not.toContain(preamble);
    }
  });

  it("names the subject in the opening sentence", () => {
    const firstSentence = firstParagraph.split(/(?<=\.)\s/)[0] ?? "";
    expect(firstSentence.toLowerCase()).toContain("ai solutions for healthcare");
  });

  it("gives an answer substantial enough to stand alone", () => {
    // Short enough to be quotable, long enough to actually answer.
    const words = firstParagraph.trim().split(/\s+/).length;
    expect(words).toBeGreaterThanOrEqual(40);
    expect(words).toBeLessThanOrEqual(120);
  });

  it("carries first-hand experience rather than only a byline", () => {
    const text = html.replace(/<[^>]+>/g, " ").toLowerCase();
    expect(text).toContain("how we know this works");
    // The claim that makes it experience rather than assertion: measured, and revisable.
    expect(text).toMatch(/measured before any build starts/);
  });
});

/**
 * Five hundred words is the minimum a programmatic page must clear, not the length it is written to.
 *
 * The writer used to stop appending sections the moment the count crossed the floor, so a page landed
 * just over it and the remaining sections — real content about the same topic, not padding — were
 * dropped. That made the floor behave as a ceiling.
 */
describe("the word floor is a minimum", () => {
  it("writes past the floor rather than stopping on it", () => {
    const words = bodyWordCount(composePageBody("Business Process Automation", "automation", "Manufacturing", "Automation"));
    expect(words).toBeGreaterThan(PSEO_MIN_WORDS + 100);
  });

  it("keeps every section it has to offer, with no heading written twice", () => {
    const html = composePageBody("Business Process Automation", "automation", "Manufacturing", "Automation");
    const headings = [...html.matchAll(/<h2>([^<]*)<\/h2>/g)].map((m) => m[1]);
    expect(headings.length).toBe(new Set(headings).size);
    expect(headings.length).toBeGreaterThanOrEqual(4);
  });
});
