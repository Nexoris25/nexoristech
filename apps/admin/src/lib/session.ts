/**
 * Signed sessions for the admin dashboard. A session is a base64url JSON payload plus an HMAC-SHA256
 * signature over it, keyed by ADMIN_SESSION_SECRET, with an expiry. No dependency.
 *
 * The payload also carries `sid`, the id of a row in staff_session. The signature proves the cookie was
 * issued by us; the row is what makes the session revocable. Without it a stolen cookie stayed valid
 * until its own expiry and nothing could end it, and the Active Sessions screen had nothing real to show.
 *
 * `sid` is optional on the type so a cookie issued before this existed still verifies. Those sessions
 * cannot be listed or revoked, and they expire on their own within thirty days.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Role } from "./crm-constants.js";

const MAX_AGE_SECONDS = 60 * 60 * 24; // one day for a standard sign-in
const REMEMBER_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // thirty days with "keep me signed in"

export interface SessionPayload {
  sub: string; // staff id
  /**
   * The staff role this cookie carries.
   *
   * Kept in step with ROLES in crm-constants: "ceo" and "executive" were added to the role model and
   * the database constraint but not here, so the type stopped describing what the cookie could
   * actually hold and TypeScript could no longer protect this path.
   */
  role: Role;
  name: string;
  exp: number; // unix seconds
  /** staff_session.id. Absent only on cookies issued before the session store existed. */
  sid?: string;
}

function secret(): string {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value) throw new Error("ADMIN_SESSION_SECRET is not set.");
  return value;
}

function sign(data: string): string {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

/**
 * Create a signed session token for a staff member.
 *
 * `maxAgeSeconds` is how long it lasts, which the caller takes from the configured session timeout so
 * the token, the cookie and the session row all expire together. `sid` is the staff_session row this
 * cookie belongs to, which is what allows it to be revoked.
 */
export function createSession(
  staff: { id: string; role: SessionPayload["role"]; name: string },
  maxAgeSeconds: number = MAX_AGE_SECONDS,
  sid?: string,
): string {
  const maxAge = maxAgeSeconds;
  const payload: SessionPayload = {
    sub: staff.id,
    role: staff.role,
    name: staff.name,
    exp: Math.floor(Date.now() / 1000) + maxAge,
    ...(sid ? { sid } : {}),
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
