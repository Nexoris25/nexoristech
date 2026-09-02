/**
 * Financial Reports (PRD 6.8, 6.10). Read-only rollups over the current calendar year: income by
 * engagement type (the PRD keeps Recurring and Project revenue separate, 6.3), expenses by category,
 * a month-by-month cash flow summary, and the receivables vs payables position. Every figure reads
 * from payments and expenses, never recalculated a second way.
 */
import type { ReactNode } from "react";
import { requireCapability } from "../../../../lib/auth.js";
import { db } from "../../../../lib/db.js";
import { naira, RECEIVABLE_SQL } from "../../../../lib/finance.js";

export const dynamic = "force-dynamic";

interface Cat { label: string; total: string }
interface Month { m: string; income: string; expense: string }

function Bars({ rows, color }: { rows: Cat[]; color: string }): ReactNode {
  const max = Math.max(...rows.map((r) => Number(r.total)), 1);
  return (
    <div className="mt-3 space-y-2.5">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="flex items-center justify-between text-[0.8rem]"><span className="text-slate-700">{r.label}</span><span className="font-mono font-600 text-slate-900">{naira(r.total)}</span></div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${(Number(r.total) / max) * 100}%`, background: color }} /></div>
        </div>
      ))}
    </div>
  );
}

export default async function ReportsPage(): Promise<ReactNode> {
  await requireCapability("finance.report");
  const year = new Date().getFullYear();
  const pool = db();
  const [{ rows: income }, { rows: expense }, { rows: months }, { rows: pos }, { rows: byProject }] = await Promise.all([
    pool.query<Cat>(
      `SELECT COALESCE(e.billing_type,'OneOff') label, sum(p.amount)::text total
         FROM einvoice_payment p JOIN einvoice e ON e.id=p.einvoice_id
        WHERE extract(year FROM p.payment_date)=$1 GROUP BY 1 ORDER BY sum(p.amount) DESC`, [year]),
    pool.query<Cat>(
      `SELECT COALESCE(c.name,'Uncategorised') label, sum(e.amount)::text total
         FROM expense e LEFT JOIN finance_category c ON c.id=e.category_id
        WHERE extract(year FROM e.expense_date)=$1 GROUP BY 1 ORDER BY sum(e.amount) DESC`, [year]),
    pool.query<Month>(
      `WITH m AS (SELECT generate_series(1,12) n)
       SELECT to_char(make_date($1,m.n,1),'Mon') AS m,
              COALESCE((SELECT sum(amount) FROM einvoice_payment p WHERE extract(year FROM p.payment_date)=$1 AND extract(month FROM p.payment_date)=m.n),0)::text income,
              COALESCE((SELECT sum(amount) FROM expense e WHERE extract(year FROM e.expense_date)=$1 AND extract(month FROM e.expense_date)=m.n),0)::text expense
         FROM m ORDER BY m.n`, [year]),
    pool.query<{ receivables: string; overdue_recv: string; payables: string }>(
      `SELECT (SELECT COALESCE(sum(total-amount_paid),0) FROM einvoice WHERE ${RECEIVABLE_SQL})::text receivables,
              (SELECT COALESCE(sum(total-amount_paid),0) FROM einvoice WHERE ${RECEIVABLE_SQL} AND due_date IS NOT NULL AND due_date < current_date)::text overdue_recv,
              (SELECT COALESCE(sum(amount),0) FROM expense WHERE status='Unpaid')::text payables`),
    // Revenue by project: payments received, joined through the invoices that point at a project.
    // Cancelled invoices are excluded, and NRS status is not consulted — a payment is a payment
    // whether or not the document behind it was ever filed.
    pool.query<Cat>(
      `SELECT pr.name label, sum(pay.amount)::text total
         FROM einvoice_payment pay
         JOIN einvoice e ON e.id = pay.einvoice_id
         JOIN project pr ON pr.id = e.project_id
        WHERE extract(year FROM pay.payment_date)=$1 AND e.cancelled_at IS NULL
        GROUP BY pr.name ORDER BY sum(pay.amount) DESC LIMIT 12`, [year]),
  ]);
  const p = pos[0]!;
  const totalIncome = income.reduce((t, r) => t + Number(r.total), 0);
  const totalExpense = expense.reduce((t, r) => t + Number(r.total), 0);
  const maxMonth = Math.max(...months.map((m) => Math.max(Number(m.income), Number(m.expense))), 1);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between">
        <div><h1 className="text-[1.4rem] font-700 text-slate-900">Financial Reports</h1><p className="mt-1 text-[0.88rem] text-slate-500">Income, expenses, cash flow, and the receivables/payables position.</p></div>
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[0.78rem] font-600 text-slate-600">{year}</span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <div className="flex items-center justify-between"><h2 className="text-[0.95rem] font-700 text-slate-900">Income Report</h2><span className="font-mono text-[0.85rem] font-700 text-[#15803D]">{naira(totalIncome)}</span></div>
          <p className="text-[0.76rem] text-slate-500">By engagement type · Recurring and Project kept separate</p>
          {income.length ? <Bars rows={income} color="#16A34A" /> : <p className="mt-3 text-[0.82rem] text-slate-500">No income recorded this year.</p>}
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <div className="flex items-center justify-between"><h2 className="text-[0.95rem] font-700 text-slate-900">Revenue by Project</h2><span className="font-mono text-[0.85rem] font-700 text-[#543CDA]">{naira(byProject.reduce((t, r) => t + Number(r.total), 0))}</span></div>
          <p className="text-[0.76rem] text-slate-500">Payments received against each project this year</p>
          {byProject.length ? <Bars rows={byProject} color="#543CDA" /> : <p className="mt-3 text-[0.82rem] text-slate-500">No project payments recorded this year.</p>}
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <div className="flex items-center justify-between"><h2 className="text-[0.95rem] font-700 text-slate-900">Expense Report</h2><span className="font-mono text-[0.85rem] font-700 text-[#B91C1C]">{naira(totalExpense)}</span></div>
          <p className="text-[0.76rem] text-slate-500">By category</p>
          {expense.length ? <Bars rows={expense} color="#B91C1C" /> : <p className="mt-3 text-[0.82rem] text-slate-500">No expenses recorded this year.</p>}
        </section>
      </div>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
        <h2 className="text-[0.95rem] font-700 text-slate-900">Cash Flow Summary</h2>
        <p className="text-[0.76rem] text-slate-500">Income vs expenses, month by month</p>
        <div className="mt-4 flex items-end gap-2 overflow-x-auto pb-2">
          {months.map((m) => (
            <div key={m.m} className="flex min-w-[2.2rem] flex-1 flex-col items-center gap-1">
              <div className="flex h-32 w-full items-end justify-center gap-0.5">
                <div className="w-1/2 rounded-t bg-[#16A34A]" style={{ height: `${(Number(m.income) / maxMonth) * 100}%` }} title={`Income ${naira(m.income)}`} />
                <div className="w-1/2 rounded-t bg-[#B91C1C]" style={{ height: `${(Number(m.expense) / maxMonth) * 100}%` }} title={`Expense ${naira(m.expense)}`} />
              </div>
              <span className="text-[0.68rem] text-slate-500">{m.m}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-4 text-[0.74rem] text-slate-500"><span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#16A34A]" /> Income</span><span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#B91C1C]" /> Expenses</span></div>
      </section>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
        <h2 className="text-[0.95rem] font-700 text-slate-900">Receivables &amp; Payables</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-[#F4F1FD] p-4"><p className="text-[0.76rem] text-slate-500">Outstanding receivables</p><p className="mt-1 font-mono text-[1.15rem] font-700 text-[#543CDA]">{naira(p.receivables)}</p><p className="text-[0.72rem] text-[#B91C1C]">{naira(p.overdue_recv)} overdue</p></div>
          <div className="rounded-xl bg-slate-50 p-4"><p className="text-[0.76rem] text-slate-500">Outstanding payables</p><p className="mt-1 font-mono text-[1.15rem] font-700 text-[#B45309]">{naira(p.payables)}</p></div>
          <div className="rounded-xl bg-slate-50 p-4"><p className="text-[0.76rem] text-slate-500">Net position</p><p className={`mt-1 font-mono text-[1.15rem] font-700 ${Number(p.receivables) - Number(p.payables) >= 0 ? "text-[#15803D]" : "text-[#B91C1C]"}`}>{naira(Number(p.receivables) - Number(p.payables))}</p></div>
        </div>
      </section>
    </div>
  );
}
