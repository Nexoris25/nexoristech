"use client";
/**
 * Create form for an NRS document (PRD 15), shared by e-invoices, credit notes, and debit notes. Only
 * the line editor and the live total preview are client-side; it submits as a native POST to
 * /api/einvoice, where the server recomputes every figure. Credit and debit notes additionally pick
 * the original document they adjust and carry a reason.
 */
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { invoiceTotals, naira } from "../../../../lib/finance.js";
import { DOC_META, type DocType } from "../../../../lib/einvoice.js";

interface Original { id: string; label: string }
interface Line { description: string; quantity: string; unit_price: string; vat: boolean }
const BLANK: Line = { description: "", quantity: "1", unit_price: "", vat: true };
const field = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-[0.86rem] text-slate-900 focus:border-[#543CDA] focus:outline-none focus:ring-2 focus:ring-[#543CDA]/15";
const lbl = "text-[0.78rem] font-600 text-slate-700";

interface Inst { label: string; percent: string }
const BILLING_OPTIONS = [["OneOff", "One-Off"], ["Milestone", "Milestone-Based"], ["Percentage", "Percentage-Based"], ["Retainer", "Monthly Retainer"], ["CustomSchedule", "Custom Payment Schedule"]] as const;

export function DocumentForm({ docType, vatRate, whtRate, originals }: { docType: DocType; vatRate: number; whtRate: number; originals: Original[] }): React.ReactNode {
  const [lines, setLines] = useState<Line[]>([{ ...BLANK }]);
  const [billingType, setBillingType] = useState("OneOff");
  const [installments, setInstallments] = useState<Inst[]>([{ label: "", percent: "" }]);
  const today = new Date().toISOString().slice(0, 10);
  const due = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
  const isNote = docType !== "Invoice";
  const meta = DOC_META[docType];

  const t = invoiceTotals(
    lines.map((l) => ({ description: l.description || "x", quantity: Number(l.quantity) || 0, unit_price: Number(l.unit_price) || 0, vat_applicable: l.vat })),
    vatRate, whtRate);
  const update = (i: number, patch: Partial<Line>): void => setLines((p) => p.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  return (
    <form action="/api/einvoice" method="post" className="mt-5 flex flex-col gap-4">
      <input type="hidden" name="doc_type" value={docType} />

      {isNote ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.95rem] font-700 text-slate-900">Adjusts</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5"><span className={lbl}>Original invoice</span>
              <select name="related_id" defaultValue="" className={`cursor-pointer ${field}`}><option value="">None</option>{originals.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</select>
            </label>
            <label className="flex flex-col gap-1.5"><span className={lbl}>Reason</span><input name="reason" required placeholder={`Why this ${meta.label.toLowerCase()} is raised`} className={field} /></label>
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
        <h2 className="text-[0.95rem] font-700 text-slate-900">Customer</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5"><span className={lbl}>Customer name</span><input name="customer_name" required className={field} /></label>
          <label className="flex flex-col gap-1.5"><span className={lbl}>Customer TIN</span><input name="customer_tin" placeholder="Required by the NRS" className={field} /></label>
          <label className="flex flex-col gap-1.5"><span className={lbl}>Email</span><input name="customer_email" type="email" className={field} /></label>
          <label className="flex flex-col gap-1.5"><span className={lbl}>Address</span><input name="customer_address" className={field} /></label>
          <label className="flex flex-col gap-1.5"><span className={lbl}>Issue date</span><input name="issue_date" type="date" defaultValue={today} className={field} /></label>
          <label className="flex flex-col gap-1.5"><span className={lbl}>Due date</span><input name="due_date" type="date" defaultValue={due} className={field} /></label>
          <label className="flex flex-col gap-1.5"><span className={lbl}>Payment terms</span><input name="payment_terms" placeholder="e.g. Net 30" className={field} /></label>
          <label className="flex flex-col gap-1.5"><span className={lbl}>Payment method</span><input name="payment_method" placeholder="e.g. Bank transfer" className={field} /></label>
        </div>
      </section>

      {!isNote ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.95rem] font-700 text-slate-900">Billing</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5"><span className={lbl}>Billing type</span>
              <select name="billing_type" value={billingType} onChange={(e) => setBillingType(e.target.value)} className={`cursor-pointer ${field}`}>{BILLING_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            </label>
            <label className="flex flex-col gap-1.5"><span className={lbl}>Project (optional)</span><input name="project_name" className={field} /></label>
            {billingType === "Milestone" ? (<>
              <label className="flex flex-col gap-1.5"><span className={lbl}>Milestone name</span><input name="milestone_name" className={field} /></label>
              <label className="flex flex-col gap-1.5"><span className={lbl}>Milestone amount (₦)</span><input name="milestone_amount" type="number" min="0" className={field} /></label>
              <label className="flex flex-col gap-1.5"><span className={lbl}>Project value (₦)</span><input name="project_value" type="number" min="0" className={field} /></label>
            </>) : null}
            {billingType === "Percentage" ? (<>
              <label className="flex flex-col gap-1.5"><span className={lbl}>Project value (₦)</span><input name="project_value" type="number" min="0" className={field} /></label>
              <label className="flex flex-col gap-1.5"><span className={lbl}>This invoice %</span><input name="invoice_percentage" type="number" min="0" max="100" step="0.1" className={field} /></label>
              <label className="flex flex-col gap-1.5"><span className={lbl}>Previously billed %</span><input name="percentage_previously_billed" type="number" min="0" max="100" step="0.1" defaultValue="0" className={field} /></label>
            </>) : null}
            {billingType === "Retainer" ? (<>
              <label className="flex flex-col gap-1.5"><span className={lbl}>Billing period</span><input name="billing_period" placeholder="e.g. July 2026" className={field} /></label>
              <label className="flex flex-col gap-1.5"><span className={lbl}>Next billing date</span><input name="next_billing_date" type="date" className={field} /></label>
              <label className="flex flex-col gap-1.5 sm:col-span-2"><span className={lbl}>Contract reference</span><input name="contract_reference" className={field} /></label>
            </>) : null}
          </div>
          {billingType === "CustomSchedule" ? (
            <div className="mt-3">
              <p className={lbl}>Payment schedule</p>
              <div className="mt-2 flex flex-col gap-2">
                {installments.map((it, i) => (
                  <div key={i} className="grid grid-cols-[1fr_6rem_auto] items-center gap-2">
                    <input name="inst_label" value={it.label} onChange={(e) => setInstallments((p) => p.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} placeholder="e.g. 30% Advance" className={field} />
                    <input name="inst_percent" value={it.percent} onChange={(e) => setInstallments((p) => p.map((x, j) => j === i ? { ...x, percent: e.target.value } : x))} inputMode="decimal" placeholder="%" className={field} />
                    <button type="button" onClick={() => setInstallments((p) => p.length > 1 ? p.filter((_, j) => j !== i) : p)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-[#B91C1C]" aria-label="Remove instalment"><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setInstallments((p) => [...p, { label: "", percent: "" }])} className="mt-2 inline-flex items-center gap-1.5 text-[0.8rem] font-600 text-[#543CDA] hover:text-[#4330B8]"><Plus size={14} strokeWidth={2.4} /> Add instalment</button>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
        <div className="flex items-center justify-between"><h2 className="text-[0.95rem] font-700 text-slate-900">Items</h2><span className="text-[0.76rem] text-slate-500">VAT {vatRate}%</span></div>
        <div className="mt-3 flex flex-col gap-2">
          {lines.map((l, i) => (
            <div key={i} className="grid grid-cols-1 items-end gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-[1fr_5rem_7rem_auto_auto]">
              <input name="line_description" value={l.description} onChange={(e) => update(i, { description: e.target.value })} placeholder="Description" className={field} />
              <input name="line_quantity" value={l.quantity} onChange={(e) => update(i, { quantity: e.target.value })} inputMode="decimal" placeholder="Qty" className={field} />
              <input name="line_unit_price" value={l.unit_price} onChange={(e) => update(i, { unit_price: e.target.value })} inputMode="decimal" placeholder="Unit ₦" className={field} />
              <label className="flex items-center gap-1.5 px-1 pb-2.5"><input type="checkbox" name="line_vat" value={i} checked={l.vat} onChange={(e) => update(i, { vat: e.target.checked })} className="h-4 w-4 cursor-pointer rounded accent-[#543CDA]" /><span className="text-[0.76rem] text-slate-600">VAT</span></label>
              <button type="button" onClick={() => setLines((p) => (p.length > 1 ? p.filter((_, j) => j !== i) : p))} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-[#B91C1C]" aria-label="Remove line"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setLines((p) => [...p, { ...BLANK }])} className="mt-2 inline-flex items-center gap-1.5 text-[0.82rem] font-600 text-[#543CDA] hover:text-[#4330B8]"><Plus size={15} strokeWidth={2.4} /> Add item</button>

        <div className="mt-4 ml-auto max-w-xs space-y-1.5 border-t border-slate-100 pt-3 text-[0.84rem]">
          <div className="flex justify-between text-slate-600"><span>Subtotal</span><span className="font-mono">{naira(t.subtotal, 2)}</span></div>
          <div className="flex justify-between text-slate-600"><span>VAT ({vatRate}%)</span><span className="font-mono">{naira(t.vat, 2)}</span></div>
          <div className="flex justify-between font-700 text-slate-900"><span>Total</span><span className="font-mono">{naira(t.total, 2)}</span></div>
        </div>
      </section>

      <div className="flex justify-end gap-2"><a href={docType === "Invoice" ? "/finance/invoices" : `/e-invoicing/${meta.path}`} className="rounded-lg border border-slate-200 px-5 py-2.5 text-[0.85rem] font-600 text-slate-600 hover:bg-slate-50">Cancel</a><button type="submit" className="rounded-lg bg-[#543CDA] px-6 py-2.5 text-[0.85rem] font-600 text-white hover:bg-[#4330B8]">{docType === "Invoice" ? "Raise Invoice" : `Create ${meta.label}`}</button></div>
    </form>
  );
}
