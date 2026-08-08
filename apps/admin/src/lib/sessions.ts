/**
 * The session store: recording a sign-in, listing a person's live sessions, and ending one.
 *
 * The Active Sessions screen used to list three invented devices with invented IP addresses, and there
 * was nothing behind the "sign out" button because there was nothing to sign out — sessions were a
 * signed cookie and nothing else. These are the reads and writes that make that screen true and give a
 * person a way to end a session they do not recognise.
 */
import { db } from "./db.js";

export interface StaffSession {
  id: string;
  created_at: string;
  last_seen_at: string;
  expires_at: string;
  device: string | null;
  ip: string | null;
}

/**
 * A short, readable description of the browser and platform, for recognising your own devices.
 *
 * The full user-agent is a fingerprint, and keeping one would be collecting more about our own staff
 * than the screen needs, so only the browser and the operating system are stored.
 */
export function describeDevice(userAgent: string | null): string | null {
  if (!userAgent) return null;
  const browser =
    /\bEdg\//.test(userAgent) ? "Edge"
    : /\bOPR\/|\bOpera\b/.test(userAgent) ? "Opera"
    : /\bFirefox\//.test(userAgent) ? "Firefox"
    : /\bChrome\//.test(userAgent) ? "Chrome"
    : /\bSafari\//.test(userAgent) ? "Safari"
    : null;
  const platform =
    /\bWindows\b/.test(userAgent) ? "Windows"
    : /\biPhone\b/.test(userAgent) ? "iPhone"
    : /\biPad\b/.test(userAgent) ? "iPad"
    : /\bAndroid\b/.test(userAgent) ? "Android"
    : /\bMac OS X\b|\bMacintosh\b/.test(userAgent) ? "macOS"
    : /\bLinux\b/.test(userAgent) ? "Linux"
    : null;
  if (!browser && !platform) return null;
  return [platform, browser].filter(Boolean).join(" · ");
}

/**
 * The client address, read from the proxy header when there is one.
 *
 * `x-forwarded-for` is a list; the first entry is the client and the rest are proxies. It is also
 * client-controlled, so this is a hint for recognising a session, never an authorisation input.
 */
export function clientIp(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  const value = first || headers.get("x-real-ip") || null;
  if (!value) return null;
  // Postgres inet rejects anything malformed, and a bad header should not fail a sign-in.
  return /^[0-9a-fA-F:.]+$/.test(value) ? value : null;
}

/** Record a new sign-in and return the session id to put in the cookie. */
export async function startSession(
  staffId: string,
  maxAgeSeconds: number,
  headers: Headers,
): Promise<string | null> {
  try {
    const { rows } = await db().query<{ id: string }>(
      `INSERT INTO staff_session (staff_id, expires_at, device, ip)
       VALUES ($1, now() + ($2 || ' seconds')::interval, $3, $4::inet) RETURNING id`,
      [staffId, String(maxAgeSeconds), describeDevice(headers.get("user-agent")), clientIp(headers)],
    );
    return rows[0]?.id ?? null;
  } catch (err) {
    // A sign-in must not fail because the audit of it failed. The cookie is still signed and valid;
    // the session simply will not appear in the list.
    console.warn("[sessions] could not record sign-in:", err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Whether a session is still usable, and a note of when it was last seen.
 *
 * Returns true when there is no session id, because a cookie issued before the store existed is still
 * validly signed. Those sessions cannot be revoked and expire on their own.
 */
export async function sessionIsLive(sid: string | undefined): Promise<boolean> {
  if (!sid) return true;
  try {
    const { rows } = await db().query<{ ok: boolean }>(
      `UPDATE staff_session SET last_seen_at = now()
        WHERE id = $1 AND revoked_at IS NULL AND expires_at > now()
        RETURNING true AS ok`,
      [sid],
    );
    return rows.length > 0;
  } catch {
    // If the store cannot be read, fall back to trusting the signature rather than locking everyone out.
    return true;
  }
}

/** Every live session for one person, newest first. */
export async function listSessions(staffId: string): Promise<StaffSession[]> {
  const { rows } = await db().query<StaffSession>(
    `SELECT id, created_at::text, last_seen_at::text, expires_at::text, device, host(ip) AS ip
       FROM staff_session
      WHERE staff_id = $1 AND revoked_at IS NULL AND expires_at > now()
      ORDER BY last_seen_at DESC`,
    [staffId],
  );
  return rows;
}

/** End one session. Scoped to the owner, so a session id alone is not enough to end someone else's. */
export async function revokeSession(sessionId: string, staffId: string, actorId: string): Promise<boolean> {
  const { rowCount } = await db().query(
    `UPDATE staff_session SET revoked_at = now(), revoked_by = $3
      WHERE id = $1 AND staff_id = $2 AND revoked_at IS NULL`,
    [sessionId, staffId, actorId],
  );
  return (rowCount ?? 0) > 0;
}

/** End every session for a person except the one making the request. */
export async function revokeOtherSessions(staffId: string, keepSessionId: string | undefined): Promise<number> {
  const { rowCount } = await db().query(
    `UPDATE staff_session SET revoked_at = now(), revoked_by = $1
      WHERE staff_id = $1 AND revoked_at IS NULL AND ($2::uuid IS NULL OR id <> $2::uuid)`,
    [staffId, keepSessionId ?? null],
  );
  return rowCount ?? 0;
}
