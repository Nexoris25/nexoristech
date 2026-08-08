/**
 * Payroll - Payslip list (PRD 8.7, 8.12). One payslip per worker per run, from disbursed runs. Each
 * opens the payslip record. Payslips are generated through the shared Document Engine in the Nexoris
 * Technologies brand and emailed on disbursement.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { requireAdmin } from "../../../../lib/auth.js";
import { db } from "../../../../lib/db.js";

export const dynamic = "force-dynamic";

interface Row { id: string; employee_name: string; regime: string; period: string; gross: string; net: string; disbursed_at: string }
function naira(v: string): string { return `₦${Number(v).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`; }

export default async function PayslipsPage(): Promise<ReactNode> {
  await requireAdmin();
  const { rows } = await db().query<Row>(
    `SELECT l.id, l.employee_name, l.regime, r.period, l.gross::text, l.net::text, r.disbursed_at
       FROM pay_run_line l JOIN pay_run r ON r.id = l.pay_run_id
      WHERE r.status = 'Disbursed' ORDER BY r.disbursed_at DESC, l.employee_name LIMIT 200`,
  );

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-[1.4rem] font-700 text-slate-900">Payslips</h1>
      <p className="mt-1 text-[0.88rem] text-slate-500">One payslip per worker per disbursed run, in the Nexoris Technologies brand.</p>

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-subtle">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-14 text-center"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#EEEBFC] text-[#543CDA]"><FileText size={22} strokeWidth={2} /></span><p className="text-[0.92rem] font-600 text-slate-700">No payslips yet</p><p className="max-w-sm text-[0.85rem] text-slate-500">Payslips appear here once a pay run is disbursed.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left">
              <thead><tr className="border-b border-slate-200 bg-slate-50 text-[0.7rem] uppercase tracking-wide text-slate-500"><th className="px-5 py-3 font-600">Worker</th><th className="px-5 py-3 font-600">Period</th><th className="px-5 py-3 font-600">Regime</th><th className="px-5 py-3 font-600">Gross</th><th className="px-5 py-3 font-600">Net</th><th className="px-5 py-3 font-600" aria-label="Action" /></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60">
                    <td className="px-5 py-3 text-[0.85rem] font-600 text-slate-900">{r.employee_name}</td>
                    <td className="px-5 py-3 text-[0.83rem] text-slate-600">{r.period}</td>
                    <td className="px-5 py-3 text-[0.83rem] text-slate-600">{r.regime}</td>
                    <td className="px-5 py-3 font-mono text-[0.83rem] text-slate-700">{naira(r.gross)}</td>
                    <td className="px-5 py-3 font-mono text-[0.83rem] font-700 text-slate-900">{naira(r.net)}</td>
                    <td className="px-5 py-3 text-right"><Link href={`/payroll/payslips/${r.id}`} className="text-[0.8rem] font-600 text-[#543CDA] hover:text-[#4330B8]">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
