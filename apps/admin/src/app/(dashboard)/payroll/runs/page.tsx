/**
 * Payroll - Pay run history + Generate (PRD 8.12 list view + 8.5 guided run). Generating reads
 * every active worker's salary and type from HR, applies the Tax Engine, and writes a Draft run.
 * Regular, Bonus/13th, and Final-settlement run types each carry different tax handling (8.5).
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { Wallet } from "lucide-react";
import { requireAdmin } from "../../../../lib/auth.js";
import { db } from "../../../../lib/db.js";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-600",
  Reviewed: "bg-[#DBEAFE] text-[#1D4ED8]",
  Approved: "bg-[#EEEBFC] text-[#543CDA]",
  Disbursed: "bg-[#DCFCE7] text-[#15803D]",
  Closed: "bg-slate-100 text-slate-600",
};

function naira(v: string): string {
  return `₦${Number(v).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

export default async function PayRunsPage(): Promise<ReactNode> {
  await requireAdmin();
  const pool = db();
  const [{ rows }, { rows: emp }] = await Promise.all([
    pool.query<{ id: string; period: string; run_type: string; status: string; employee_count: number; gross: string; net: string; created_at: string }>(
      "SELECT id, period, run_type, status, employee_count, gross::text, net::text, created_at FROM pay_run ORDER BY created_at DESC LIMIT 50",
    ),
    pool.query<{ c: number }>("SELECT count(*)::int c FROM employee WHERE employment_status <> 'Exited'"),
  ]);
  const defaultPeriod = new Date().toLocaleDateString("en-NG", { month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-[1.4rem] font-700 text-slate-900">Pay Runs</h1>
      <p className="mt-1 text-[0.88rem] text-slate-500">Draft, review, approve, and disburse each cycle. A run locks once disbursed.</p>

      {/* Generate */}
      <form action="/api/payroll/generate" method="post" className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
        <h2 className="text-[0.95rem] font-700 text-slate-900">Generate a run</h2>
        <p className="mt-0.5 text-[0.8rem] text-slate-500">Reads {emp[0]!.c} active worker{emp[0]!.c === 1 ? "" : "s"} from HR and computes each line with the Tax Engine.</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-[0.8rem] font-600 text-slate-700">Period</span>
            <input name="period" defaultValue={defaultPeriod} className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-[0.88rem] text-slate-900 focus:border-[#543CDA] focus:outline-none focus:ring-2 focus:ring-[#543CDA]/15" />
          </label>
          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-[0.8rem] font-600 text-slate-700">Run type</span>
            <select name="run_type" defaultValue="Regular" className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-[0.88rem] text-slate-900 focus:border-[#543CDA] focus:outline-none">
              <option value="Regular">Regular monthly</option>
              <option value="Bonus">Bonus / 13th month</option>
              <option value="Final">Final settlement</option>
            </select>
          </label>
          <button type="submit" className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#543CDA] px-5 py-2.5 text-[0.86rem] font-600 text-white hover:bg-[#4330B8]"><Wallet size={15} strokeWidth={2} /> Generate</button>
        </div>
      </form>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-subtle">
        {rows.length === 0 ? (
          <p className="px-5 py-12 text-center text-[0.88rem] text-slate-500">No pay runs yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead><tr className="border-b border-slate-200 bg-slate-50 text-[0.7rem] uppercase tracking-wide text-slate-500"><th className="px-5 py-3 font-600">Period</th><th className="px-5 py-3 font-600">Type</th><th className="px-5 py-3 font-600">Workers</th><th className="px-5 py-3 font-600">Gross</th><th className="px-5 py-3 font-600">Net</th><th className="px-5 py-3 font-600">Status</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60">
                    <td className="px-5 py-3"><Link href={`/payroll/runs/${r.id}`} className="text-[0.85rem] font-600 text-slate-900 hover:text-[#543CDA]">{r.period}</Link></td>
                    <td className="px-5 py-3 text-[0.83rem] text-slate-600">{r.run_type}</td>
                    <td className="px-5 py-3 font-mono text-[0.83rem] text-slate-700">{r.employee_count}</td>
                    <td className="px-5 py-3 font-mono text-[0.83rem] text-slate-700">{naira(r.gross)}</td>
                    <td className="px-5 py-3 font-mono text-[0.83rem] text-slate-900">{naira(r.net)}</td>
                    <td className="px-5 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-600 ${STATUS[r.status]}`}>{r.status}</span></td>
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
