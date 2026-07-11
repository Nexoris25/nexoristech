/**
 * Stateless signed sessions for the admin dashboard. A session is a base64url JSON payload plus an
 * HMAC-SHA256 signature over it, keyed by ADMIN_SESSION_SECRET, with an expiry. No dependency and
 * no server-side session store; the cookie carries the staff id and role, and active status is
 * re-checked against the database on every request (see auth.ts).
 */
import { createHmac, timingSafeEqual } from "node:crypto";

const MAX_AGE_SECONDS = 60 * 60 * 24; // one day for a standard sign-in
const REMEMBER_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // thirty days with "keep me signed in"

export interface SessionPayload {
  sub: string; // staff id
  role: "admin" | "salesperson" | "viewer";
  name: string;
  exp: number; // unix seconds
}

function secret(): string {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value) throw new Error("ADMIN_SESSION_SECRET is not set.");
  return value;
}

function sign(data: string): string {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

/** Create a signed session token for a staff member. "Keep me signed in" extends it to 30 days. */
export function createSession(
  staff: { id: string; role: SessionPayload["role"]; name: string },
  remember = false,
): string {
  const maxAge = remember ? REMEMBER_MAX_AGE_SECONDS : MAX_AGE_SECONDS;
  const payload: SessionPayload = {
    sub: staff.id,
    role: staff.role,
    name: staff.name,
    exp: Math.floor(Date.now() / 1000) + maxAge,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

/** Verify a session token, returning its payload or null if invalid or expired. */
export function verifySession(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = sign(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp < Date.now() / 1000) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = "nx_admin_session";
export const SESSION_MAX_AGE = MAX_AGE_SECONDS;
export const REMEMBER_SESSION_MAX_AGE = REMEMBER_MAX_AGE_SECONDS;
