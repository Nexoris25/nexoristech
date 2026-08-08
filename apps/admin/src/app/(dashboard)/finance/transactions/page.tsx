/**
 * Transactions (PRD 6.10). The unified ledger: money in (invoice payments) and money out (expenses),
 * newest first, each row opening its underlying record. Income is only ever recognised through an
 * invoice payment (6.4) - there is no free-typed income entry - so "Record Income" routes to raising
 * an invoice, and "Record Expense" to the payables screen.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { requireAdmin } from "../../../../lib/auth.js";
import { db } from "../../../../lib/db.js";
import { naira } from "../../../../lib/finance.js";

export const dynamic = "force-dynamic";

interface Row { kind: "Income" | "Expense"; label: string; party: string; amount: string; txn_date: string; href: string }

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<{ type?: string }> }): Promise<ReactNode> {
  await requireAdmin();
  const { type } = await searchParams;
  const filter = type === "income" ? "Income" : type === "expense" ? "Expense" : null;

  const { rows } = await db().query<Row>(
    `SELECT * FROM (
       SELECT 'Income'::text kind, e.customer_name label, COALESCE(e.project_name,'Invoice payment') party,
              p.amount::text, p.payment_date::text txn_date, ('/e-invoicing/doc/'||e.id) href
         FROM einvoice_payment p JOIN einvoice e ON e.id = p.einvoice_id
       UNION ALL
       SELECT 'Expense'::text, e.description, COALESCE(e.vendor,'—'), e.amount::text, e.expense_date::text,
              ('/finance/payables/'||e.id)
         FROM expense e
     ) t ${filter ? "WHERE t.kind = $1" : ""} ORDER BY t.txn_date DESC LIMIT 200`,
    filter ? [filter] : [],
  );

  const tabs = [["All", ""], ["Income", "income"], ["Expenses", "expense"]] as const;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900">Transactions</h1>
          <p className="mt-1 text-[0.88rem] text-slate-500">Every Naira in and out, newest first.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/finance/invoices/new" className="rounded-lg bg-[#543CDA] px-4 py-2 text-[0.83rem] font-600 text-white hover:bg-[#4330B8]">Raise Invoice</Link>
          <Link href="/finance/payables" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[0.83rem] font-600 text-slate-700 hover:bg-slate-50">Record Expense</Link>
        </div>
      </div>

      <div className="mt-4 inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
        {tabs.map(([label, val]) => {
          const active = (val === "" && !filter) || (val === "income" && filter === "Income") || (val === "expense" && filter === "Expense");
          return <Link key={label} href={val ? `/finance/transactions?type=${val}` : "/finance/transactions"} className={`rounded-md px-3.5 py-1.5 text-[0.8rem] font-600 ${active ? "bg-[#543CDA] text-white" : "text-slate-600 hover:bg-slate-50"}`}>{label}</Link>;
        })}
      </div>

      <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-subtle">
        {rows.length === 0 ? (
          <p className="px-5 py-14 text-center text-[0.86rem] text-slate-500">No transactions yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {rows.map((x, i) => (
              <Link key={i} href={x.href} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/60">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${x.kind === "Income" ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#FEE2E2] text-[#B91C1C]"}`}>{x.kind === "Income" ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}</span>
                <div className="min-w-0 flex-1"><p className="truncate text-[0.85rem] font-600 text-slate-900">{x.label}</p><p className="truncate text-[0.76rem] text-slate-500">{x.party} · {new Date(x.txn_date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</p></div>
                <span className={`shrink-0 font-mono text-[0.85rem] font-700 ${x.kind === "Income" ? "text-[#15803D]" : "text-slate-900"}`}>{x.kind === "Income" ? "+" : "−"}{naira(x.amount)}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
