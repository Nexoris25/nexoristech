/**
 * One-time invitation tokens for the user-invite flow. Same stateless HMAC pattern as the session
 * (keyed by ADMIN_SESSION_SECRET): a base64url payload plus a signature, with a 7-day expiry. The token
 * is also stored on the staff row so it can be invalidated the moment the invite is accepted.
 *
 * Invitations are not emailed. An admin creates the invite and gets a link to share however they
 * already talk to the person. That keeps the flow working with no mail server to configure, and it means
 * the link is always retrievable later rather than lost in an inbox.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";

const INVITE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface InvitePayload { sub: string; email: string; exp: number }

function secret(): string {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value) throw new Error("ADMIN_SESSION_SECRET is not set.");
  return value;
}
function sign(data: string): string {
  return createHmac("sha256", secret()).update(`invite:${data}`).digest("base64url");
}

export function createInviteToken(staffId: string, email: string): string {
  const payload: InvitePayload = { sub: staffId, email, exp: Math.floor(Date.now() / 1000) + INVITE_MAX_AGE_SECONDS };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifyInviteToken(token: string | undefined): InvitePayload | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = sign(body);
  const a = Buffer.from(signature), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as InvitePayload;
    if (typeof payload.exp !== "number" || payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch { return null; }
}

/** The absolute app origin used to build invite links. Set APP_URL in production. */
export function appOrigin(): string {
  return (process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3102").replace(/\/+$/, "");
}

/** A loopback address: fine for a server talking to itself, useless in a link sent to a person. */
function isLoopback(origin: string): boolean {
  return /^https?:\/\/(localhost|127\.|\[::1\])/i.test(origin.trim());
}

/**
 * The origin to put in a shared link. Prefers the host the admin is actually on, so a link copied from
 * a staging or LAN address is reachable by the person it is sent to. APP_URL wins when set, because in
 * production the public address is the one that matters and the request host may be an internal one.
 *
 * Except when APP_URL is a loopback address in production, which is the one case where obeying it is
 * certainly wrong. Several variables in this deployment are *meant* to be localhost — the gateway and
 * the media origin are server-to-server and never reach a browser — so a deployment that copies
 * .env.local forward is likely to carry APP_URL=http://localhost:3102 with them. That value does
 * reach a person: it is the invitation and password-reset link. Nobody can open it but the server
 * itself, and now that links are handed over by hand rather than emailed, it is the only way in.
 *
 * So in production a loopback APP_URL is ignored in favour of the host the request actually arrived
 * on, which is the address the admin is looking at and therefore one that resolves. In development it
 * is honoured, because there localhost is the truth.
 */
export async function shareOrigin(): Promise<string> {
  const configured = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  const usable =
    configured && !(process.env.NODE_ENV === "production" && isLoopback(configured))
      ? configured
      : undefined;
  if (usable) return usable.replace(/\/+$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return appOrigin();
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

/** The full link an invited person follows to set their password. */
export function inviteLink(origin: string, token: string): string {
  return `${origin}/accept-invite?token=${encodeURIComponent(token)}`;
}
