/** Save the statutory deduction toggle panel (PRD 8.3). Turning a default-on toggle off is a
 *  deliberate, logged action. Payroll Admin only. */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "../../../../lib/db.js";
import { getStaffFor } from "../../../../lib/auth.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getStaffFor("payroll.settings");
  if (!staff) return NextResponse.json({ ok: false }, { status: 403 });
  const f = await request.formData();
  if (!staff) return NextResponse.redirect(new URL("/payroll/settings", request.url), { status: 303 });
  const on = (k: string): boolean => f.get(k) === "on";
  const num = (k: string, d: number): number => { const n = Number.parseFloat(String(f.get(k) ?? "")); return Number.isFinite(n) && n >= 0 ? n : d; };
  await db().query(
    `UPDATE payroll_settings SET paye_enabled=$1, pension_enabled=$2, nhf_enabled=$3, wht_enabled=$4, ec_enabled=$5,
       itf_enabled=$6, pension_employee_rate=$7, pension_employer_rate=$8, nhf_rate=$9, wht_rate=$10,
       ec_rate=$11, itf_rate=$12, pay_day=$13, updated_at=now() WHERE id=true`,
    [on("paye_enabled"), on("pension_enabled"), on("nhf_enabled"), on("wht_enabled"), on("ec_enabled"),
     on("itf_enabled"),
     num("pension_employee_rate", 8), num("pension_employer_rate", 10), num("nhf_rate", 2.5), num("wht_rate", 5),
     num("ec_rate", 1), num("itf_rate", 1),
     Math.round(num("pay_day", 25))],
  );
  await db().query(`INSERT INTO audit_log (actor_id, action, entity, entity_id, before, after) VALUES ($1,'payroll-settings','payroll_settings','1',NULL,'{}'::jsonb)`, [staff.id]);
  return NextResponse.redirect(new URL("/payroll/settings?saved=1", request.url), { status: 303 });
}
