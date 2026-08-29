/**
 * Payroll - Reports (PRD 8.10, 8.12). Three read-only views over disbursed runs: the payroll register
 * (every run's gross/deductions/net/employer cost), the statutory schedule (PAYE, pension, NHF, WHT,
 * EC totals to remit), and the year-to-date summary. All figures come from the immutable run lines,
 * so a report can never disagree with what was paid.
 */
import type { ReactNode } from "react";
import { BarChart3 } from "lucide-react";
import { requireCapability } from "../../../../lib/auth.js";
import { db } from "../../../../lib/db.js";

export const dynamic = "force-dynamic";

interface RunRow {
  id: string; period: string; run_type: string; disbursed_at: string; employee_count: number;
  gross: string; deductions: string; net: string; employer_cost: string;
  paye: string; pension_employee: string; pension_employer: string; nhf: string; wht: string; ec: string;
}
function naira(v: string | number): string { return `₦${Number(v).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`; }

export default async function PayrollReportsPage(): Promise<ReactNode> {
  await requireCapability("payroll.read");
  const year = new Date().getFullYear();
  const { rows } = await db().query<RunRow>(
    `SELECT r.id, r.period, r.run_type, r.disbursed_at, r.employee_count,
            r.gross::text, r.deductions::text, r.net::text, r.employer_cost::text,
            sum(l.paye)::text paye, sum(l.pension_employee)::text pension_employee,
            sum(l.pension_employer)::text pension_employer, sum(l.nhf)::text nhf,
            sum(l.wht)::text wht, sum(l.ec)::text ec
       FROM pay_run r JOIN pay_run_line l ON l.pay_run_id = r.id
      WHERE r.status = 'Disbursed' AND extract(year FROM r.disbursed_at) = $1
      GROUP BY r.id ORDER BY r.disbursed_at DESC`, [year]);

  const ytd = rows.reduce((t, r) => ({
    gross: t.gross + Number(r.gross), net: t.net + Number(r.net), employer: t.employer + Number(r.employer_cost),
    paye: t.paye + Number(r.paye), pension: t.pension + Number(r.pension_employee) + Number(r.pension_employer),
    nhf: t.nhf + Number(r.nhf), wht: t.wht + Number(r.wht), ec: t.ec + Number(r.ec),
  }), { gross: 0, net: 0, employer: 0, paye: 0, pension: 0, nhf: 0, wht: 0, ec: 0 });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900">Payroll Reports</h1>
          <p className="mt-1 text-[0.88rem] text-slate-500">Register, statutory schedule, and year-to-date — over disbursed runs.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[0.78rem] font-600 text-slate-600">{year}</span>
      </div>

      {/* YTD summary */}
      <section className="mt-5">
        <h2 className="flex items-center gap-2 text-[0.95rem] font-700 text-slate-900"><BarChart3 size={17} strokeWidth={2} className="text-[#543CDA]" /> Year to date</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[["Gross", ytd.gross], ["Net paid", ytd.net], ["PAYE", ytd.paye], ["Pension", ytd.pension], ["NHF", ytd.nhf], ["WHT", ytd.wht], ["Employees' Comp", ytd.ec], ["Employer cost", ytd.employer]].map(([label, v]) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-subtle">
              <p className="text-[0.72rem] text-slate-500">{label}</p>
              <p className="mt-1 font-mono text-[1rem] font-700 text-slate-900">{naira(v as number)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Register + statutory schedule */}
      <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-subtle">
        <div className="border-b border-slate-100 px-5 py-3.5"><h2 className="text-[0.95rem] font-700 text-slate-900">Payroll register &amp; statutory schedule</h2></div>
        {rows.length === 0 ? (
          <p className="px-5 py-12 text-center text-[0.88rem] text-slate-500">No disbursed runs this year yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left">
              <thead><tr className="border-b border-slate-200 bg-slate-50 text-[0.66rem] uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-600">Period</th><th className="px-4 py-3 text-right font-600">Workers</th><th className="px-4 py-3 text-right font-600">Gross</th><th className="px-4 py-3 text-right font-600">PAYE</th><th className="px-4 py-3 text-right font-600">Pension</th><th className="px-4 py-3 text-right font-600">NHF</th><th className="px-4 py-3 text-right font-600">WHT</th><th className="px-4 py-3 text-right font-600">EC</th><th className="px-4 py-3 text-right font-600">Net</th>
              </tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60">
                    <td className="px-4 py-3 text-[0.83rem] font-600 text-slate-900">{r.period}<span className="ml-1.5 text-[0.72rem] font-400 text-slate-500">{r.run_type}</span></td>
                    <td className="px-4 py-3 text-right font-mono text-[0.8rem] text-slate-600">{r.employee_count}</td>
                    <td className="px-4 py-3 text-right font-mono text-[0.8rem] text-slate-700">{naira(r.gross)}</td>
                    <td className="px-4 py-3 text-right font-mono text-[0.8rem] text-slate-600">{naira(r.paye)}</td>
                    <td className="px-4 py-3 text-right font-mono text-[0.8rem] text-slate-600">{naira(Number(r.pension_employee) + Number(r.pension_employer))}</td>
                    <td className="px-4 py-3 text-right font-mono text-[0.8rem] text-slate-600">{naira(r.nhf)}</td>
                    <td className="px-4 py-3 text-right font-mono text-[0.8rem] text-slate-600">{naira(r.wht)}</td>
                    <td className="px-4 py-3 text-right font-mono text-[0.8rem] text-slate-600">{naira(r.ec)}</td>
                    <td className="px-4 py-3 text-right font-mono text-[0.82rem] font-700 text-slate-900">{naira(r.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
