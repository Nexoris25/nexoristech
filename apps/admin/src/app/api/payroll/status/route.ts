/**
 * Advance a pay run through its lifecycle (PRD 8.5): Draft -> Reviewed -> Approved -> Disbursed.
 * A run locks once disbursed. On disbursement Payroll posts to Finance automatically (8.9): net pay
 * as a Salaries expense and each statutory deduction as a liability - written to the shared audit
 * log here as the posting record until the Finance ledger is built. Payroll Admin only.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "../../../../lib/db.js";
import { getStaffFor } from "../../../../lib/auth.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NEXT: Record<string, string> = { Draft: "Reviewed", Reviewed: "Approved", Approved: "Disbursed" };

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getStaffFor("payroll.approve");
  if (!staff) return NextResponse.json({ ok: false }, { status: 403 });
  const f = await request.formData();
  const id = String(f.get("id") ?? "");
  if (!staff || !id) return NextResponse.redirect(new URL("/payroll/runs", request.url), { status: 303 });

  const pool = db();
  const run = (await pool.query<{ status: string; net: string }>("SELECT status, net::text FROM pay_run WHERE id=$1", [id])).rows[0];
  if (!run) return NextResponse.redirect(new URL("/payroll/runs", request.url), { status: 303 });
  const next = NEXT[run.status];
  if (!next) return NextResponse.redirect(new URL(`/payroll/runs/${id}`, request.url), { status: 303 });

  if (next === "Approved") {
    await pool.query("UPDATE pay_run SET status='Approved', approved_by=$1, approved_at=now() WHERE id=$2", [staff.id, id]);
  } else if (next === "Disbursed") {
    await pool.query("UPDATE pay_run SET status='Disbursed', disbursed_at=now() WHERE id=$1", [id]);
    // Reduce salary-advance balances by the amount repaid on this run (8.6).
    await pool.query(
      `UPDATE salary_advance sa SET outstanding = greatest(0, sa.outstanding - least(sa.monthly_repayment, sa.outstanding)),
              status = CASE WHEN greatest(0, sa.outstanding - least(sa.monthly_repayment, sa.outstanding)) <= 0 THEN 'Repaid' ELSE 'Repaying' END
        WHERE sa.status IN ('Approved','Repaying') AND sa.outstanding > 0
          AND sa.employee_id IN (SELECT employee_id FROM pay_run_line WHERE pay_run_id=$1 AND advance_repayment > 0)`,
      [id],
    );
    // Post to Finance (8.9): the one automatic write, logged.
    await pool.query(`INSERT INTO audit_log (actor_id, action, entity, entity_id, before, after) VALUES ($1,'payroll-post-finance','pay_run',$2,NULL,$3::jsonb)`,
      [staff.id, id, JSON.stringify({ posted: "Salaries expense + statutory liabilities", net: run.net })]);
  } else {
    await pool.query("UPDATE pay_run SET status=$1 WHERE id=$2", [next, id]);
  }
  return NextResponse.redirect(new URL(`/payroll/runs/${id}`, request.url), { status: 303 });
}
