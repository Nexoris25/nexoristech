/**
 * Password-reset tokens.
 *
 * A flaw here hands over an account, so the properties below are the ones worth stating explicitly:
 * a token must not verify if it was tampered with, if it has expired, or if it was minted for a
 * different purpose.
 */
import { describe, it, expect, beforeAll, vi, afterEach } from "vitest";
import { createResetToken, verifyResetToken, resetLink, RESET_MAX_AGE_MINUTES } from "./reset.js";
import { createInviteToken } from "./invite.js";

beforeAll(() => {
  process.env.ADMIN_SESSION_SECRET = "test-secret-not-used-anywhere-real";
});
afterEach(() => vi.useRealTimers());

const ID = "11111111-2222-3333-4444-555555555555";
const EMAIL = "person@nexoristech.com";

describe("createResetToken / verifyResetToken", () => {
  it("round-trips the account it was minted for", () => {
    const payload = verifyResetToken(createResetToken(ID, EMAIL));
    expect(payload?.sub).toBe(ID);
    expect(payload?.email).toBe(EMAIL);
  });

  it("rejects a token whose payload was edited", () => {
    const token = createResetToken(ID, EMAIL);
    const [body, signature] = token.split(".");
    // Re-encode the payload pointing at a different account, keeping the original signature.
    const tampered = Buffer.from(
      JSON.stringify({ sub: "99999999-9999-9999-9999-999999999999", email: EMAIL, exp: 2_000_000_000 }),
    ).toString("base64url");
    expect(verifyResetToken(`${tampered}.${signature}`)).toBeNull();
    expect(verifyResetToken(`${body}.not-the-signature`)).toBeNull();
  });

  it("rejects an invitation token, which is the same shape signed for another purpose", () => {
    // Without separate signing prefixes an invitation — handed out freely, valid for a week — would
    // double as a password reset.
    expect(verifyResetToken(createInviteToken(ID, EMAIL))).toBeNull();
  });

  it("expires", () => {
    const token = createResetToken(ID, EMAIL);
    expect(verifyResetToken(token)).not.toBeNull();
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + (RESET_MAX_AGE_MINUTES + 1) * 60_000);
    expect(verifyResetToken(token)).toBeNull();
  });

  it("expires in minutes, not days", () => {
    // A reset is acted on immediately; a long window is a long window for a forwarded email.
    expect(RESET_MAX_AGE_MINUTES).toBeLessThanOrEqual(60);
  });

  it("rejects malformed input rather than throwing", () => {
    for (const v of [undefined, "", "no-dot", "a.b.c", "....", "!!!.???"]) {
      expect(verifyResetToken(v as string | undefined)).toBeNull();
    }
  });
});

describe("resetLink", () => {
  it("builds a link the reset page can read, with the token encoded", () => {
    const token = createResetToken(ID, EMAIL);
    const link = resetLink("https://admin.nexoristech.com", token);
    expect(link).toBe(`https://admin.nexoristech.com/reset-password?token=${encodeURIComponent(token)}`);
  });

  it("does not double the slash when the origin has a trailing one", () => {
    expect(resetLink("https://admin.nexoristech.com/", "t")).toContain(".com/reset-password?");
  });
});
