import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { home } from "./core/home.js";
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

  it("Home carries the approved meta title and description", () => {
    expect(home.meta.title).toBe(
      "Software Development Company in Lagos | Nexoris Technologies",
    );
    expect(home.meta.description.length).toBeLessThanOrEqual(160);
  });
});
