/**
 * Accounts Payable - expenses (PRD 6.5, 6.10). What the company spends: a company expense entered
 * directly by Finance against a category and an optional vendor. This is the PRD's Expenses screen
 * framed as payables; there is no separate Bill/Vendor sub-ledger. Filter by vendor to read a vendor
 * statement. Payroll-posted rows (source 'Payroll') are shown but not editable here.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { requireCapability } from "../../../../lib/auth.js";
import { db } from "../../../../lib/db.js";
import { naira } from "../../../../lib/finance.js";

export const dynamic = "force-dynamic";

interface Row { id: string; seq: string; expense_date: string; vendor: string | null; description: string; category: string | null; amount: string; status: string; source: string }
const field = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-[0.85rem] focus:border-[#543CDA] focus:outline-none";
const lbl = "text-[0.76rem] font-600 text-slate-700";

export default async function PayablesPage({ searchParams }: { searchParams: Promise<{ vendor?: string }> }): Promise<ReactNode> {
  await requireCapability("finance.read");
  const { vendor } = await searchParams;
  const pool = db();
  const [{ rows }, { rows: cats }, { rows: methods }, { rows: vendors }, { rows: sum }] = await Promise.all([
    pool.query<Row>(
      `SELECT e.id, e.seq::text, e.expense_date::text, e.vendor, e.description, c.name category, e.amount::text, e.status, e.source
         FROM expense e LEFT JOIN finance_category c ON c.id = e.category_id
        ${vendor ? "WHERE lower(e.vendor) = lower($1)" : ""} ORDER BY e.expense_date DESC LIMIT 100`, vendor ? [vendor] : []),
    pool.query<{ id: string; name: string }>("SELECT id, name FROM finance_category WHERE kind='Expense' AND active ORDER BY sort, name"),
    pool.query<{ id: string; name: string }>("SELECT id, name FROM payment_method WHERE active ORDER BY created_at"),
    pool.query<{ vendor: string; total: string }>("SELECT vendor, sum(amount)::text total FROM expense WHERE vendor IS NOT NULL GROUP BY vendor ORDER BY sum(amount) DESC LIMIT 12"),
    pool.query<{ total: string; unpaid: string }>("SELECT COALESCE(sum(amount),0)::text total, COALESCE(sum(amount) FILTER (WHERE status='Unpaid'),0)::text unpaid FROM expense" + (vendor ? " WHERE lower(vendor)=lower($1)" : ""), vendor ? [vendor] : []),
  ]);
  const s = sum[0]!;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900">Accounts Payable</h1>
          <p className="mt-1 text-[0.88rem] text-slate-500">{vendor ? `Vendor statement · ${vendor}` : "Company expenses by category and vendor."}</p>
        </div>
        <div className="flex gap-2 text-right">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-subtle"><p className="text-[0.7rem] text-slate-500">Total spent</p><p className="font-mono text-[0.95rem] font-700 text-slate-900">{naira(s.total)}</p></div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-subtle"><p className="text-[0.7rem] text-slate-500">Unpaid</p><p className="font-mono text-[0.95rem] font-700 text-[#B45309]">{naira(s.unpaid)}</p></div>
        </div>
      </div>

      {vendor ? <Link href="/finance/payables" className="mt-3 inline-block text-[0.8rem] font-600 text-[#543CDA]">← All expenses</Link> : null}

      {/* Record Expense */}
      <form action="/api/finance/expenses" method="post" className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
        <h2 className="text-[0.95rem] font-700 text-slate-900">Record an expense</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5 sm:col-span-2"><span className={lbl}>Description</span><input name="description" required className={field} /></label>
          <label className="flex flex-col gap-1.5"><span className={lbl}>Amount (₦)</span><input name="amount" type="number" step="0.01" min="0" required className={field} /></label>
          <label className="flex flex-col gap-1.5"><span className={lbl}>Category</span><select name="category_id" defaultValue="" className={`cursor-pointer ${field}`}><option value="">Uncategorised</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label className="flex flex-col gap-1.5"><span className={lbl}>Vendor</span><input name="vendor" defaultValue={vendor ?? ""} className={field} /></label>
          <label className="flex flex-col gap-1.5"><span className={lbl}>Date</span><input name="expense_date" type="date" defaultValue={today} className={field} /></label>
          <label className="flex flex-col gap-1.5"><span className={lbl}>VAT paid (₦)</span><input name="vat" type="number" step="0.01" min="0" defaultValue="0" className={field} /></label>
          <label className="flex flex-col gap-1.5"><span className={lbl}>Paid from</span><select name="payment_method_id" defaultValue={methods[0]?.id ?? ""} className={`cursor-pointer ${field}`}>{methods.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
          <label className="flex flex-col gap-1.5"><span className={lbl}>Status</span><select name="status" defaultValue="Paid" className={`cursor-pointer ${field}`}><option>Paid</option><option>Unpaid</option></select></label>
        </div>
        <div className="mt-3 flex justify-end"><button className="rounded-lg bg-[#543CDA] px-5 py-2 text-[0.84rem] font-600 text-white hover:bg-[#4330B8]">Record Expense</button></div>
      </form>

      {!vendor && vendors.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {vendors.map((v) => <Link key={v.vendor} href={`/finance/payables?vendor=${encodeURIComponent(v.vendor)}`} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[0.78rem] font-600 text-slate-600 hover:border-[#543CDA] hover:text-[#543CDA]">{v.vendor} · {naira(v.total)}</Link>)}
        </div>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-subtle">
        {rows.length === 0 ? (
          <p className="px-5 py-14 text-center text-[0.86rem] text-slate-500">No expenses recorded{vendor ? " for this vendor" : ""} yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead><tr className="border-b border-slate-200 bg-slate-50 text-[0.7rem] uppercase tracking-wide text-slate-500"><th className="px-5 py-3 font-600">Date</th><th className="px-5 py-3 font-600">Description</th><th className="px-5 py-3 font-600">Vendor</th><th className="px-5 py-3 font-600">Category</th><th className="px-5 py-3 text-right font-600">Amount</th><th className="px-5 py-3 font-600">Status</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60">
                    <td className="px-5 py-3 text-[0.8rem] text-slate-600">{new Date(r.expense_date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</td>
                    <td className="px-5 py-3"><Link href={`/finance/payables/${r.id}`} className="text-[0.84rem] font-600 text-slate-900 hover:text-[#543CDA]">{r.description}</Link>{r.source === "Payroll" ? <span className="ml-1.5 rounded bg-[#EEEBFC] px-1.5 py-0.5 text-[0.66rem] font-600 text-[#543CDA]">Payroll</span> : null}</td>
                    <td className="px-5 py-3 text-[0.82rem] text-slate-600">{r.vendor ?? "—"}</td>
                    <td className="px-5 py-3 text-[0.82rem] text-slate-500">{r.category ?? "—"}</td>
                    <td className="px-5 py-3 text-right font-mono text-[0.82rem] font-600 text-slate-900">{naira(r.amount)}</td>
                    <td className="px-5 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-600 ${r.status === "Paid" ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#FEF3C7] text-[#B45309]"}`}>{r.status}</span></td>
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
