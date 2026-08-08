/**
 * NRS Tax Configuration (PRD 15). The VAT rate, the tax categories the NRS recognises, the exemption
 * rules, and how our invoice lines map to NRS tax codes. VAT reads from the live Finance configuration
 * (7.5% under current law) so there is one source of truth. Shown here, edited in Finance Settings.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { requireFiscal } from "../../../../../lib/fiscal/permissions.js";
import { db } from "../../../../../lib/db.js";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  ["Standard-rated", "VAT charged at the standard rate.", "default"],
  ["Zero-rated", "Taxable at 0% (e.g. exports).", "0%"],
  ["Exempt", "Outside VAT; no VAT charged or reclaimed.", "none"],
] as const;

export default async function TaxConfigPage(): Promise<ReactNode> {
  await requireFiscal("TAX_FISCAL_CONFIG_MANAGE");
  const c = (await db().query<{ vat_rate: string; wht_rate: string }>("SELECT vat_rate::text, wht_rate::text FROM finance_settings WHERE id=true")).rows[0]!;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-[1.4rem] font-700 text-slate-900">Tax Configuration</h1>
      <p className="mt-1 text-[0.88rem] text-slate-500">VAT, categories, and exemptions for NRS reporting. Edited in <Link href="/finance/settings" className="font-600 text-[#543CDA]">Finance Settings</Link>.</p>

      <section className="mt-5 grid grid-cols-2 gap-3 sm:max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle"><p className="text-[0.76rem] text-slate-500">VAT rate</p><p className="mt-1 text-[1.3rem] font-700 text-slate-900">{c.vat_rate}%</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle"><p className="text-[0.76rem] text-slate-500">Withholding tax</p><p className="mt-1 text-[1.3rem] font-700 text-slate-900">{c.wht_rate}%</p></div>
      </section>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
        <h2 className="text-[0.95rem] font-700 text-slate-900">Tax categories</h2>
        <div className="mt-3 flex flex-col divide-y divide-slate-100">
          {CATEGORIES.map(([name, desc, rate]) => (
            <div key={name} className="flex items-center justify-between gap-3 py-2.5"><div><p className="text-[0.85rem] font-600 text-slate-900">{name}</p><p className="text-[0.78rem] text-slate-500">{desc}</p></div><span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[0.74rem] font-600 text-slate-600">{rate}</span></div>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
        <h2 className="text-[0.95rem] font-700 text-slate-900">Exemption rules &amp; tax mapping</h2>
        <p className="mt-1 text-[0.82rem] text-slate-500">Each invoice line already carries a VAT-applicable flag (Finance, §6.4). Standard-rated lines map to the NRS standard VAT code; lines with VAT switched off map to Exempt. The full NRS tax-code picker is wired in when the live submission is built.</p>
      </section>
    </div>
  );
}
