/**
 * The HowTo node.
 *
 * HowTo has a required `step` list, which is the reason it is a node of its own rather than another
 * entry in ARTICLE_TYPES. These pin the parts Google validates.
 */
import { describe, it, expect } from "vitest";
import { howToNode } from "./content.js";
import { ARTICLE_TYPES, isArticleType } from "./content.js";

const base = {
  path: "/insights/set-up-nhis-claims",
  name: "How to set up NHIS claims",
  description: "A step-by-step guide for Nigerian clinics.",
  steps: [
    { name: "Register the facility", text: "Submit the facility details to the scheme.", anchor: "register-the-facility" },
    { name: "Map your services", text: "Match each service to its scheme code." },
  ],
};

describe("howToNode", () => {
  it("emits a HowTo, not an Article", () => {
    expect(howToNode(base)["@type"]).toBe("HowTo");
  });

  it("carries the required name and description", () => {
    const n = howToNode(base);
    expect(n.name).toBe("How to set up NHIS claims");
    expect(n.description).toBe("A step-by-step guide for Nigerian clinics.");
  });

  it("emits one HowToStep per step, in order", () => {
    const steps = howToNode(base).step as Record<string, unknown>[];
    expect(steps).toHaveLength(2);
    expect(steps.map((s) => s["@type"])).toEqual(["HowToStep", "HowToStep"]);
    expect(steps.map((s) => s.position)).toEqual([1, 2]);
  });

  it("gives every step the text Google requires", () => {
    const steps = howToNode(base).step as Record<string, unknown>[];
    for (const s of steps) expect(typeof s.text).toBe("string");
    expect(steps[0]!.text).toBe("Submit the facility details to the scheme.");
  });

  it("deep-links a step that has an anchor", () => {
    const steps = howToNode(base).step as Record<string, unknown>[];
    expect(String(steps[0]!.url)).toContain("#register-the-facility");
  });

  it("leaves the url off a step with no anchor rather than inventing one", () => {
    const steps = howToNode(base).step as Record<string, unknown>[];
    expect(steps[1]!.url).toBeUndefined();
  });

  it("dates itself, falling back to the publish date when never updated", () => {
    const n = howToNode({ ...base, datePublished: "2026-08-01" });
    expect(n.datePublished).toBe("2026-08-01");
    expect(n.dateModified).toBe("2026-08-01");
  });

  it("accepts a guide with no steps without inventing any", () => {
    expect(howToNode({ ...base, steps: [] }).step).toEqual([]);
  });
});

describe("HowTo is kept out of the article types", () => {
  it("is not an article subtype, because it needs a step list an Article cannot carry", () => {
    expect(ARTICLE_TYPES as readonly string[]).not.toContain("HowTo");
    expect(isArticleType("HowTo")).toBe(false);
  });
});
