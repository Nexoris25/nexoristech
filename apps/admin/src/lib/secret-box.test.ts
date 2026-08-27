/**
 * Sealing credentials. The properties that matter are the ones a leaked database depends on: the
 * ciphertext must not contain the secret, a tampered row must fail rather than decrypt, and a missing
 * key must produce nothing rather than something readable.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { hint, open, seal, sealingAvailable } from "./secret-box.js";

const KEY_A = "a".repeat(64);
const KEY_B = "b".repeat(64);
const SECRET = "37261ec1832416d18fdd1bb3f44c0b32";

let saved: string | undefined;
beforeEach(() => {
  saved = process.env.ADMIN_SETTINGS_KEY;
  process.env.ADMIN_SETTINGS_KEY = KEY_A;
});
afterEach(() => {
  if (saved === undefined) delete process.env.ADMIN_SETTINGS_KEY;
  else process.env.ADMIN_SETTINGS_KEY = saved;
});

describe("seal and open", () => {
  it("round-trips a secret", () => {
    const sealed = seal(SECRET);
    expect(sealed).not.toBeNull();
    expect(open(sealed)).toBe(SECRET);
  });

  it("does not leave the secret in the stored value", () => {
    const sealed = seal(SECRET) as string;
    expect(sealed).not.toContain(SECRET);
    // Nor any run of it long enough to be a useful start.
    expect(sealed).not.toContain(SECRET.slice(0, 8));
  });

  it("produces a different sealed value every time, so equal secrets are not visibly equal", () => {
    expect(seal(SECRET)).not.toBe(seal(SECRET));
  });

  it("refuses to open a value tampered with in the database", () => {
    const sealed = seal(SECRET) as string;
    const parts = sealed.split(".");
    // Flip one character of the ciphertext, which is what an edited row looks like.
    const body = parts[3] as string;
    const flipped = `${body.slice(0, -1)}${body.endsWith("A") ? "B" : "A"}`;
    expect(open([parts[0], parts[1], parts[2], flipped].join("."))).toBeNull();
  });

  it("refuses to open a value sealed under a different key", () => {
    const sealed = seal(SECRET);
    process.env.ADMIN_SETTINGS_KEY = KEY_B;
    expect(open(sealed)).toBeNull();
  });

  it("refuses a malformed or unknown-version value rather than guessing", () => {
    expect(open("not-sealed-at-all")).toBeNull();
    expect(open("v2.a.b.c")).toBeNull();
    expect(open(null)).toBeNull();
  });

  it("seals nothing when no key is configured, rather than storing it readable", () => {
    delete process.env.ADMIN_SETTINGS_KEY;
    expect(sealingAvailable()).toBe(false);
    expect(seal(SECRET)).toBeNull();
  });

  it("rejects a key that is not 32 bytes of hex", () => {
    process.env.ADMIN_SETTINGS_KEY = "tooshort";
    expect(sealingAvailable()).toBe(false);
    process.env.ADMIN_SETTINGS_KEY = "z".repeat(64);
    expect(sealingAvailable()).toBe(false);
  });
});

describe("hint", () => {
  it("shows only the tail", () => {
    expect(hint("9255d65d0045377d85952b588940c615")).toBe("c615");
  });

  it("shows nothing for a value too short to hide anything", () => {
    expect(hint("abcd")).toBe("");
  });
});
