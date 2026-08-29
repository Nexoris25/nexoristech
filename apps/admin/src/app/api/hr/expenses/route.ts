/** Approve, reject, or reimburse an employee expense claim (PRD 7.7). HR Admin or a manager. */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "../../../../lib/db.js";
import { getStaffFor } from "../../../../lib/auth.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getStaffFor("hr.expense.decide");
  if (!staff) return NextResponse.json({ ok: false }, { status: 403 });
  const f = await request.formData();
  const id = String(f.get("id") ?? "");
  const decision = String(f.get("decision") ?? "");
  if (staff && id && ["Approved", "Rejected", "Reimbursed"].includes(decision)) {
    await db().query(
      "UPDATE expense_claim SET status=$1, decided_by=$2, decided_at=now() WHERE id=$3",
      [decision, staff.id, id],
    );
  }
  return NextResponse.redirect(new URL("/people/expenses", request.url), { status: 303 });
}
