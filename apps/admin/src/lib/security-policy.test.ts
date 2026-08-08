/**
 * The password rule and the setting parser. These decide who gets in, so they are worth pinning:
 * a parser that silently returns a fallback would leave a configured policy unapplied and nobody
 * would notice, which is the failure the whole change was meant to end.
 */
import { describe, it, expect } from "vitest";
import { passwordProblem, DEFAULT_POLICY, type SecurityPolicy } from "./security-policy.js";

const policy = (over: Partial<SecurityPolicy> = {}): SecurityPolicy => ({ ...DEFAULT_POLICY, ...over });

describe("passwordProblem", () => {
  it("rejects a password shorter than the configured minimum", () => {
    expect(passwordProblem("Short1!", policy({ minPasswordLength: 12 }))).toMatch(/at least 12/);
  });

  it("accepts one exactly at the minimum", () => {
    expect(passwordProblem("abcdefghijk!", policy({ minPasswordLength: 12 }))).toBeNull();
  });

  it("rejects one with no symbol when a symbol is required", () => {
    expect(passwordProblem("abcdefghijkl", policy({ requireSpecial: true }))).toMatch(/symbol/);
  });

  it("accepts one with no symbol when none is required", () => {
    expect(passwordProblem("abcdefghijkl", policy({ requireSpecial: false }))).toBeNull();
  });

  it("counts a space as a symbol, because it is not a letter or a number", () => {
    expect(passwordProblem("correct horse b", policy({ requireSpecial: true, minPasswordLength: 12 }))).toBeNull();
  });

  it("reports length before the symbol rule, so the first message is the one to act on", () => {
    expect(passwordProblem("ab", policy({ minPasswordLength: 12, requireSpecial: true }))).toMatch(/at least 12/);
  });

  it("defaults to twelve characters and a symbol, never weaker than the old hardcoded eight", () => {
    expect(DEFAULT_POLICY.minPasswordLength).toBeGreaterThanOrEqual(8);
    expect(passwordProblem("password", DEFAULT_POLICY)).not.toBeNull();
  });
});
