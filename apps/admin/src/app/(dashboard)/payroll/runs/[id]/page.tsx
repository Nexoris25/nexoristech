/**
 * Payroll - Pay run details and approval (PRD 8.5, 8.12). The run header and totals, the lifecycle
 * action (Draft -> Reviewed -> Approved -> Disbursed; locks after), and one line per worker showing
 * gross, each statutory deduction by name and amount, advance repayment, and net. Employer-only
 * costs (employer pension, Employees' Compensation) are shown as a footer, never on the payslip.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Lock } from "lucide-react";
import { requireCapability } from "../../../../../lib/auth.js";
import { db } from "../../../../../lib/db.js";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-600",
  Reviewed: "bg-[#DBEAFE] text-[#1D4ED8]",
  Approved: "bg-[#EEEBFC] text-[#543CDA]",
  Disbursed: "bg-[#DCFCE7] text-[#15803D]",
  Closed: "bg-slate-100 text-slate-600",
};
const NEXT_LABEL: Record<string, string> = { Draft: "Mark Reviewed", Reviewed: "Approve", Approved: "Disburse" };

function naira(v: string | number): string {
  return Number(v) === 0 ? "—" : `₦${Number(v).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

interface Line {
  id: string; employee_id: string | null; employee_name: string; regime: string;
  gross: string; paye: string; pension_employee: string; nhf: string; wht: string;
  advance_repayment: string; net: string; pension_employer: string; ec: string;
}

export default async function RunDetailsPage({ params }: { params: Promise<{ id: string }> }): Promise<ReactNode> {
  await requireCapability("payroll.prepare");
  const { id } = await params;
  const [{ rows: runs }, { rows: lines }] = await Promise.all([
    db().query<{ period: string; run_type: string; status: string; employee_count: number; gross: string; deductions: string; net: string; employer_cost: string; created_at: string }>(
      "SELECT period, run_type, status, employee_count, gross::text, deductions::text, net::text, employer_cost::text, created_at FROM pay_run WHERE id=$1", [id]),
    db().query<Line>(
      "SELECT id, employee_id, employee_name, regime, gross::text, paye::text, pension_employee::text, nhf::text, wht::text, advance_repayment::text, net::text, pension_employer::text, ec::text FROM pay_run_line WHERE pay_run_id=$1 ORDER BY employee_name", [id]),
  ]);
  const run = runs[0];
  if (!run) notFound();
  const next = NEXT_LABEL[run.status];

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/payroll/runs" className="inline-flex items-center gap-1.5 text-[0.8rem] font-600 text-[#543CDA] hover:text-[#4330B8]"><ArrowLeft size={15} strokeWidth={2.2} /> Pay Runs</Link>

      <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[1.25rem] font-700 text-slate-900">{run.period}</h1>
              <span className={`rounded-full px-2.5 py-0.5 text-[0.72rem] font-600 ${STATUS[run.status]}`}>{run.status}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[0.72rem] font-600 text-slate-600">{run.run_type}</span>
            </div>
            <p className="mt-0.5 text-[0.85rem] text-slate-500">{run.employee_count} worker{run.employee_count === 1 ? "" : "s"} · generated {new Date(run.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</p>
          </div>
          {next ? (
            <form action="/api/payroll/status" method="post">
              <input type="hidden" name="id" value={id} />
              <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-[#543CDA] px-5 py-2.5 text-[0.85rem] font-600 text-white hover:bg-[#4330B8]"><CheckCircle2 size={15} strokeWidth={2} /> {next}</button>
            </form>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-4 py-2.5 text-[0.84rem] font-600 text-slate-600"><Lock size={14} strokeWidth={2} /> Locked</span>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[["Gross", run.gross], ["Deductions", run.deductions], ["Net Pay", run.net], ["Employer Cost", run.employer_cost]].map(([label, v]) => (
            <div key={label} className="rounded-xl bg-slate-50 p-3.5">
              <p className="text-[0.72rem] text-slate-500">{label}</p>
              <p className="mt-1 font-mono text-[1.05rem] font-700 text-slate-900">{naira(v ?? "0")}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[0.68rem] uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-600">Worker</th>
                <th className="px-4 py-3 font-600">Regime</th>
                <th className="px-4 py-3 text-right font-600">Gross</th>
                <th className="px-4 py-3 text-right font-600">PAYE</th>
                <th className="px-4 py-3 text-right font-600">Pension</th>
                <th className="px-4 py-3 text-right font-600">NHF</th>
                <th className="px-4 py-3 text-right font-600">WHT</th>
                <th className="px-4 py-3 text-right font-600">Advance</th>
                <th className="px-4 py-3 text-right font-600">Net</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60">
                  <td className="px-4 py-3 text-[0.84rem] font-600 text-slate-900">{l.employee_name}</td>
                  <td className="px-4 py-3"><span className={`rounded-md px-2 py-0.5 text-[0.7rem] font-600 ${l.regime === "PAYE" ? "bg-[#EEEBFC] text-[#543CDA]" : "bg-[#FEF3C7] text-[#B45309]"}`}>{l.regime}</span></td>
                  <td className="px-4 py-3 text-right font-mono text-[0.82rem] text-slate-700">{naira(l.gross)}</td>
                  <td className="px-4 py-3 text-right font-mono text-[0.82rem] text-slate-600">{naira(l.paye)}</td>
                  <td className="px-4 py-3 text-right font-mono text-[0.82rem] text-slate-600">{naira(l.pension_employee)}</td>
                  <td className="px-4 py-3 text-right font-mono text-[0.82rem] text-slate-600">{naira(l.nhf)}</td>
                  <td className="px-4 py-3 text-right font-mono text-[0.82rem] text-slate-600">{naira(l.wht)}</td>
                  <td className="px-4 py-3 text-right font-mono text-[0.82rem] text-slate-600">{naira(l.advance_repayment)}</td>
                  <td className="px-4 py-3 text-right font-mono text-[0.84rem] font-700 text-slate-900">{naira(l.net)}</td>
                </tr>
              ))}
              {lines.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-10 text-center text-[0.85rem] text-slate-500">No workers in this run. Onboard employees in HR, then generate again.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-200 px-4 py-2.5 text-[0.74rem] text-slate-500">Employer costs (employer pension + Employees&apos; Compensation) total <span className="font-mono font-600 text-slate-700">{naira(run.employer_cost)}</span> and are posted to Finance on disbursement, not shown on payslips.</p>
      </div>
    </div>
  );
}
