/**
 * Payroll - Payslip record (PRD 8.7, 8.12). The single worker's payslip from a disbursed run:
 * earnings, each statutory deduction by name, advance repayment, and net pay, in the Nexoris
 * Technologies brand. Employer-only costs never appear here. Read from the immutable pay_run_line
 * snapshot so the payslip never drifts from what was paid.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { requireAdmin } from "../../../../../lib/auth.js";
import { db } from "../../../../../lib/db.js";

export const dynamic = "force-dynamic";

interface Slip {
  employee_name: string; regime: string; period: string; disbursed_at: string;
  gross: string; paye: string; pension_employee: string; nhf: string; wht: string;
  advance_repayment: string; net: string;
}
function naira(v: string): string { return `₦${Number(v).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

export default async function PayslipPage({ params }: { params: Promise<{ id: string }> }): Promise<ReactNode> {
  await requireAdmin();
  const { id } = await params;
  const { rows } = await db().query<Slip>(
    `SELECT l.employee_name, l.regime, r.period, r.disbursed_at,
            l.gross::text, l.paye::text, l.pension_employee::text, l.nhf::text, l.wht::text,
            l.advance_repayment::text, l.net::text
       FROM pay_run_line l JOIN pay_run r ON r.id = l.pay_run_id
      WHERE l.id = $1 AND r.status = 'Disbursed'`, [id]);
  const s = rows[0];
  if (!s) notFound();

  const deductions = ([
    ["PAYE (income tax)", s.paye],
    ["Pension (employee, 8%)", s.pension_employee],
    ["NHF (2.5%)", s.nhf],
    ["Withholding tax", s.wht],
    ["Salary advance repayment", s.advance_repayment],
  ] as const).filter(([, v]) => Number(v) > 0);
  const totalDeductions = deductions.reduce((t, [, v]) => t + Number(v), 0);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <Link href="/payroll/payslips" className="inline-flex items-center gap-1.5 text-[0.8rem] font-600 text-[#543CDA] hover:text-[#4330B8]"><ArrowLeft size={15} strokeWidth={2.2} /> Payslips</Link>
        <a href={`/payroll/payslips/${id}/pdf`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-[#543CDA] px-4 py-2 text-[0.82rem] font-600 text-white hover:bg-[#4330B8]"><Download size={15} /> Download PDF</a>
      </div>

      <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-subtle">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 bg-gradient-to-br from-[#543CDA] to-[#4330B8] px-6 py-5 text-white">
          <div>
            <p className="text-[0.72rem] uppercase tracking-wide text-white/70">Payslip</p>
            <h1 className="mt-0.5 text-[1.2rem] font-700">{s.employee_name}</h1>
            <p className="text-[0.82rem] text-white/80">{s.period} · {s.regime}</p>
          </div>
          <div className="text-right">
            <p className="text-[0.9rem] font-700">Nexoris Technologies</p>
            <p className="text-[0.72rem] text-white/70">Paid {new Date(s.disbursed_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 sm:divide-x sm:divide-slate-100">
          <div className="p-6">
            <h2 className="text-[0.75rem] uppercase tracking-wide text-slate-500">Earnings</h2>
            <div className="mt-3 flex items-center justify-between border-b border-slate-100 py-2.5"><span className="text-[0.85rem] text-slate-700">Gross pay</span><span className="font-mono text-[0.85rem] font-600 text-slate-900">{naira(s.gross)}</span></div>
            <div className="mt-3 flex items-center justify-between"><span className="text-[0.82rem] font-600 text-slate-900">Total earnings</span><span className="font-mono text-[0.85rem] font-700 text-slate-900">{naira(s.gross)}</span></div>
          </div>
          <div className="p-6">
            <h2 className="text-[0.75rem] uppercase tracking-wide text-slate-500">Deductions</h2>
            {deductions.length === 0 ? (
              <p className="mt-3 text-[0.82rem] text-slate-500">No deductions.</p>
            ) : deductions.map(([label, v]) => (
              <div key={label} className="mt-1 flex items-center justify-between border-b border-slate-100 py-2.5"><span className="text-[0.85rem] text-slate-700">{label}</span><span className="font-mono text-[0.85rem] text-slate-700">{naira(v)}</span></div>
            ))}
            <div className="mt-3 flex items-center justify-between"><span className="text-[0.82rem] font-600 text-slate-900">Total deductions</span><span className="font-mono text-[0.85rem] font-700 text-slate-900">{naira(String(totalDeductions))}</span></div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-[#F4F1FD] px-6 py-4">
          <span className="text-[0.9rem] font-700 text-slate-900">Net pay</span>
          <span className="font-mono text-[1.15rem] font-700 text-[#543CDA]">{naira(s.net)}</span>
        </div>
      </div>
      <p className="mt-3 text-center text-[0.74rem] text-slate-500">Computed under the Nigeria Tax Act 2025. This is a record of a disbursed payment.</p>
    </div>
  );
}
