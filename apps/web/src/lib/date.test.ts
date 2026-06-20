import { describe, it, expect } from "vitest";
import { resolveDateTokens, formatLagosDate } from "./date.js";

const fixed = new Date("2026-06-20T10:00:00Z");

describe("resolveDateTokens", () => {
  it("resolves the year", () => {
    expect(resolveDateTokens("Best CRM in [year]", fixed)).toBe(
      "Best CRM in 2026",
    );
  });

  it("resolves the month and the month-year", () => {
    expect(resolveDateTokens("[month] update", fixed)).toBe("June update");
    expect(resolveDateTokens("Pricing as of [month-year]", fixed)).toBe(
      "Pricing as of June 2026",
    );
  });

  it("is case-insensitive and leaves other text untouched", () => {
    expect(resolveDateTokens("In [YEAR] and beyond", fixed)).toBe(
      "In 2026 and beyond",
    );
    expect(resolveDateTokens("No tokens here", fixed)).toBe("No tokens here");
  });
});

describe("formatLagosDate", () => {
  it("formats an ISO date in the Lagos timezone", () => {
    expect(formatLagosDate("2026-06-20T10:00:00Z")).toContain("2026");
  });

  it("returns empty for an invalid date", () => {
    expect(formatLagosDate("not-a-date")).toBe("");
  });
});
