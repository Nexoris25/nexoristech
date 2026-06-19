import { describe, it, expect } from "vitest";
import { normaliseQuery, queryHash } from "./normalise.js";

describe("normaliseQuery", () => {
  it("lowercases, collapses whitespace, and trims trailing punctuation", () => {
    expect(normaliseQuery("  How  MUCH is a Website?? ")).toBe(
      "how much is a website",
    );
  });

  it("treats spacing and case variants as the same query", () => {
    expect(normaliseQuery("How much is a website")).toBe(
      normaliseQuery("how   much is a website."),
    );
  });
});

describe("queryHash", () => {
  it("is stable for equivalent queries at the same version", () => {
    expect(queryHash("How much is a website?", "v1")).toBe(
      queryHash("how much is a website", "v1"),
    );
  });

  it("changes when the knowledge-base version changes", () => {
    expect(queryHash("how much is a website", "v1")).not.toBe(
      queryHash("how much is a website", "v2"),
    );
  });

  it("differs for genuinely different queries", () => {
    expect(queryHash("how much is a website", "v1")).not.toBe(
      queryHash("how long does a project take", "v1"),
    );
  });
});
