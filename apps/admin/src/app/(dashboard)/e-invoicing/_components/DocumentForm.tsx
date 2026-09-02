"use client";
/**
 * Create form for an invoice, credit note, or debit note. Only the line editor and the live total
 * preview are client-side; it submits as a native POST to /api/einvoice, where the server recomputes
 * every figure. Credit and debit notes additionally pick the original document they adjust and carry
 * a reason.
 *
 * Two decisions are made here and both default the safe way round.
 *
 * **File with the NRS** is off by default, so an invoice is an ordinary PDF invoice unless somebody
 * says otherwise. Filing is a deliberate act; a form that filed by default would file by accident.
 *
 * **Charge VAT** is on by default, because most supplies attract it and quietly not charging tax is
 * the more expensive mistake of the two.
 *
 * The percentage amount shown while typing is a preview. The server recomputes it from the project's
 * contract value and refuses to over-bill, so what is stored never depends on this arithmetic.
 */
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { invoiceTotals, naira } from "../../../../lib/finance.js";
import { DOC_META, type DocType } from "../../../../lib/einvoice.js";

interface Original { id: string; label: string }
export interface FormMilestone { id: string; label: string; amount: string; project_id: string }
export interface FormProject {
  id: string;
  code: string;
  name: string;
  client_name: string;
  contract_value: string;
  billed_percent: string;
}
interface Line { description: string; quantity: string; unit_price: string; vat: boolean }
const BLANK: Line = { description: "", quantity: "1", unit_price: "", vat: true };
const field = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-[0.86rem] text-slate-900 focus:border-[#543CDA] focus:outline-none focus:ring-2 focus:ring-[#543CDA]/15";
const lbl = "text-[0.78rem] font-600 text-slate-700";

interface Inst { label: string; percent: string }
const BILLING_OPTIONS = [["OneOff", "One-Off"], ["Milestone", "Milestone-Based"], ["Percentage", "Percentage-Based"], ["Retainer", "Monthly Retainer"], ["CustomSchedule", "Custom Payment Schedule"]] as const;

/** Two decimal places, half-up, without going through a float for the rounding step. */
function money(value: number): string {
  return (Math.round((value + Number.EPSILON) * 100) / 100).toFixed(2);
}

export function DocumentForm({
  docType,
  vatRate,
  whtRate,
  originals,
  projects = [],
  milestones = [],
  initialProjectId = "",
}: {
  docType: DocType;
  vatRate: number;
  whtRate: number;
  originals: Original[];
  projects?: FormProject[];
  milestones?: FormMilestone[];
  initialProjectId?: string;
}): React.ReactNode {
  const [lines, setLines] = useState<Line[]>([{ ...BLANK }]);
  const [billingType, setBillingType] = useState(initialProjectId ? "Percentage" : "OneOff");
  const [installments, setInstallments] = useState<Inst[]>([{ label: "", percent: "" }]);
  const [projectId, setProjectId] = useState(initialProjectId);
  const [percent, setPercent] = useState("");
  const [chargeVat, setChargeVat] = useState(true);
  const [fiscal, setFiscal] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const due = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
  const isNote = docType !== "Invoice";
  const meta = DOC_META[docType];

  const project = projects.find((p) => p.id === projectId) ?? null;
  const percentageMode = billingType === "Percentage" && project !== null;

  // What the chosen percentage comes to, and whether there is that much of the project left.
  const contract = Number(project?.contract_value ?? 0);
  const alreadyBilled = Number(project?.billed_percent ?? 0);
  const pct = Number(percent);
  const pctValid = Number.isFinite(pct) && pct > 0;
  const overBilled = pctValid && alreadyBilled + pct > 100;
  const percentAmount = pctValid && contract > 0 ? money((contract * pct) / 100) : "0.00";

  const effectiveLines = percentageMode
    ? [{
        description: `${pct || 0}% of ${project.name}`,
        quantity: 1,
        unit_price: Number(percentAmount),
        vat_applicable: chargeVat,
      }]
    : lines.map((l) => ({
        description: l.description || "x",
        quantity: Number(l.quantity) || 0,
        unit_price: Number(l.unit_price) || 0,
        vat_applicable: chargeVat && l.vat,
      }));

  const t = invoiceTotals(effectiveLines, chargeVat ? vatRate : 0, whtRate);
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

      {!isNote ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.95rem] font-700 text-slate-900">Kind of invoice</h2>
          <div className="mt-3 flex flex-col gap-3">
            <label className="flex cursor-pointer items-start gap-2.5">
              <input type="checkbox" name="fiscal_required" checked={fiscal} onChange={(e) => setFiscal(e.target.checked)} className="mt-0.5 h-4 w-4 cursor-pointer rounded accent-[#543CDA]" />
              <span>
                <span className="block text-[0.85rem] font-600 text-slate-800">File this with the NRS</span>
                <span className="block text-[0.78rem] text-slate-500">
                  Leave this off for an ordinary PDF invoice. It is still issued, sent, paid and reported the same way. You can file it later from the invoice itself, and it takes a number in the fiscal series at that point.
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2.5">
              <input type="checkbox" name="vat_charged" checked={chargeVat} onChange={(e) => setChargeVat(e.target.checked)} className="mt-0.5 h-4 w-4 cursor-pointer rounded accent-[#543CDA]" />
              <span>
                <span className="block text-[0.85rem] font-600 text-slate-800">Charge VAT on this invoice ({vatRate}%)</span>
                <span className="block text-[0.78rem] text-slate-500">
                  Turn this off to invoice without VAT. Whether a given supply may be invoiced without it is a question for your accountant, not something this form decides.
                </span>
              </span>
            </label>
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
        <h2 className="text-[0.95rem] font-700 text-slate-900">Customer</h2>
        {project ? (
          <p className="mt-2 rounded-lg bg-[#F8F7FE] px-3 py-2 text-[0.8rem] text-slate-600">
            Billing <b className="text-slate-800">{project.client_name}</b> for {project.name}. Leave the fields below blank to use the client&apos;s own details.
          </p>
        ) : null}
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5"><span className={lbl}>Customer name</span><input name="customer_name" required={!project} defaultValue={project?.client_name ?? ""} className={field} /></label>
          <label className="flex flex-col gap-1.5"><span className={lbl}>Customer TIN</span><input name="customer_tin" placeholder={fiscal ? "Required by the NRS" : "Optional"} className={field} /></label>
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
            <label className="flex flex-col gap-1.5"><span className={lbl}>Project</span>
              <select name="project_id" value={projectId} onChange={(e) => { setProjectId(e.target.value); setPercent(""); }} className={`cursor-pointer ${field}`}>
                <option value="">No project</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5"><span className={lbl}>Billing type</span>
              <select name="billing_type" value={billingType} onChange={(e) => setBillingType(e.target.value)} className={`cursor-pointer ${field}`}>{BILLING_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            </label>
            {!project ? (
              <label className="flex flex-col gap-1.5 sm:col-span-2"><span className={lbl}>Project name (free text)</span><input name="project_name" className={field} placeholder="Only if the work is not a project on the platform" /></label>
            ) : null}

            {billingType === "Milestone" ? (<>
              <label className="flex flex-col gap-1.5"><span className={lbl}>Milestone</span>
                <select name="milestone_id" defaultValue="" className={`cursor-pointer ${field}`}>
                  <option value="">None</option>
                  {milestones.filter((m) => m.project_id === projectId).map((m) => <option key={m.id} value={m.id}>{m.label} — {naira(Number(m.amount), 2)}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1.5"><span className={lbl}>Milestone name</span><input name="milestone_name" className={field} /></label>
              <label className="flex flex-col gap-1.5"><span className={lbl}>Milestone amount (₦)</span><input name="milestone_amount" inputMode="decimal" className={field} /></label>
            </>) : null}

            {billingType === "Percentage" ? (
              project ? (
                <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="flex flex-col gap-1.5">
                      <span className={lbl}>Contract value</span>
                      <span className="rounded-lg bg-white px-3 py-2 font-mono text-[0.86rem] text-slate-700">{naira(contract, 2)}</span>
                    </div>
                    <label className="flex flex-col gap-1.5">
                      <span className={lbl}>This invoice %</span>
                      <input name="invoice_percentage" value={percent} onChange={(e) => setPercent(e.target.value)} inputMode="decimal" placeholder="40" required className={field} />
                    </label>
                    <div className="flex flex-col gap-1.5">
                      <span className={lbl}>Amount</span>
                      <span className="rounded-lg bg-white px-3 py-2 font-mono text-[0.86rem] font-700 text-slate-900">{naira(Number(percentAmount), 2)}</span>
                    </div>
                  </div>
                  <p className={`mt-2.5 text-[0.78rem] ${overBilled ? "font-600 text-[#B91C1C]" : "text-slate-500"}`}>
                    {overBilled
                      ? `Only ${(100 - alreadyBilled).toFixed(3)}% of this project is left to bill. ${alreadyBilled.toFixed(3)}% has already been invoiced.`
                      : `${alreadyBilled.toFixed(3)}% of this project has been invoiced so far. ${(100 - alreadyBilled - (pctValid ? pct : 0)).toFixed(3)}% would remain after this one.`}
                  </p>
                  <label className="mt-3 flex flex-col gap-1.5">
                    <span className={lbl}>Description on the invoice</span>
                    <input name="line_description" placeholder={`${pct || 0}% of ${project.name}`} className={field} />
                  </label>
                </div>
              ) : (
                <p className="sm:col-span-2 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2.5 text-[0.8rem] text-[#B45309]">
                  Choose a project above to bill a percentage of it. The amount is worked out from the project&apos;s contract value.
                </p>
              )
            ) : null}

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

      {!percentageMode ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <div className="flex items-center justify-between">
            <h2 className="text-[0.95rem] font-700 text-slate-900">Items</h2>
            <span className="text-[0.76rem] text-slate-500">{chargeVat ? `VAT ${vatRate}%` : "No VAT on this invoice"}</span>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-1 items-end gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-[1fr_5rem_7rem_auto_auto]">
                <input name="line_description" value={l.description} onChange={(e) => update(i, { description: e.target.value })} placeholder="Description" className={field} />
                <input name="line_quantity" value={l.quantity} onChange={(e) => update(i, { quantity: e.target.value })} inputMode="decimal" placeholder="Qty" className={field} />
                <input name="line_unit_price" value={l.unit_price} onChange={(e) => update(i, { unit_price: e.target.value })} inputMode="decimal" placeholder="Unit ₦" className={field} />
                <label className="flex items-center gap-1.5 px-1 pb-2.5"><input type="checkbox" name="line_vat" value={i} checked={l.vat} onChange={(e) => update(i, { vat: e.target.checked })} disabled={!chargeVat} className="h-4 w-4 cursor-pointer rounded accent-[#543CDA] disabled:opacity-40" /><span className={`text-[0.76rem] ${chargeVat ? "text-slate-600" : "text-slate-400"}`}>VAT</span></label>
                <button type="button" onClick={() => setLines((p) => (p.length > 1 ? p.filter((_, j) => j !== i) : p))} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-[#B91C1C]" aria-label="Remove line"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setLines((p) => [...p, { ...BLANK }])} className="mt-2 inline-flex items-center gap-1.5 text-[0.82rem] font-600 text-[#543CDA] hover:text-[#4330B8]"><Plus size={15} strokeWidth={2.4} /> Add item</button>

          <div className="mt-4 ml-auto max-w-xs space-y-1.5 border-t border-slate-100 pt-3 text-[0.84rem]">
            <div className="flex justify-between text-slate-600"><span>Subtotal</span><span className="font-mono">{naira(t.subtotal, 2)}</span></div>
            <div className="flex justify-between text-slate-600"><span>VAT ({chargeVat ? vatRate : 0}%)</span><span className="font-mono">{naira(t.vat, 2)}</span></div>
            <div className="flex justify-between font-700 text-slate-900"><span>Total</span><span className="font-mono">{naira(t.total, 2)}</span></div>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.95rem] font-700 text-slate-900">This invoice</h2>
          <div className="mt-3 ml-auto max-w-xs space-y-1.5 text-[0.84rem]">
            <div className="flex justify-between text-slate-600"><span>{pct || 0}% of contract</span><span className="font-mono">{naira(t.subtotal, 2)}</span></div>
            <div className="flex justify-between text-slate-600"><span>VAT ({chargeVat ? vatRate : 0}%)</span><span className="font-mono">{naira(t.vat, 2)}</span></div>
            <div className="flex justify-between border-t border-slate-100 pt-1.5 font-700 text-slate-900"><span>Total</span><span className="font-mono">{naira(t.total, 2)}</span></div>
          </div>
        </section>
      )}

      <div className="flex justify-end gap-2">
        <a href={docType === "Invoice" ? "/finance/invoices" : `/e-invoicing/${meta.path}`} className="rounded-lg border border-slate-200 px-5 py-2.5 text-[0.85rem] font-600 text-slate-600 hover:bg-slate-50">Cancel</a>
        <button type="submit" disabled={overBilled} className="rounded-lg bg-[#543CDA] px-6 py-2.5 text-[0.85rem] font-600 text-white hover:bg-[#4330B8] disabled:cursor-not-allowed disabled:opacity-50">{docType === "Invoice" ? "Raise Invoice" : `Create ${meta.label}`}</button>
      </div>
    </form>
  );
}
