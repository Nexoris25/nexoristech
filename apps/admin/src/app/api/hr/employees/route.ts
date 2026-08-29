/**
 * Onboard a new employee (PRD 7.3, 7.5). HR is the only place a person is created; this inserts the
 * employee record from the guided form, assigns the next staff ID, and opens the record. Access to
 * modules is a separate, deliberate grant in the shell (3.2), not implied by onboarding. There is no
 * BVN field, by design. HR Admin only.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "../../../../lib/db.js";
import { getStaffFor } from "../../../../lib/auth.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function s(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}
function n(v: FormDataEntryValue | null): number {
  const x = Number.parseFloat(typeof v === "string" ? v : "");
  return Number.isFinite(x) && x >= 0 ? x : 0;
}
function d(v: FormDataEntryValue | null): string | null {
  const x = s(v);
  return x ? x : null;
}

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getStaffFor("hr.write");
  if (!staff) {
    return NextResponse.redirect(new URL("/people", request.url), { status: 303 });
  }

  const f = await request.formData();
  const fullName = s(f.get("full_name"));
  if (!fullName) {
    return NextResponse.redirect(new URL("/people/onboard?error=1", request.url), { status: 303 });
  }

  const pool = db();
  const { rows: seqRows } = await pool.query<{ next: number }>(
    `SELECT coalesce(max((regexp_replace(staff_number, '\\D', '', 'g'))::int), 0) + 1 AS next
       FROM employee WHERE staff_number ~ '^EMP-'`,
  );
  const staffNumber = `EMP-${String(seqRows[0]?.next ?? 1).padStart(4, "0")}`;

  const deptRaw = s(f.get("department_id"));
  const managerRaw = s(f.get("manager_id"));

  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO employee (
       full_name, date_of_birth, gender, marital_status, phone, personal_email, address,
       staff_number, job_title, department_id, employment_type, date_joined, employment_status,
       manager_id, work_email,
       basic_salary, housing_allowance, transport_allowance, other_allowances,
       bank_name, account_number, account_name, tin, pension_pin, pension_fund_administrator, nhf_number,
       nok_name, nok_relationship, nok_phone, nok_address, commission_eligible, commission_rate, commission_basis,
       gross_pay, paye_applies, pension_applies, nhf_applies, annual_rent, salary_band
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,
       $8,$9,$10,$11,$12,$13,
       $14,$15,
       $16,$17,$18,$19,
       $20,$21,$22,$23,$24,$25,$26,
       $27,$28,$29,$30,$31,$32,$33,
       $34,$35,$36,$37,$38,$39
     ) RETURNING id`,
    [
      fullName, d(f.get("date_of_birth")), s(f.get("gender")) || null, s(f.get("marital_status")) || null,
      s(f.get("phone")) || null, s(f.get("personal_email")) || null, s(f.get("address")) || null,
      staffNumber, s(f.get("job_title")) || null, deptRaw || null, s(f.get("employment_type")) || "Full-time",
      d(f.get("date_joined")), s(f.get("employment_status")) || "Probation", managerRaw || null, s(f.get("work_email")) || null,
      n(f.get("basic_salary")), n(f.get("housing_allowance")), n(f.get("transport_allowance")), n(f.get("other_allowances")),
      s(f.get("bank_name")) || null, s(f.get("account_number")) || null, s(f.get("account_name")) || null,
      s(f.get("tin")) || null, s(f.get("pension_pin")) || null, s(f.get("pension_fund_administrator")) || null, s(f.get("nhf_number")) || null,
      s(f.get("nok_name")) || null, s(f.get("nok_relationship")) || null, s(f.get("nok_phone")) || null, s(f.get("nok_address")) || null,
      f.get("commission_eligible") === "on",
      // Commission terms: the rate is held to the 3%-20% policy range, and a basis only counts if valid.
      (() => { const r = Number(s(f.get("commission_rate"))); return Number.isFinite(r) && r > 0 ? Math.min(20, Math.max(3, r)) : null; })(),
      (() => { const b = s(f.get("commission_basis")); return b === "salary" || b === "closed_deal" ? b : null; })(),
      // Pay: a single gross figure plus which deductions apply to this person (PRD 8).
      n(f.get("gross_pay")),
      f.get("paye_applies") === "on",
      f.get("pension_applies") === "on",
      f.get("nhf_applies") === "on",
      n(f.get("annual_rent")),
      // The band HR classified this person into. Recorded only: PAYE is computed from the figures
      // above, so a wrong selection can never produce a wrong payslip.
      s(f.get("salary_band")) || null,
    ],
  );

  await pool.query(
    `INSERT INTO audit_log (actor_id, action, entity, entity_id, before, after)
     VALUES ($1, 'create', 'employee', $2, NULL, $3::jsonb)`,
    [staff.id, rows[0]!.id, JSON.stringify({ fullName, staffNumber })],
  );

  return NextResponse.redirect(new URL(`/people/${rows[0]!.id}`, request.url), { status: 303 });
}
