import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { home } from "./core/home.js";
import { about } from "./core/about.js";
import { howWeWork } from "./core/how-we-work.js";
import { caseStudies } from "./core/case-studies.js";
import { contact } from "./core/contact.js";
import { servicePages } from "./services/index.js";
import { industryPages } from "./industries/index.js";
import { collectVerbatimStrings, normalizeWhitespace } from "./fidelity.js";
import type { MarketingPage } from "./types.js";

/** Read an approved copy file from content-source, resolved relative to this test. */
function readSource(file: string): string {
  const url = new URL(`../../../../content-source/${file}`, import.meta.url);
  return normalizeWhitespace(readFileSync(fileURLToPath(url), "utf8"));
}

/** Assert every verbatim string a page renders appears in the approved source. */
function expectFidelity(page: MarketingPage, source: string): void {
  const normalizedSource = source;
  const missing = collectVerbatimStrings(page)
    .map((value) => normalizeWhitespace(value))
    .filter((value) => !normalizedSource.includes(value));
  expect(
    missing,
    `Strings not found verbatim in the approved copy:\n${missing.join("\n")}`,
  ).toEqual([]);
}

describe("content fidelity: core pages", () => {
  const coreSource = readSource("01-core-pages.md");

  it("Home matches the approved copy verbatim", () => {
    expectFidelity(home, coreSource);
  });

  it("About matches the approved copy verbatim", () => {
    expectFidelity(about, coreSource);
  });

  it("How We Work matches the approved copy verbatim", () => {
    expectFidelity(howWeWork, coreSource);
  });

  it("Case Studies hub matches the approved copy verbatim", () => {
    expectFidelity(caseStudies, coreSource);
  });

  it("Contact matches the approved copy verbatim", () => {
    expectFidelity(contact, coreSource);
  });

  it("every core page meta title stays within 60 characters", () => {
    for (const page of [home, about, howWeWork, caseStudies, contact]) {
      expect(page.meta.title.length, page.meta.slug).toBeLessThanOrEqual(60);
    }
  });

  it("every core page meta description stays within 160 characters", () => {
    for (const page of [home, about, howWeWork, caseStudies, contact]) {
      expect(page.meta.description.length, page.meta.slug).toBeLessThanOrEqual(
        160,
      );
    }
  });
});

describe("content fidelity: service pages", () => {
  const serviceSource = readSource("02-service-pages.md");

  for (const page of servicePages) {
    it(`${page.meta.slug} matches the approved copy verbatim`, () => {
      expectFidelity(page, serviceSource);
    });
  }

  it("every service page meta stays within limits", () => {
    for (const page of servicePages) {
      expect(page.meta.title.length, page.meta.slug).toBeLessThanOrEqual(60);
      expect(page.meta.description.length, page.meta.slug).toBeLessThanOrEqual(
        160,
      );
    }
  });
});

describe("content fidelity: industry pages", () => {
  const industrySource = readSource("03-industry-pages.md");

  for (const page of industryPages) {
    it(`${page.meta.slug} matches the approved copy verbatim`, () => {
      expectFidelity(page, industrySource);
    });
  }

  it("every industry page meta stays within limits", () => {
    for (const page of industryPages) {
      expect(page.meta.title.length, page.meta.slug).toBeLessThanOrEqual(60);
      expect(page.meta.description.length, page.meta.slug).toBeLessThanOrEqual(
        160,
      );
    }
  });
});
