/**
 * HR - Employee expense claims (PRD 7.10, approval queue; 7.7). An employee submits a claim with a
 * receipt, a manager approves, and it is reimbursed standalone or as a non-taxable line on the next
 * pay run. Distinct from a company expense entered directly by Finance. HR Admin and managers.
 */
import type { ReactNode } from "react";
import { Receipt } from "lucide-react";
import { requireStaff } from "../../../../lib/auth.js";
import { db } from "../../../../lib/db.js";

export const dynamic = "force-dynamic";

interface Row {
  id: string;
  employee: string;
  description: string;
  amount: string;
  incurred_on: string | null;
  status: string;
}

const STATUS: Record<string, string> = {
  Pending: "bg-[#FEF3C7] text-[#B45309]",
  Approved: "bg-[#DBEAFE] text-[#1D4ED8]",
  Rejected: "bg-[#FEE2E2] text-[#B91C1C]",
  Reimbursed: "bg-[#DCFCE7] text-[#15803D]",
};

function naira(v: string): string {
  return `₦${Number.parseFloat(v).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function ExpensesPage(): Promise<ReactNode> {
  await requireStaff();
  const { rows } = await db().query<Row>(
    `SELECT ec.id, e.full_name AS employee, ec.description, ec.amount::text, ec.incurred_on::text, ec.status
       FROM expense_claim ec JOIN employee e ON e.id = ec.employee_id
      ORDER BY (ec.status = 'Pending') DESC, ec.created_at DESC LIMIT 100`,
  );
  const pending = rows.filter((r) => r.status === "Pending").length;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900">Expense Claims</h1>
          <p className="mt-1 text-[0.88rem] text-slate-500">Employee-submitted claims with receipts. Reimbursed standalone or on the next pay run.</p>
        </div>
        {pending > 0 ? <span className="rounded-full bg-[#FEF3C7] px-3 py-1.5 text-[0.8rem] font-600 text-[#B45309]">{pending} pending</span> : null}
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-subtle">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-14 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#EEEBFC] text-[#543CDA]"><Receipt size={22} strokeWidth={2} /></span>
            <p className="text-[0.92rem] font-600 text-slate-700">No expense claims</p>
            <p className="max-w-sm text-[0.85rem] text-slate-500">Claims appear here for approval once employees submit them.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[0.7rem] uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-600">Employee</th>
                  <th className="px-5 py-3 font-600">Description</th>
                  <th className="px-5 py-3 font-600">Amount</th>
                  <th className="px-5 py-3 font-600">Incurred</th>
                  <th className="px-5 py-3 font-600">Status</th>
                  <th className="px-5 py-3 font-600" aria-label="Action" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 last:border-b-0">
                    <td className="px-5 py-3 text-[0.85rem] font-600 text-slate-900">{r.employee}</td>
                    <td className="px-5 py-3 text-[0.83rem] text-slate-600">{r.description}</td>
                    <td className="px-5 py-3 font-mono text-[0.83rem] text-slate-900">{naira(r.amount)}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-[0.83rem] text-slate-600">{r.incurred_on ? new Date(r.incurred_on).toLocaleDateString("en-NG", { day: "numeric", month: "short" }) : "—"}</td>
                    <td className="px-5 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-600 ${STATUS[r.status]}`}>{r.status}</span></td>
                    <td className="px-5 py-3">
                      {r.status === "Pending" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <form action="/api/hr/expenses" method="post"><input type="hidden" name="id" value={r.id} /><input type="hidden" name="decision" value="Approved" /><button className="rounded-lg bg-[#543CDA] px-3 py-1.5 text-[0.76rem] font-600 text-white hover:bg-[#4330B8]">Approve</button></form>
                          <form action="/api/hr/expenses" method="post"><input type="hidden" name="id" value={r.id} /><input type="hidden" name="decision" value="Rejected" /><button className="rounded-lg border border-slate-200 px-3 py-1.5 text-[0.76rem] font-600 text-slate-600 hover:bg-slate-50">Reject</button></form>
                        </div>
                      ) : r.status === "Approved" ? (
                        <form action="/api/hr/expenses" method="post" className="text-right"><input type="hidden" name="id" value={r.id} /><input type="hidden" name="decision" value="Reimbursed" /><button className="rounded-lg border border-[#DDD6FE] px-3 py-1.5 text-[0.76rem] font-600 text-[#543CDA] hover:bg-[#F4F1FD]">Mark reimbursed</button></form>
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
