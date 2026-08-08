/**
 * Salary advance request and approval (PRD 8.6). HR/anyone raises a request; Payroll or Finance Admin
 * gives final approval and sets the repayment plan (lump sum or spread over months). The advance is
 * an asset in Finance, not an expense; each payroll repayment reduces net pay and the outstanding
 * balance. On exit the outstanding is netted off the final settlement.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "../../../../lib/db.js";
import { getCurrentStaff } from "../../../../lib/auth.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getCurrentStaff();
  if (!staff) return NextResponse.redirect(new URL("/payroll/advances", request.url), { status: 303 });
  const f = await request.formData();
  const action = String(f.get("action") ?? "");
  const pool = db();

  if (action === "request") {
    const employeeId = String(f.get("employee_id") ?? "");
    const amount = Number.parseFloat(String(f.get("amount") ?? ""));
    if (employeeId && Number.isFinite(amount) && amount > 0) {
      await pool.query(
        "INSERT INTO salary_advance (employee_id, amount, reason, requested_by) VALUES ($1,$2,$3,$4)",
        [employeeId, amount, String(f.get("reason") ?? "").trim() || null, staff.id],
      );
    }
  } else if (staff.role === "admin") {
    const id = String(f.get("id") ?? "");
    if (action === "approve" && id) {
      const months = Math.max(1, Math.round(Number.parseFloat(String(f.get("months") ?? "1")) || 1));
      const adv = (await pool.query<{ amount: string }>("SELECT amount::text FROM salary_advance WHERE id=$1 AND status='Pending'", [id])).rows[0];
      if (adv) {
        const amount = Number.parseFloat(adv.amount);
        const monthly = Math.round((amount / months) * 100) / 100;
        await pool.query(
          "UPDATE salary_advance SET status='Approved', repayment_months=$1, monthly_repayment=$2, outstanding=$3, approved_by=$4, approved_at=now() WHERE id=$5",
          [months, monthly, amount, staff.id, id],
        );
      }
    } else if (action === "decline" && id) {
      await pool.query("UPDATE salary_advance SET status='Declined', approved_by=$1, approved_at=now() WHERE id=$2 AND status='Pending'", [staff.id, id]);
    }
  }
  return NextResponse.redirect(new URL("/payroll/advances", request.url), { status: 303 });
}
