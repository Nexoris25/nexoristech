/**
 * Sign-out as a route handler (PRD 1.1). Like sign-in, it is a POST route so it works behind a
 * proxy or sandboxed iframe without the Server-Action origin guard, and the sign-out control posts
 * natively so it needs no client hydration. It clears the session cookie and redirects to /login.
 *
 * It also revokes the session record, so signing out actually ends the session rather than only
 * dropping the copy of the cookie held by this browser.
 */
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { cookieSecure, SESSION_COOKIE, verifySession } from "../../../../lib/session.js";
import { revokeSession } from "../../../../lib/sessions.js";
import { seeOther } from "../../../../lib/redirect.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  const payload = verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (payload?.sid) await revokeSession(payload.sid, payload.sub, payload.sub);

  const response = seeOther("/login");
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(request.headers, request.nextUrl),
    path: "/",
    maxAge: 0,
  });
  return response;
}
