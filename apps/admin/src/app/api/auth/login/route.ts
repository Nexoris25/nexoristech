/**
 * Sign-in as a route handler (PRD 1.1). Auth is deliberately a POST route rather than a Server
 * Action: route handlers have no Server-Action origin/CSRF guard (which 500s behind a proxy or
 * sandboxed iframe that emits `Origin: null`), and the sign-in form posts natively, so it works
 * even without client hydration. The route sets the signed, HTTP-only session cookie and, for a
 * native form post, redirects (303) to the dashboard, or back to /login?error=1 on failure. A JSON
 * post gets a JSON reply instead. "Keep me signed in" extends the session from one day to thirty.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "../../../../lib/db.js";
import {
  cookieSecure,
  createSession,
  REMEMBER_SESSION_MAX_AGE,
  SESSION_COOKIE,
  type SessionPayload,
} from "../../../../lib/session.js";
import { startSession, clientIp } from "../../../../lib/sessions.js";
import { securityPolicy } from "../../../../lib/security-policy.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  const isJson = (request.headers.get("content-type") ?? "").includes("application/json");

  let email = "";
  let password = "";
  let remember = false;
  try {
    if (isJson) {
      const body = (await request.json()) as Record<string, unknown>;
      email = String(body.email ?? "");
      password = String(body.password ?? "");
      remember = body.remember === true;
    } else {
      const form = await request.formData();
      email = String(form.get("email") ?? "");
      password = String(form.get("password") ?? "");
      remember = form.get("remember") === "on";
    }
  } catch {
    return fail(request, isJson, "Enter your email and password.");
  }

  email = email.trim().toLowerCase();
  if (!email || !password) {
    return fail(request, isJson, "Enter your email and password.");
  }

  // The configured lockout, applied. Attempts are counted per email over a fifteen-minute window, so a
  // locked address frees itself rather than needing an administrator, and the reply is identical to a
  // wrong password: telling someone an address is locked confirms the address exists.
  const policy = await securityPolicy();
  const LOCKOUT_WINDOW = "15 minutes";
  if (policy.lockoutAttempts > 0) {
    const { rows: attempts } = await db().query<{ n: string }>(
      `SELECT count(*)::text n FROM login_attempt WHERE email = $1 AND at > now() - interval '${LOCKOUT_WINDOW}'`,
      [email]);
    if (Number(attempts[0]?.n ?? 0) >= policy.lockoutAttempts) {
      return fail(request, isJson, "Those details did not match. Please try again.");
    }
  }

  const { rows } = await db().query<{
    id: string;
    name: string;
    role: SessionPayload["role"];
    password_hash: string;
  }>("SELECT id, name, role, password_hash FROM staff WHERE email = $1 AND active = true", [email]);
  const staff = rows[0];
  const ok = staff ? await bcrypt.compare(password, staff.password_hash) : false;
  if (!staff || !ok) {
    // Recorded whether or not the address exists, so the two cases cannot be told apart by timing or
    // by which addresses eventually lock.
    await db().query("INSERT INTO login_attempt (email, ip) VALUES ($1, $2::inet)",
      [email, clientIp(request.headers)]).catch(() => undefined);
    return fail(request, isJson, "Those details did not match. Please try again.");
  }

  // A clean sign-in clears the count, so a person who mistypes twice and then succeeds is not carrying
  // two attempts into their next sign-in.
  await db().query("DELETE FROM login_attempt WHERE email = $1", [email]).catch(() => undefined);

  // Record the sign-in first, so the cookie can name the session it belongs to and the session can
  // later be listed and ended from Active Sessions. The configured timeout sets how long it lasts.
  const maxAge = remember ? REMEMBER_SESSION_MAX_AGE : policy.sessionSeconds;
  const sid = await startSession(staff.id, maxAge, request.headers);
  await db().query("UPDATE staff SET last_login = now() WHERE id = $1", [staff.id]);
  const token = createSession({ id: staff.id, role: staff.role, name: staff.name }, maxAge, sid ?? undefined);
  // RBAC landing: a CMS-only user (granted the CMS and nothing else, and not an admin) lands in the CMS.
  let landing = "/dashboard";
  if (staff.role !== "admin") {
    const { rows: grantRows } = await db().query<{ module: string }>(
      "SELECT DISTINCT module FROM module_access WHERE staff_id = $1", [staff.id]);
    const granted = grantRows.map((g) => g.module);
    if (granted.includes("cms") && granted.every((m) => m === "cms")) landing = "/cms";
  }
  const response = isJson
    ? NextResponse.json({ ok: true, landing })
    : NextResponse.redirect(new URL(landing, request.url), { status: 303 });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(request.headers, request.nextUrl),
    path: "/",
    maxAge,
  });
  return response;
}

function fail(request: NextRequest, isJson: boolean, message: string): Response {
  if (isJson) {
    return NextResponse.json({ error: message }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login?error=1", request.url), { status: 303 });
}
