/**
 * One-time password-reset tokens.
 *
 * The same stateless HMAC shape as the invitation token, with two deliberate differences:
 *
 *   * A separate signing prefix. Without it, a token minted for one purpose would verify for the
 *     other, and an invitation link — which is handed out freely and lives in an inbox for a week —
 *     would double as a password reset.
 *
 *   * Thirty minutes rather than seven days. A reset is acted on immediately; a long window is a long
 *     window for a forwarded or intercepted email.
 *
 * The token is also written to staff.reset_token, which is what makes it single-use: the signature
 * alone would keep verifying until it expired, so the stored copy is cleared the moment it is spent.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export const RESET_MAX_AGE_MINUTES = 30;

export interface ResetPayload { sub: string; email: string; exp: number }

function secret(): string {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value) throw new Error("ADMIN_SESSION_SECRET is not set.");
  return value;
}

/** The prefix is what separates a reset token from an invitation token of the same shape. */
function sign(data: string): string {
  return createHmac("sha256", secret()).update(`reset:${data}`).digest("base64url");
}

export function createResetToken(staffId: string, email: string): string {
  const payload: ResetPayload = {
    sub: staffId,
    email,
    exp: Math.floor(Date.now() / 1000) + RESET_MAX_AGE_MINUTES * 60,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifyResetToken(token: string | undefined): ResetPayload | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = sign(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  // Length is checked first because timingSafeEqual throws on a mismatch.
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as ResetPayload;
    if (typeof payload.exp !== "number" || payload.exp < Date.now() / 1000) return null;
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") return null;
    return payload;
  } catch {
    return null;
  }
}

/** The link a reset email carries. */
export function resetLink(origin: string, token: string): string {
  return `${origin.replace(/\/+$/, "")}/reset-password?token=${encodeURIComponent(token)}`;
}
