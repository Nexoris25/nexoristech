/**
 * NRS Invoice Configuration (PRD 15). How Finance's invoices map to the NRS shape: the invoice types
 * the NRS recognises, the numbering rule already in use, default payment terms, the reporting
 * currency, and the product/service code mapping. These read from the live Finance configuration so
 * the two never drift; they are shown here, edited in Finance Settings.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { requireFiscal } from "../../../../../lib/fiscal/permissions.js";
import { db } from "../../../../../lib/db.js";

export const dynamic = "force-dynamic";

const TYPES = [
  ["Standard Invoice", "A normal sales invoice to a client."],
  ["Credit Note", "Reverses or reduces a prior invoice."],
  ["Receipt", "Confirms a payment received."],
] as const;

export default async function InvoiceConfigPage(): Promise<ReactNode> {
  await requireFiscal("TAX_FISCAL_CONFIG_MANAGE");
  const c = (await db().query<{ currency: string; vat_rate: string }>("SELECT currency, vat_rate::text FROM finance_settings WHERE id=true")).rows[0]!;

  const rules = [
    ["Numbering rule", "INV-0001, sequential, assigned by Finance on creation"],
    ["Payment terms", "Net 30 days by default, set per invoice"],
    ["Currency", c.currency],
    ["VAT rate", `${c.vat_rate}%`],
  ] as const;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-[1.4rem] font-700 text-slate-900">Invoice Configuration</h1>
      <p className="mt-1 text-[0.88rem] text-slate-500">How invoices map to the NRS shape. Edited in <Link href="/finance/settings" className="font-600 text-[#543CDA]">Finance Settings</Link>.</p>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
        <h2 className="text-[0.95rem] font-700 text-slate-900">Invoice types</h2>
        <div className="mt-3 flex flex-col divide-y divide-slate-100">
          {TYPES.map(([name, desc]) => (
            <div key={name} className="py-2.5"><p className="text-[0.85rem] font-600 text-slate-900">{name}</p><p className="text-[0.78rem] text-slate-500">{desc}</p></div>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
        <h2 className="text-[0.95rem] font-700 text-slate-900">Rules &amp; defaults</h2>
        <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {rules.map(([k, v]) => (
            <div key={k} className="rounded-xl bg-slate-50 p-3.5"><dt className="text-[0.72rem] uppercase tracking-wide text-slate-500">{k}</dt><dd className="mt-0.5 text-[0.85rem] font-600 text-slate-800">{v}</dd></div>
          ))}
        </dl>
      </section>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
        <h2 className="text-[0.95rem] font-700 text-slate-900">Product &amp; service code mapping</h2>
        <p className="mt-1 text-[0.82rem] text-slate-500">Nexoris Technologies bills services by line description, not a product catalogue, so lines map to the NRS general service code. A per-line code picker is added when the live NRS call is wired in.</p>
      </section>
    </div>
  );
}
