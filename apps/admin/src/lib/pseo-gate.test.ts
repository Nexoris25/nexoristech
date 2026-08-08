/**
 * The programmatic SEO publish gate.
 *
 * The floor is stated in words because that is what the owner asked for and what the editor's own
 * counter shows. It used to be measured in characters, where 1500 characters passed a page of roughly
 * 250 words: half the required length, through a unit nobody writing the page could see.
 */
import { describe, it, expect } from "vitest";
import { evaluatePseoGate, applyPseoGate, MIN_BODY_WORDS } from "./pseo-gate.js";

/** An HTML body of exactly `n` words. */
function bodyOf(n: number): string {
  return `<p>${Array.from({ length: n }, (_, i) => `word${i}`).join(" ")}</p>`;
}

const passing = {
  body: bodyOf(MIN_BODY_WORDS),
  authorId: "a1",
  readinessScore: 100,
  metaDescription: "A written meta description for this page.",
};

describe("evaluatePseoGate", () => {
  it("passes a page that meets every condition", () => {
    expect(evaluatePseoGate(passing)).toEqual({ passes: true, failures: [] });
  });

  it("passes at exactly the floor", () => {
    expect(evaluatePseoGate({ ...passing, body: bodyOf(MIN_BODY_WORDS) }).passes).toBe(true);
  });

  it("fails one word under the floor", () => {
    const result = evaluatePseoGate({ ...passing, body: bodyOf(MIN_BODY_WORDS - 1) });
    expect(result.passes).toBe(false);
    expect(result.failures[0]).toContain(`${MIN_BODY_WORDS - 1} words`);
  });

  it("counts words of visible text, not characters of markup", () => {
    // Markup alone used to satisfy a character floor. Twenty words in heavy markup is twenty words.
    const markupHeavy = Array.from({ length: 20 }, (_, i) =>
      `<div class="a-very-long-class-name-that-adds-characters"><span data-x="${i}">word${i}</span></div>`).join("");
    expect(markupHeavy.length).toBeGreaterThan(1500);
    expect(evaluatePseoGate({ ...passing, body: markupHeavy }).passes).toBe(false);
  });

  it("reports an empty body as having no content rather than as thin", () => {
    expect(evaluatePseoGate({ ...passing, body: "" }).failures).toContain("The page has no body content.");
    expect(evaluatePseoGate({ ...passing, body: "   <p> </p>  " }).failures).toContain("The page has no body content.");
  });

  it("requires a named author, a readiness score and a meta description", () => {
    expect(evaluatePseoGate({ ...passing, authorId: null }).passes).toBe(false);
    expect(evaluatePseoGate({ ...passing, readinessScore: 99 }).passes).toBe(false);
    expect(evaluatePseoGate({ ...passing, metaDescription: null }).passes).toBe(false);
  });

  it("lists every failure at once, so the editor sees the whole job", () => {
    const result = evaluatePseoGate({ body: "", authorId: null, readinessScore: 0, metaDescription: null });
    expect(result.failures).toHaveLength(4);
  });
});

describe("applyPseoGate", () => {
  it("holds a failing page at draft and forces noindex", () => {
    const gate = evaluatePseoGate({ ...passing, body: bodyOf(10) });
    expect(applyPseoGate("published", false, gate)).toEqual({ status: "draft", noindex: true, heldBack: true });
  });

  it("lets a passing page publish with the requested noindex", () => {
    const gate = evaluatePseoGate(passing);
    expect(applyPseoGate("published", false, gate)).toEqual({ status: "published", noindex: false, heldBack: false });
  });

  it("does not interfere with a draft that was never asked to publish", () => {
    const gate = evaluatePseoGate({ ...passing, body: "" });
    expect(applyPseoGate("draft", false, gate)).toEqual({ status: "draft", noindex: false, heldBack: false });
  });
});
