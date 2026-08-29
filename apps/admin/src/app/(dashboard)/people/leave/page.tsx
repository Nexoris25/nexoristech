/**
 * HR - Leave calendar and requests (PRD 7.10, approval queue; 7.6). Leave types match the Labour
 * Act (annual, sick, maternity, paternity), each request carrying a balance-affecting day count and
 * a manager approval step. Balances feed the Payroll final settlement (8.5). HR Admin and managers.
 */
import type { ReactNode } from "react";
import { CalendarClock } from "lucide-react";
import { requireCapability } from "../../../../lib/auth.js";
import { db } from "../../../../lib/db.js";

export const dynamic = "force-dynamic";

interface Row {
  id: string;
  employee: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  reason: string | null;
  status: string;
}

const STATUS: Record<string, string> = {
  Pending: "bg-[#FEF3C7] text-[#B45309]",
  Approved: "bg-[#DCFCE7] text-[#15803D]",
  Rejected: "bg-[#FEE2E2] text-[#B91C1C]",
};

export default async function LeavePage(): Promise<ReactNode> {
  await requireCapability("hr.leave.decide");
  const { rows } = await db().query<Row>(
    `SELECT lr.id, e.full_name AS employee, lr.leave_type, lr.start_date::text, lr.end_date::text, lr.days, lr.reason, lr.status
       FROM leave_request lr JOIN employee e ON e.id = lr.employee_id
      ORDER BY (lr.status = 'Pending') DESC, lr.created_at DESC LIMIT 100`,
  );
  const pending = rows.filter((r) => r.status === "Pending").length;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900">Leave Requests</h1>
          <p className="mt-1 text-[0.88rem] text-slate-500">Annual, sick, maternity, and paternity leave, with a manager approval step.</p>
        </div>
        {pending > 0 ? <span className="rounded-full bg-[#FEF3C7] px-3 py-1.5 text-[0.8rem] font-600 text-[#B45309]">{pending} pending</span> : null}
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-subtle">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-14 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#EEEBFC] text-[#543CDA]"><CalendarClock size={22} strokeWidth={2} /></span>
            <p className="text-[0.92rem] font-600 text-slate-700">No leave requests</p>
            <p className="max-w-sm text-[0.85rem] text-slate-500">Requests appear here for approval once employees are onboarded and submit them.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[0.7rem] uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-600">Employee</th>
                  <th className="px-5 py-3 font-600">Type</th>
                  <th className="px-5 py-3 font-600">From</th>
                  <th className="px-5 py-3 font-600">To</th>
                  <th className="px-5 py-3 font-600">Days</th>
                  <th className="px-5 py-3 font-600">Status</th>
                  <th className="px-5 py-3 font-600" aria-label="Action" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 last:border-b-0">
                    <td className="px-5 py-3 text-[0.85rem] font-600 text-slate-900">{r.employee}</td>
                    <td className="px-5 py-3 text-[0.83rem] text-slate-600">{r.leave_type}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-[0.83rem] text-slate-600">{new Date(r.start_date).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-[0.83rem] text-slate-600">{new Date(r.end_date).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}</td>
                    <td className="px-5 py-3 font-mono text-[0.83rem] text-slate-700">{r.days}</td>
                    <td className="px-5 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-600 ${STATUS[r.status]}`}>{r.status}</span></td>
                    <td className="px-5 py-3">
                      {r.status === "Pending" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <form action="/api/hr/leave" method="post"><input type="hidden" name="id" value={r.id} /><input type="hidden" name="decision" value="Approved" /><button className="rounded-lg bg-[#543CDA] px-3 py-1.5 text-[0.76rem] font-600 text-white hover:bg-[#4330B8]">Approve</button></form>
                          <form action="/api/hr/leave" method="post"><input type="hidden" name="id" value={r.id} /><input type="hidden" name="decision" value="Rejected" /><button className="rounded-lg border border-slate-200 px-3 py-1.5 text-[0.76rem] font-600 text-slate-600 hover:bg-slate-50">Reject</button></form>
                        </div>
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
