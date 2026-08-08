/**
 * Serve the branded payslip PDF for one worker's pay-run line. Only disbursed runs have payslips, so
 * anything else returns 404. Admin only. Uses the same Nexoris Technologies letterhead and brand as
 * the tax invoice.
 */
import type { NextRequest } from "next/server";
import { db } from "../../../../../../lib/db.js";
import { getCurrentStaff } from "../../../../../../lib/auth.js";
import { renderPayslipPdf } from "../../../../../../lib/pdf/payslip-pdf.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Slip {
  employee_name: string; regime: string; period: string; disbursed_at: string | null;
  gross: string; paye: string; pension_employee: string; nhf: string; wht: string; advance_repayment: string; net: string;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const staff = await getCurrentStaff();
  if (!staff || staff.role !== "admin") return new Response("Forbidden", { status: 403 });
  const { id } = await params;
  const pool = db();

  const slip = (await pool.query<Slip>(
    `SELECT l.employee_name, l.regime, r.period, r.disbursed_at::text,
            l.gross::text, l.paye::text, l.pension_employee::text, l.nhf::text, l.wht::text, l.advance_repayment::text, l.net::text
       FROM pay_run_line l JOIN pay_run r ON r.id = l.pay_run_id
      WHERE l.id = $1 AND r.status = 'Disbursed'`, [id])).rows[0];
  if (!slip) return new Response("Not found", { status: 404 });

  const company = (await pool.query<{ legal_name: string; rc_number: string | null; tin: string | null; address: string; phone: string; email: string; website: string | null }>(
    "SELECT legal_name, rc_number, tin, address, phone, email, website FROM company_settings WHERE id=true")).rows[0]!;

  const deductions = ([
    ["PAYE (income tax)", slip.paye],
    ["Pension (employee, 8%)", slip.pension_employee],
    ["NHF (2.5%)", slip.nhf],
    ["Withholding tax", slip.wht],
    ["Salary advance repayment", slip.advance_repayment],
  ] as const).map(([label, v]) => ({ label, amount: Number(v) })).filter((d) => d.amount > 0);

  const pdf = await renderPayslipPdf({
    employeeName: slip.employee_name, period: slip.period, regime: slip.regime, paidOn: slip.disbursed_at,
    gross: Number(slip.gross), deductions, net: Number(slip.net),
    company: { legalName: company.legal_name, rcNumber: company.rc_number, tin: company.tin, address: company.address, phone: company.phone, email: company.email, website: company.website },
  });

  const safe = `${slip.employee_name.replace(/[^a-z0-9]+/gi, "-")}-${slip.period.replace(/[^a-z0-9]+/gi, "-")}`;
  return new Response(new Uint8Array(pdf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="payslip-${safe}.pdf"` },
  });
}
