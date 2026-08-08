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
    const failures = evaluatePseoGate({
      body: sample(), authorId: "a1", readinessScore: 100, metaDescription: "Set.",
    }).failures;
    expect(failures).toEqual([]);
  });

  it("uses the same floor the gate enforces", () => {
    expect(PSEO_MIN_WORDS).toBe(MIN_BODY_WORDS);
  });

  it("carries the topic, industry and service through the copy", () => {
    const html = sample();
    expect(html).toContain("Healthcare");
    expect(html).toContain("ai solutions for healthcare");
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
