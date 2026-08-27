/**
 * The three things that made generated pages worse than they had to be.
 *
 * Acronyms: sentence case raised only the first letter, so "ai solutions for healthcare" published
 * as "Ai solutions for healthcare" in the opening sentence and in a heading. Nearly every keyword
 * this platform generates for starts with one.
 *
 * Internal links: the composed body carried none, on pages whose own readiness gate asks for at
 * least one. Every generated page was a dead end that failed its own check.
 *
 * Templates: the picker stored a choice that never reached the generator, so all five templates
 * produced the same eight headings.
 */
import { describe, it, expect } from "vitest";
import { composePageBody, bodyWordCount, fixAcronyms, sentenceCase, PSEO_MIN_WORDS } from "./oge-content.js";
import { computeReadiness } from "./pseo-readiness.js";

describe("acronym casing", () => {
  it("keeps acronyms upper case wherever they appear", () => {
    expect(fixAcronyms("ai solutions for healthcare")).toBe("AI solutions for healthcare");
    expect(fixAcronyms("crm and hr reporting")).toBe("CRM and HR reporting");
    expect(fixAcronyms("iot for logistics")).toBe("IoT for logistics");
  });

  it("leaves ordinary words alone", () => {
    expect(fixAcronyms("software for hospitals")).toBe("software for hospitals");
  });

  it("does not lower-case an acronym to sentence case it", () => {
    expect(sentenceCase("ai solutions")).toBe("AI solutions");
    expect(sentenceCase("healthcare software")).toBe("Healthcare software");
  });
});

describe("composePageBody", () => {
  const args = ["AI Solutions for Healthcare in Lagos", "ai solutions for healthcare", "Healthcare", "AI Solutions"] as const;

  it("writes the topic with correct casing", () => {
    const html = composePageBody(...args);
    expect(html).toContain("AI solutions for healthcare");
    expect(html).not.toContain("Ai solutions");
  });

  it("carries internal links, which its own readiness gate requires", () => {
    const html = composePageBody(...args);
    expect(html).toMatch(/<a\s[^>]*href=/);
  });

  it("clears the word floor", () => {
    expect(bodyWordCount(composePageBody(...args))).toBeGreaterThanOrEqual(PSEO_MIN_WORDS);
  });

  it("follows a template's sections when one is chosen", () => {
    const sections = ["Hero Section", "Benefits Section", "Case Studies", "Call To Action"];
    const html = composePageBody(...args, sections);
    for (const name of sections) expect(html, name).toContain(`<h2>${name}</h2>`);
  });

  it("still clears the floor with a short template, by adding real sections", () => {
    const html = composePageBody(...args, ["Hero Section", "Call To Action"]);
    expect(bodyWordCount(html)).toBeGreaterThanOrEqual(PSEO_MIN_WORDS);
  });

  it("never repeats a heading when topping up", () => {
    const html = composePageBody(...args, ["Hero Section", "What it takes from your side"]);
    const headings = [...html.matchAll(/<h2>([^<]*)<\/h2>/g)].map((m) => m[1]);
    expect(new Set(headings).size).toBe(headings.length);
  });

  it("says plainly when a section is an outline rather than filling it with pretend copy", () => {
    const html = composePageBody(...args, ["Regulatory Position"]);
    expect(html).toContain("<h2>Regulatory Position</h2>");
    expect(html).toMatch(/outline for the editor/i);
  });
});

describe("computeReadiness", () => {
  const good = {
    body: composePageBody("AI Solutions for Healthcare", "ai solutions for healthcare", "Healthcare", "AI Solutions"),
    authorId: "a1",
    metaDescription:
      "We design and build websites, apps and custom business software for companies across " +
      "Nigeria and abroad. Tell us the problem, and we will solve it properly.",
  };

  it("scores a complete page at 100", () => {
    expect(computeReadiness(good).score).toBe(100);
  });

  it("is measured, not supplied: an empty page scores low and says why", () => {
    const r = computeReadiness({ body: "", authorId: null, metaDescription: null });
    expect(r.score).toBeLessThan(50);
    expect(r.unmet.length).toBeGreaterThan(2);
  });

  it("asks a location page for local detail", () => {
    const r = computeReadiness({ ...good, targetLocation: "Lagos" });
    expect(r.score).toBeLessThan(100);
    expect(r.unmet.some((u) => u.includes("Lagos"))).toBe(true);
  });

  it("asks nothing local of the national baseline", () => {
    expect(computeReadiness({ ...good, targetLocation: "Nigeria" }).score).toBe(100);
  });

  it("names every condition so the editor sees the whole job", () => {
    const r = computeReadiness({ body: "", authorId: null, metaDescription: null });
    expect(r.conditions).toHaveLength(6);
    for (const c of r.conditions) expect(typeof c.label).toBe("string");
  });
});
