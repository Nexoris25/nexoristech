/**
 * Payroll - Salary Advances (PRD 8.12 approval queue; 8.6). An advance is a future payroll deduction
 * disbursed early: HR/anyone raises it, a Payroll or Finance Admin approves and sets the repayment
 * plan. It sits as an asset in Finance; each payroll repayment reduces net pay and the outstanding
 * balance, netted off the final settlement on exit. Not a loan product.
 */
import type { ReactNode } from "react";
import { HandCoins } from "lucide-react";
import { requireCapability } from "../../../../lib/auth.js";
import { db } from "../../../../lib/db.js";

export const dynamic = "force-dynamic";

interface Row {
  id: string; employee: string; amount: string; reason: string | null; status: string;
  repayment_months: number; monthly_repayment: string; outstanding: string;
}
const STATUS: Record<string, string> = {
  Pending: "bg-[#FEF3C7] text-[#B45309]",
  Approved: "bg-[#EEEBFC] text-[#543CDA]",
  Repaying: "bg-[#DBEAFE] text-[#1D4ED8]",
  Repaid: "bg-[#DCFCE7] text-[#15803D]",
  Declined: "bg-[#FEE2E2] text-[#B91C1C]",
};
function naira(v: string): string { return `₦${Number(v).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`; }

export default async function AdvancesPage(): Promise<ReactNode> {
  await requireCapability("payroll.prepare");
  const [{ rows }, { rows: emps }] = await Promise.all([
    db().query<Row>(
      `SELECT sa.id, e.full_name AS employee, sa.amount::text, sa.reason, sa.status, sa.repayment_months,
              sa.monthly_repayment::text, sa.outstanding::text
         FROM salary_advance sa JOIN employee e ON e.id = sa.employee_id
        ORDER BY (sa.status='Pending') DESC, sa.requested_at DESC LIMIT 100`),
    db().query<{ id: string; full_name: string }>("SELECT id, full_name FROM employee WHERE employment_status <> 'Exited' ORDER BY full_name"),
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-[1.4rem] font-700 text-slate-900">Salary Advances</h1>
      <p className="mt-1 text-[0.88rem] text-slate-500">A future payroll deduction disbursed early. Approved advances repay automatically from the next runs.</p>

      <form action="/api/payroll/advances" method="post" className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
        <input type="hidden" name="action" value="request" />
        <h2 className="text-[0.95rem] font-700 text-slate-900">Raise a request</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
          <label className="flex flex-col gap-1.5 sm:col-span-2"><span className="text-[0.78rem] font-600 text-slate-700">Employee</span>
            <select name="employee_id" required defaultValue="" className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-[0.86rem] text-slate-900 focus:border-[#543CDA] focus:outline-none"><option value="" disabled>Select</option>{emps.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}</select>
          </label>
          <label className="flex flex-col gap-1.5"><span className="text-[0.78rem] font-600 text-slate-700">Amount (₦)</span><input name="amount" type="number" min="0" required className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[0.86rem] text-slate-900 focus:border-[#543CDA] focus:outline-none" /></label>
          <label className="flex flex-col gap-1.5"><span className="text-[0.78rem] font-600 text-slate-700">Reason</span><input name="reason" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[0.86rem] text-slate-900 focus:border-[#543CDA] focus:outline-none" /></label>
        </div>
        <div className="mt-3 flex justify-end"><button type="submit" className="rounded-lg bg-[#543CDA] px-5 py-2 text-[0.84rem] font-600 text-white hover:bg-[#4330B8]">Submit Request</button></div>
      </form>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-subtle">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-14 text-center"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#EEEBFC] text-[#543CDA]"><HandCoins size={22} strokeWidth={2} /></span><p className="text-[0.92rem] font-600 text-slate-700">No advance requests</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead><tr className="border-b border-slate-200 bg-slate-50 text-[0.7rem] uppercase tracking-wide text-slate-500"><th className="px-5 py-3 font-600">Employee</th><th className="px-5 py-3 font-600">Amount</th><th className="px-5 py-3 font-600">Reason</th><th className="px-5 py-3 font-600">Outstanding</th><th className="px-5 py-3 font-600">Status</th><th className="px-5 py-3 font-600" aria-label="Action" /></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 last:border-b-0">
                    <td className="px-5 py-3 text-[0.85rem] font-600 text-slate-900">{r.employee}</td>
                    <td className="px-5 py-3 font-mono text-[0.83rem] text-slate-900">{naira(r.amount)}</td>
                    <td className="px-5 py-3 text-[0.83rem] text-slate-600">{r.reason ?? "—"}</td>
                    <td className="px-5 py-3 font-mono text-[0.83rem] text-slate-700">{r.status === "Approved" || r.status === "Repaying" ? naira(r.outstanding) : "—"}</td>
                    <td className="px-5 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-600 ${STATUS[r.status]}`}>{r.status}</span></td>
                    <td className="px-5 py-3">
                      {r.status === "Pending" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <form action="/api/payroll/advances" method="post" className="flex items-center gap-1"><input type="hidden" name="action" value="approve" /><input type="hidden" name="id" value={r.id} /><input name="months" type="number" min="1" defaultValue="1" title="Repayment months" className="w-14 rounded-md border border-slate-200 px-2 py-1.5 text-[0.76rem]" /><button className="rounded-lg bg-[#543CDA] px-3 py-1.5 text-[0.76rem] font-600 text-white hover:bg-[#4330B8]">Approve</button></form>
                          <form action="/api/payroll/advances" method="post"><input type="hidden" name="action" value="decline" /><input type="hidden" name="id" value={r.id} /><button className="rounded-lg border border-slate-200 px-3 py-1.5 text-[0.76rem] font-600 text-slate-600 hover:bg-slate-50">Decline</button></form>
                        </div>
                      ) : r.status === "Approved" || r.status === "Repaying" ? (
                        <span className="block text-right text-[0.76rem] text-slate-500">{naira(r.monthly_repayment)}/mo × {r.repayment_months}</span>
                      ) : null}
                    </td>
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
