import { describe, it, expect } from "vitest";
import { stripEmDash } from "./generation.js";

describe("stripEmDash", () => {
  it("replaces an em dash with a comma and space", () => {
    expect(stripEmDash("clearly—how it works")).toBe("clearly, how it works");
  });

  it("collapses surrounding spaces around the em dash", () => {
    expect(stripEmDash("goals  —  the plan")).toBe("goals, the plan");
  });

  it("leaves text without an em dash untouched, including hyphens", () => {
    expect(stripEmDash("a well-written, plain reply")).toBe(
      "a well-written, plain reply",
    );
  });
});
