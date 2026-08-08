/**
 * Finance Settings (PRD 6.2, 6.7, 6.10). The financial year start, the reporting currency, the VAT
 * and withholding-tax rates, the income/expense categories (the chart of accounts kept simple), and
 * the payment methods / bank accounts money moves through. Account number only, never a BVN.
 */
import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { requireAdmin } from "../../../../lib/auth.js";
import { db } from "../../../../lib/db.js";

export const dynamic = "force-dynamic";

interface Settings { financial_year_start_month: number; currency: string; vat_rate: string; wht_rate: string }
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const field = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-[0.85rem] focus:border-[#543CDA] focus:outline-none";
const lbl = "text-[0.76rem] font-600 text-slate-700";

export default async function FinanceSettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }): Promise<ReactNode> {
  await requireAdmin();
  const { saved } = await searchParams;
  const pool = db();
  const [{ rows: s }, { rows: cats }, { rows: methods }] = await Promise.all([
    pool.query<Settings>("SELECT financial_year_start_month, currency, vat_rate::text, wht_rate::text FROM finance_settings WHERE id=true"),
    pool.query<{ id: string; kind: string; name: string }>("SELECT id, kind, name FROM finance_category WHERE active ORDER BY kind, sort, name"),
    pool.query<{ id: string; name: string; kind: string; bank_name: string | null }>("SELECT id, name, kind, bank_name FROM payment_method WHERE active ORDER BY created_at"),
  ]);
  const set = s[0]!;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-[1.4rem] font-700 text-slate-900">Finance Settings</h1>
      <p className="mt-1 text-[0.88rem] text-slate-500">Financial year, currency, tax rates, categories, and payment methods.</p>
      {saved ? <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-[0.84rem] text-green-700"><CheckCircle2 size={16} /> Saved.</div> : null}

      <form action="/api/finance/settings" method="post" className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
        <input type="hidden" name="action" value="general" />
        <h2 className="text-[0.95rem] font-700 text-slate-900">General</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5"><span className={lbl}>Financial year starts</span><select name="financial_year_start_month" defaultValue={String(set.financial_year_start_month)} className={`cursor-pointer ${field}`}>{MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select></label>
          <label className="flex flex-col gap-1.5"><span className={lbl}>Currency</span><input name="currency" defaultValue={set.currency} className={field} /></label>
          <label className="flex flex-col gap-1.5"><span className={lbl}>VAT rate (%)</span><input name="vat_rate" type="number" step="0.1" min="0" defaultValue={set.vat_rate} className={field} /></label>
          <label className="flex flex-col gap-1.5"><span className={lbl}>Withholding tax (%)</span><input name="wht_rate" type="number" step="0.1" min="0" defaultValue={set.wht_rate} className={field} /></label>
        </div>
        <div className="mt-3 flex justify-end"><button className="rounded-lg bg-[#543CDA] px-5 py-2 text-[0.84rem] font-600 text-white hover:bg-[#4330B8]">Save</button></div>
      </form>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
        <h2 className="text-[0.95rem] font-700 text-slate-900">Categories</h2>
        <p className="text-[0.76rem] text-slate-500">The chart of accounts, kept simple and expandable.</p>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(["Income", "Expense"] as const).map((kind) => (
            <div key={kind}>
              <p className="text-[0.78rem] font-600 text-slate-600">{kind}</p>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">{cats.filter((c) => c.kind === kind).map((c) => <li key={c.id} className="rounded-full bg-slate-100 px-2.5 py-1 text-[0.76rem] text-slate-600">{c.name}</li>)}</ul>
            </div>
          ))}
        </div>
        <form action="/api/finance/settings" method="post" className="mt-4 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-4">
          <input type="hidden" name="action" value="category" />
          <label className="flex flex-col gap-1.5"><span className={lbl}>Kind</span><select name="kind" defaultValue="Expense" className={`cursor-pointer ${field}`}><option>Income</option><option>Expense</option></select></label>
          <label className="flex flex-1 flex-col gap-1.5"><span className={lbl}>New category</span><input name="name" required className={field} /></label>
          <button className="rounded-lg border border-slate-200 px-4 py-2 text-[0.82rem] font-600 text-slate-700 hover:bg-slate-50">Add</button>
        </form>
      </section>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
        <h2 className="text-[0.95rem] font-700 text-slate-900">Payment Methods</h2>
        <p className="text-[0.76rem] text-slate-500">Bank accounts and other ways money moves. Account number only.</p>
        <ul className="mt-3 flex flex-col divide-y divide-slate-100">
          {methods.map((m) => <li key={m.id} className="flex items-center justify-between py-2"><span className="text-[0.84rem] font-600 text-slate-800">{m.name}</span><span className="text-[0.76rem] text-slate-500">{m.kind}{m.bank_name ? ` · ${m.bank_name}` : ""}</span></li>)}
        </ul>
        <form action="/api/finance/settings" method="post" className="mt-4 grid grid-cols-1 gap-2 border-t border-slate-100 pt-4 sm:grid-cols-4">
          <input type="hidden" name="action" value="method" />
          <label className="flex flex-col gap-1.5 sm:col-span-2"><span className={lbl}>Name</span><input name="name" required placeholder="e.g. Payroll Account" className={field} /></label>
          <label className="flex flex-col gap-1.5"><span className={lbl}>Type</span><select name="kind" defaultValue="Bank" className={`cursor-pointer ${field}`}><option>Bank</option><option>Cash</option><option>Mobile</option></select></label>
          <label className="flex flex-col gap-1.5"><span className={lbl}>Account no.</span><input name="account_no" className={field} /></label>
          <label className="flex flex-col gap-1.5 sm:col-span-3"><span className={lbl}>Bank name</span><input name="bank_name" className={field} /></label>
          <div className="flex items-end"><button className="w-full rounded-lg border border-slate-200 px-4 py-2 text-[0.82rem] font-600 text-slate-700 hover:bg-slate-50">Add</button></div>
        </form>
      </section>
    </div>
  );
}
