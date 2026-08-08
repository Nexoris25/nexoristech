"use client";
/**
 * Record Payment control (Payment Tracking). A Finance-only action that reveals a native form posting
 * to /api/einvoice/payment. Recording a payment updates only the receivable - never the NRS status.
 * The outstanding default is pre-filled so the common "paid in full" case is one click.
 */
import { useState } from "react";
import { Plus } from "lucide-react";
import { PAYMENT_METHODS } from "../../../../../lib/einvoice.js";

const field = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-[0.85rem] focus:border-[#543CDA] focus:outline-none";
const lbl = "text-[0.74rem] font-600 text-slate-600";

export function RecordPayment({ id, outstanding }: { id: string; outstanding: number }): React.ReactNode {
  const [open, setOpen] = useState(false);
  if (outstanding <= 0) return null;

  return open ? (
    <form action="/api/einvoice/payment" method="post" className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <input type="hidden" name="id" value={id} />
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1"><span className={lbl}>Amount received (₦)</span><input name="amount" type="number" step="0.01" min="0" defaultValue={outstanding.toFixed(2)} required className={field} /></label>
        <label className="flex flex-col gap-1"><span className={lbl}>Payment date</span><input name="payment_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className={field} /></label>
        <label className="flex flex-col gap-1"><span className={lbl}>Method</span><select name="method" defaultValue="Bank Transfer" className={`cursor-pointer ${field}`}>{PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}</select></label>
        <label className="flex flex-col gap-1"><span className={lbl}>Reference (optional)</span><input name="reference" className={field} /></label>
        <label className="col-span-2 flex flex-col gap-1"><span className={lbl}>Notes</span><input name="notes" className={field} /></label>
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-[0.78rem] font-600 text-slate-600 hover:bg-white">Cancel</button>
        <button type="submit" className="rounded-lg bg-[#16A34A] px-4 py-1.5 text-[0.78rem] font-600 text-white hover:bg-[#15803D]">Save Payment</button>
      </div>
    </form>
  ) : (
    <button type="button" onClick={() => setOpen(true)} className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#16A34A] px-4 py-2 text-[0.82rem] font-600 text-white hover:bg-[#15803D]"><Plus size={15} strokeWidth={2.4} /> Record Payment</button>
  );
}
