/**
 * Read state for Action Center items.
 *
 * Two ways in, because there are two ways a person reads something.
 *
 * GET /api/notifications?id=…&to=… is what an item links to. It records the read and then
 * redirects to where the item was going, so opening an alert marks it read without the person doing
 * anything extra. It has to be a GET, because it is reached by clicking a link; that is safe here
 * because the only effect is recording that this signed-in person saw their own alert.
 *
 * POST is the explicit control: mark one read, mark one unread again, or mark everything read. A
 * native form post, like the rest of the shell's write paths.
 *
 * Both are scoped to the signed-in staff member and cannot touch anybody else's state: the id comes
 * from the session, never from the request.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCurrentStaff } from "../../../lib/auth.js";
import { markRead, markUnread } from "../../../lib/notification-read.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Only same-origin paths. An open-redirect through a notification link would be an odd gift. */
function safeTarget(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/action-center";
  return raw;
}

export async function GET(request: NextRequest): Promise<Response> {
  const staff = await getCurrentStaff();
  // Signed out mid-click: send them to log in rather than recording a read for nobody.
  if (!staff) return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  const params = request.nextUrl.searchParams;
  const id = params.get("id");
  if (id) await markRead(staff.id, [id]);
  return NextResponse.redirect(new URL(safeTarget(params.get("to")), request.url), { status: 303 });
}

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getCurrentStaff();
  if (!staff) return NextResponse.json({ ok: false }, { status: 403 });

  const form = await request.formData();
  const intent = String(form.get("intent") ?? "read");
  const ids = form.getAll("id").map(String);

  if (intent === "unread") await markUnread(staff.id, ids);
  else await markRead(staff.id, ids);

  return NextResponse.redirect(new URL("/action-center", request.url), { status: 303 });
}
