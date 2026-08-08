/**
 * Ending a session, from the Active Sessions screen.
 *
 * A route handler posted to natively, for the same reason sign-in is: no Server-Action origin guard to
 * fail behind a proxy, and it works without client hydration.
 *
 * A person may end only their own sessions. The session id is taken from the form, but the update is
 * scoped to the signed-in staff id, so knowing someone else's session id achieves nothing.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCurrentStaff } from "../../../../lib/auth.js";
import { revokeSession, revokeOtherSessions } from "../../../../lib/sessions.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getCurrentStaff();
  if (!staff) return NextResponse.redirect(new URL("/login", request.url), { status: 303 });

  const form = await request.formData();
  const back = new URL("/users/sessions", request.url);

  if (form.get("all") === "1") {
    const n = await revokeOtherSessions(staff.id, staff.sessionId);
    back.searchParams.set("done", n > 0 ? `ended-${n}` : "none");
    return NextResponse.redirect(back, { status: 303 });
  }

  const sessionId = String(form.get("session_id") ?? "");
  // Ending the current session would sign you out from the screen you are standing on, which is what
  // the sign-out control is for. The screen does not offer it, and this refuses it if it is posted.
  if (!sessionId || sessionId === staff.sessionId) {
    back.searchParams.set("done", "none");
    return NextResponse.redirect(back, { status: 303 });
  }

  const ok = await revokeSession(sessionId, staff.id, staff.id);
  back.searchParams.set("done", ok ? "ended-1" : "none");
  return NextResponse.redirect(back, { status: 303 });
}
