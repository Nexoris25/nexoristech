/**
 * Finance Overview (PRD 6.10). The summary the founder and Finance Admin open to: cash
 * position, income vs expenses this financial year, what is owed to us (receivables) and by us
 * (payables), the latest transactions, and the alerts that need action - overdue and near-due
 * invoices. Every figure reads from the invoice, payment, and expense tables, never invented.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, TriangleAlert, Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { requireAdmin } from "../../../lib/auth.js";
import { db } from "../../../lib/db.js";
import { naira } from "../../../lib/finance.js";

export const dynamic = "force-dynamic";

interface Txn { kind: "Income" | "Expense"; label: string; party: string; amount: string; txn_date: string; ref_id: string }
interface Alert { id: string; client_name: string; due_date: string; outstanding: string; overdue: boolean }

export default async function FinanceDashboard(): Promise<ReactNode> {
  await requireAdmin();
  const pool = db();
  const [totals, txns, alerts] = await Promise.all([
    pool.query<{ income: string; expenses: string; receivables: string; payables: string }>(
      `SELECT
         (SELECT COALESCE(sum(amount),0) FROM einvoice_payment)::text income,
         (SELECT COALESCE(sum(amount),0) FROM expense)::text expenses,
         (SELECT COALESCE(sum(total - amount_paid),0) FROM einvoice
            WHERE doc_type='Invoice' AND nrs_status='Accepted' AND amount_paid < total AND lifecycle_status <> 'Closed')::text receivables,
         (SELECT COALESCE(sum(amount),0) FROM expense WHERE status='Unpaid')::text payables`),
    pool.query<Txn>(
      `SELECT * FROM (
         SELECT 'Income'::text kind, e.customer_name label, COALESCE(e.project_name,'Invoice payment') party,
                p.amount::text, p.payment_date::text txn_date, e.id ref_id
           FROM einvoice_payment p JOIN einvoice e ON e.id = p.einvoice_id
         UNION ALL
         SELECT 'Expense'::text, e.description, COALESCE(e.vendor,'—'), e.amount::text, e.expense_date::text, e.id
           FROM expense e
       ) t ORDER BY t.txn_date DESC LIMIT 8`),
    pool.query<Alert>(
      `SELECT id, customer_name AS client_name, due_date::text, (total - amount_paid)::text outstanding,
              (due_date < current_date) overdue
         FROM einvoice WHERE doc_type='Invoice' AND nrs_status='Accepted' AND amount_paid < total AND lifecycle_status <> 'Closed'
           AND due_date IS NOT NULL AND due_date <= current_date + 3
        ORDER BY due_date ASC LIMIT 6`),
  ]);
  const t = totals.rows[0]!;
  const income = Number(t.income), expenses = Number(t.expenses);
  const net = income - expenses;
  const max = Math.max(income, expenses, 1);

  const KPI = [
    { label: "Cash Position", value: naira(net), icon: Wallet, tint: net >= 0 ? "text-[#15803D]" : "text-[#B91C1C]", sub: "Income received less expenses" },
    { label: "Outstanding Receivables", value: naira(t.receivables), icon: ArrowDownLeft, tint: "text-[#543CDA]", sub: "Owed to us on live invoices" },
    { label: "Outstanding Payables", value: naira(t.payables), icon: ArrowUpRight, tint: "text-[#B45309]", sub: "Unpaid expenses" },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900">Finance</h1>
          <p className="mt-1 text-[0.88rem] text-slate-500">Cash, receivables, payables, and what needs action.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/finance/invoices/new" className="rounded-lg bg-[#543CDA] px-4 py-2 text-[0.83rem] font-600 text-white hover:bg-[#4330B8]">Raise Invoice</Link>
          <Link href="/finance/payables" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[0.83rem] font-600 text-slate-700 hover:bg-slate-50">Record Expense</Link>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {KPI.map((k) => (
          <div key={k.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
            <div className="flex items-center justify-between"><span className="text-[0.8rem] font-600 text-slate-500">{k.label}</span><k.icon size={18} strokeWidth={2} className={k.tint} /></div>
            <p className={`mt-2 font-mono text-[1.5rem] font-700 ${k.tint}`}>{k.value}</p>
            <p className="mt-1 text-[0.76rem] text-slate-500">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Income vs Expenses */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle lg:col-span-2">
          <h2 className="text-[0.95rem] font-700 text-slate-900">Income vs Expenses</h2>
          <div className="mt-4 space-y-4">
            <div>
              <div className="flex items-center justify-between text-[0.82rem]"><span className="flex items-center gap-1.5 font-600 text-slate-700"><TrendingUp size={15} className="text-[#15803D]" /> Income</span><span className="font-mono font-600 text-slate-900">{naira(income)}</span></div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#16A34A]" style={{ width: `${(income / max) * 100}%` }} /></div>
            </div>
            <div>
              <div className="flex items-center justify-between text-[0.82rem]"><span className="flex items-center gap-1.5 font-600 text-slate-700"><TrendingDown size={15} className="text-[#B91C1C]" /> Expenses</span><span className="font-mono font-600 text-slate-900">{naira(expenses)}</span></div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#B91C1C]" style={{ width: `${(expenses / max) * 100}%` }} /></div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3"><span className="text-[0.82rem] font-600 text-slate-700">Net</span><span className={`font-mono text-[0.95rem] font-700 ${net >= 0 ? "text-[#15803D]" : "text-[#B91C1C]"}`}>{naira(net)}</span></div>
        </section>

        {/* Financial Alerts */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="flex items-center gap-2 text-[0.95rem] font-700 text-slate-900"><TriangleAlert size={16} className="text-[#B45309]" /> Financial Alerts</h2>
          {alerts.rows.length === 0 ? (
            <p className="mt-3 text-[0.83rem] text-slate-500">Nothing due in the next 3 days.</p>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {alerts.rows.map((a) => (
                <Link key={a.id} href={`/e-invoicing/doc/${a.id}`} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50">
                  <div className="min-w-0"><p className="truncate text-[0.82rem] font-600 text-slate-800">{a.client_name}</p><p className={`text-[0.73rem] ${a.overdue ? "text-[#B91C1C]" : "text-slate-500"}`}>{a.overdue ? "Overdue" : "Due"} {new Date(a.due_date).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}</p></div>
                  <span className="shrink-0 font-mono text-[0.8rem] font-600 text-slate-900">{naira(a.outstanding)}</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Recent Transactions */}
      <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-subtle">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5"><h2 className="text-[0.95rem] font-700 text-slate-900">Recent Transactions</h2><Link href="/finance/transactions" className="text-[0.8rem] font-600 text-[#543CDA] hover:text-[#4330B8]">View all</Link></div>
        {txns.rows.length === 0 ? (
          <p className="px-5 py-12 text-center text-[0.86rem] text-slate-500">No transactions yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {txns.rows.map((x, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${x.kind === "Income" ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#FEE2E2] text-[#B91C1C]"}`}>{x.kind === "Income" ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}</span>
                <div className="min-w-0 flex-1"><p className="truncate text-[0.85rem] font-600 text-slate-900">{x.label}</p><p className="truncate text-[0.76rem] text-slate-500">{x.party} · {new Date(x.txn_date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</p></div>
                <span className={`shrink-0 font-mono text-[0.85rem] font-700 ${x.kind === "Income" ? "text-[#15803D]" : "text-slate-900"}`}>{x.kind === "Income" ? "+" : "−"}{naira(x.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
