/**
 * The programmatic SEO publish gate.
 *
 * The floor is stated in words because that is what the owner asked for and what the editor's own
 * counter shows. It used to be measured in characters, where 1500 characters passed a page of roughly
 * 250 words: half the required length, through a unit nobody writing the page could see.
 *
 * Readiness used to arrive as a number the caller supplied, read from a "readiness_score" form field
 * that the generated-page form has never had. It was therefore null on every save, the gate saw 0
 * against a required 100, and no programmatic page could ever be published. It is measured from the
 * page now, so these fixtures have to be pages that genuinely satisfy the conditions.
 */
import { describe, it, expect } from "vitest";
import { evaluatePseoGate, applyPseoGate, MIN_BODY_WORDS } from "./pseo-gate.js";

/** An HTML body of `n` words, with the structure and the link a real page carries. */
function bodyOf(n: number, extras = true): string {
  const words = Array.from({ length: n }, (_, i) => `word${i}`).join(" ");
  if (!extras) return `<p>${words}</p>`;
  return (
    `<h2>First section</h2><p>${words}</p>` +
    `<h2>Second section</h2><p>See <a href="/ai-product-development/">our approach</a>.</p>` +
    `<h2>Third section</h2><p>Closing.</p>`
  );
}

/** 155 to 160 characters, finishing its sentence, which is what the meta condition asks for. */
const GOOD_META =
  "We design and build websites, apps and custom business software for companies across " +
  "Nigeria and abroad. Tell us the problem, and we will solve it properly.";

const passing = {
  body: bodyOf(MIN_BODY_WORDS),
  authorId: "a1",
  metaDescription: GOOD_META,
};

describe("evaluatePseoGate", () => {
  it("passes a page that meets every condition", () => {
    const result = evaluatePseoGate(passing);
    expect(result.failures).toEqual([]);
    expect(result.passes).toBe(true);
    expect(result.readinessScore).toBe(100);
  });

  it("passes at exactly the floor", () => {
    expect(evaluatePseoGate({ ...passing, body: bodyOf(MIN_BODY_WORDS) }).passes).toBe(true);
  });

  it("fails under the floor and says how far", () => {
    const result = evaluatePseoGate({ ...passing, body: bodyOf(MIN_BODY_WORDS - 20) });
    expect(result.passes).toBe(false);
    expect(result.failures.some((f) => f.includes("words"))).toBe(true);
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

  it("requires a named author and a meta description", () => {
    expect(evaluatePseoGate({ ...passing, authorId: null }).passes).toBe(false);
    expect(evaluatePseoGate({ ...passing, metaDescription: null }).passes).toBe(false);
  });

  it("measures readiness instead of accepting it", () => {
    // The exact failure this replaces: nothing supplied a score, so every page scored 0.
    const result = evaluatePseoGate(passing);
    expect(result.readinessScore).toBeGreaterThan(0);
  });

  it("holds a page that has no internal links", () => {
    const noLinks = `<h2>A</h2><p>${Array.from({ length: MIN_BODY_WORDS }, (_, i) => `word${i}`).join(" ")}</p><h2>B</h2><p>x</p><h2>C</h2><p>y</p>`;
    const result = evaluatePseoGate({ ...passing, body: noLinks });
    expect(result.passes).toBe(false);
    expect(result.failures.some((f) => /link/i.test(f))).toBe(true);
  });

  it("holds a page with too few sections", () => {
    const result = evaluatePseoGate({ ...passing, body: bodyOf(MIN_BODY_WORDS, false) });
    expect(result.passes).toBe(false);
    expect(result.failures.some((f) => /section/i.test(f))).toBe(true);
  });

  it("asks a location page to say something about the place", () => {
    const result = evaluatePseoGate({ ...passing, targetLocation: "Lagos" });
    expect(result.passes).toBe(false);
    expect(result.failures.some((f) => /Lagos/.test(f))).toBe(true);
  });

  it("accepts a location page that does", () => {
    const local = bodyOf(MIN_BODY_WORDS).replace("<h2>Third section</h2><p>Closing.</p>",
      "<h2>Working in Lagos</h2><p>Teams in Lagos run this differently, and Lagos traffic shapes the rollout.</p>");
    expect(evaluatePseoGate({ ...passing, body: local, targetLocation: "Lagos" }).passes).toBe(true);
  });

  it("asks nothing local of the national baseline page", () => {
    // "Nigeria" is the non-local default, so it has no city specifics to carry.
    expect(evaluatePseoGate({ ...passing, targetLocation: "Nigeria" }).passes).toBe(true);
  });

  it("lists every failure at once, so the editor sees the whole job", () => {
    const result = evaluatePseoGate({ body: "", authorId: null, metaDescription: null });
    expect(result.failures.length).toBeGreaterThanOrEqual(3);
  });
});

describe("applyPseoGate", () => {
  it("holds a failing page at draft and forces noindex", () => {
    const gate = evaluatePseoGate({ body: "", authorId: null, metaDescription: null });
    expect(applyPseoGate("published", false, gate)).toEqual({ status: "draft", noindex: true, heldBack: true });
  });

  it("lets a passing page through unchanged", () => {
    const gate = evaluatePseoGate(passing);
    expect(applyPseoGate("published", false, gate)).toEqual({ status: "published", noindex: false, heldBack: false });
  });

  it("never touches a draft", () => {
    const gate = evaluatePseoGate({ body: "", authorId: null, metaDescription: null });
    expect(applyPseoGate("draft", false, gate).heldBack).toBe(false);
  });
});

/**
 * "Global" is what the generated-page form has always defaulted to, and it is not one of the seven
 * locations the generator scores. Treated as a place, it asked a page to "say something specific to
 * Global" — a condition no page can satisfy, which held every default page at draft for a reason
 * that could not be acted on.
 */
describe("locations that are not places", () => {
  for (const location of ["Global", "global", "Nigeria", "Worldwide"]) {
    it(`asks for no local detail when the location is "${location}"`, () => {
      const result = evaluatePseoGate({ ...passing, targetLocation: location });
      expect(result.passes).toBe(true);
      expect(result.failures).toEqual([]);
    });
  }

  it("still requires local detail for a real place", () => {
    const result = evaluatePseoGate({ ...passing, targetLocation: "Port Harcourt" });
    expect(result.passes).toBe(false);
    expect(result.failures.join(" ")).toContain("Port Harcourt");
  });

  it("passes a real place once the body speaks about it", () => {
    const body = `${passing.body}<p>Our Port Harcourt team works across Port Harcourt.</p>`;
    expect(evaluatePseoGate({ ...passing, body, targetLocation: "Port Harcourt" }).passes).toBe(true);
  });
});
