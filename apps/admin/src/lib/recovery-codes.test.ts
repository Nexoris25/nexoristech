/**
 * Recovery codes, the pure parts.
 *
 * The database-backed half is exercised live rather than mocked: a fake pg client would prove the
 * mock behaves, and the property that matters, that a code cannot be spent twice, is a property of
 * the SQL rather than of this file.
 */
import { describe, expect, it } from "vitest";
import { normaliseCode } from "./recovery-codes.js";

describe("normaliseCode", () => {
  it("ignores the grouping, which is presentation", () => {
    expect(normaliseCode("ABCDE-FGHJK-MNPQR-STVWX")).toBe("ABCDEFGHJKMNPQRSTVWX");
  });

  it("ignores case and stray whitespace from a copy and paste", () => {
    expect(normaliseCode("  abcde-fghjk  ")).toBe("ABCDEFGHJK");
  });

  it("forgives the misreadings the alphabet was chosen to avoid", () => {
    // Someone reading a code off a screen writes O for zero and l for one. The alphabet contains
    // neither letter, so folding them in can never turn one valid code into a different valid one.
    expect(normaliseCode("O0o")).toBe("000");
    expect(normaliseCode("Il1L")).toBe("1111");
  });

  it("is idempotent, so normalising a normalised code changes nothing", () => {
    const once = normaliseCode("abcde-fghjk-mnpqr-stvwx");
    expect(normaliseCode(once)).toBe(once);
  });
});
