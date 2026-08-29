/**
 * Generate a pay run (PRD 8.5). Reads every active worker's salary and employment type live from HR
 * (8.1, 8.2), applies the Tax Engine per regime, nets off due salary-advance repayments, and writes
 * a Draft run with one line per worker. Never edits HR data. Payroll Admin only.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "../../../../lib/db.js";
import { getStaffFor } from "../../../../lib/auth.js";
import { computeLine, totalsOf, type PayrollSettings, type WorkerInput } from "../../../../lib/payroll.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getStaffFor("payroll.prepare");
  if (!staff) return NextResponse.redirect(new URL("/payroll", request.url), { status: 303 });

  const f = await request.formData();
  const runType = String(f.get("run_type") ?? "Regular");
  const period = String(f.get("period") ?? "") || new Date().toLocaleDateString("en-NG", { month: "long", year: "numeric" });

  const pool = db();
  const settings = (await pool.query<PayrollSettings>("SELECT * FROM payroll_settings WHERE id = true")).rows[0]!;
  const { rows: workers } = await pool.query<WorkerInput & { advance_repayment: string }>(
    `SELECT e.id AS employee_id, e.full_name AS employee_name, e.employment_type,
            e.basic_salary::float AS basic, e.housing_allowance::float AS housing,
            e.transport_allowance::float AS transport, e.other_allowances::float AS other_allowances,
            (e.nhf_number IS NOT NULL) AS nhf_registered,
            coalesce((SELECT sum(least(sa.monthly_repayment, sa.outstanding)) FROM salary_advance sa
                        WHERE sa.employee_id = e.id AND sa.status IN ('Approved','Repaying') AND sa.outstanding > 0), 0)::text AS advance_repayment
       FROM employee e WHERE e.employment_status <> 'Exited' ORDER BY e.full_name`,
  );

  const lines = workers.map((w) => computeLine({ ...w, advance_repayment: Number.parseFloat(w.advance_repayment) || 0 }, settings));
  const t = totalsOf(lines);

  const run = (await pool.query<{ id: string }>(
    `INSERT INTO pay_run (period, run_type, status, employee_count, gross, deductions, net, employer_cost, created_by)
     VALUES ($1,$2,'Draft',$3,$4,$5,$6,$7,$8) RETURNING id`,
    [period, runType, lines.length, t.gross, t.deductions, t.net, t.employer_cost, staff.id],
  )).rows[0]!;

  for (const l of lines) {
    await pool.query(
      `INSERT INTO pay_run_line (pay_run_id, employee_id, employee_name, regime, basic, housing, transport,
         other_allowances, gross, paye, pension_employee, nhf, wht, voluntary, advance_repayment, net, pension_employer, ec, itf)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
      [run.id, l.employee_id, l.employee_name, l.regime, l.basic, l.housing, l.transport, l.other_allowances,
        l.gross, l.paye, l.pension_employee, l.nhf, l.wht, l.voluntary, l.advance_repayment, l.net, l.pension_employer, l.ec, l.itf],
    );
  }
  await pool.query(`INSERT INTO audit_log (actor_id, action, entity, entity_id, before, after) VALUES ($1,'payroll-generate','pay_run',$2,NULL,$3::jsonb)`,
    [staff.id, run.id, JSON.stringify({ period, runType, count: lines.length })]);

  return NextResponse.redirect(new URL(`/payroll/runs/${run.id}`, request.url), { status: 303 });
}
