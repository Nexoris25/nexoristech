/** Approve or reject a leave request (PRD 7.6). HR Admin or a manager. */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "../../../../lib/db.js";
import { getStaffFor } from "../../../../lib/auth.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getStaffFor("hr.leave.decide");
  if (!staff) return NextResponse.json({ ok: false }, { status: 403 });
  const f = await request.formData();
  const id = String(f.get("id") ?? "");
  const decision = String(f.get("decision") ?? "");
  if (staff && id && (decision === "Approved" || decision === "Rejected")) {
    await db().query(
      "UPDATE leave_request SET status=$1, decided_by=$2, decided_at=now() WHERE id=$3 AND status='Pending'",
      [decision, staff.id, id],
    );
  }
  return NextResponse.redirect(new URL("/people/leave", request.url), { status: 303 });
}
