/**
 * NRS compliance list. The NRS module never creates invoices - it lists the commercial invoices
 * (raised in Finance) at each stage of the NRS lifecycle and lets an authorised user act:
 *  - ready:     finalized invoices not yet submitted -> Submit (+ Submit all)
 *  - submitted: awaiting the SI/APP acknowledgement
 *  - accepted:  the official tax invoices
 *  - rejected:  the retry queue -> Retry
 * Read-only otherwise. Each row opens the shared invoice detail. Server component.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { Send, RefreshCw } from "lucide-react";
import { db } from "../../../../lib/db.js";
import { docNumber, naira, paymentStatus, PAYMENT_STYLE } from "../../../../lib/einvoice.js";

type Bucket = "ready" | "submitted" | "accepted" | "rejected";
const BUCKET_WHERE: Record<Bucket, string> = {
  ready: "nrs_status='NotSubmitted' AND lifecycle_status NOT IN ('Draft','Closed')",
  submitted: "nrs_status='Submitting'",
  accepted: "nrs_status='Accepted'",
  rejected: "nrs_status='Rejected'",
};
const META: Record<Bucket, { title: string; blurb: string }> = {
  ready: { title: "Ready for Submission", blurb: "Finalized commercial invoices from Finance, not yet sent to the NRS." },
  submitted: { title: "Submitted", blurb: "Awaiting acknowledgement from the accredited SI/APP." },
  accepted: { title: "Accepted", blurb: "Official tax invoices acknowledged by the NRS." },
  rejected: { title: "Rejected", blurb: "Documents the NRS rejected. Fix the data in Finance, then retry." },
};

interface Row { id: string; seq: string; customer_name: string; issue_date: string; due_date: string | null; total: string; amount_paid: string; irn: string | null; attempts: number }

export async function ComplianceList({ bucket }: { bucket: Bucket }): Promise<ReactNode> {
  const { rows } = await db().query<Row>(
    `SELECT id, seq::text, customer_name, issue_date::text, due_date::text, total::text, amount_paid::text, irn, attempts
       FROM einvoice WHERE doc_type='Invoice' AND ${BUCKET_WHERE[bucket]} ORDER BY created_at DESC LIMIT 200`);
  const m = META[bucket];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900">{m.title}</h1>
          <p className="mt-1 text-[0.88rem] text-slate-500">{m.blurb}</p>
        </div>
        {bucket === "ready" && rows.length > 0 ? (
          <form action="/api/einvoice/submit/bulk" method="post"><input type="hidden" name="mode" value="ready" /><button className="inline-flex items-center gap-1.5 rounded-lg bg-[#543CDA] px-4 py-2 text-[0.83rem] font-600 text-white hover:bg-[#4330B8]"><Send size={15} /> Submit All</button></form>
        ) : null}
        {bucket === "rejected" && rows.length > 0 ? (
          <form action="/api/einvoice/submit/bulk" method="post"><input type="hidden" name="mode" value="rejected" /><button className="inline-flex items-center gap-1.5 rounded-lg bg-[#B45309] px-4 py-2 text-[0.83rem] font-600 text-white hover:bg-[#92400e]"><RefreshCw size={15} /> Retry All</button></form>
        ) : null}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-subtle">
        {rows.length === 0 ? (
          <p className="px-5 py-14 text-center text-[0.86rem] text-slate-500">Nothing here. {bucket === "ready" ? "Finalize an invoice in Finance to make it eligible." : ""}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead><tr className="border-b border-slate-200 bg-slate-50 text-[0.7rem] uppercase tracking-wide text-slate-500"><th className="px-5 py-3 font-600">Invoice</th><th className="px-5 py-3 font-600">Customer</th><th className="px-5 py-3 text-right font-600">Total</th>{bucket === "accepted" ? <th className="px-5 py-3 font-600">IRN</th> : null}{bucket === "accepted" ? <th className="px-5 py-3 font-600">Payment</th> : null}<th className="px-5 py-3 font-600" aria-label="Action" /></tr></thead>
              <tbody>
                {rows.map((r) => {
                  const pay = paymentStatus(Number(r.total), Number(r.amount_paid), r.due_date);
                  return (
                    <tr key={r.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60">
                      <td className="px-5 py-3"><Link href={`/e-invoicing/doc/${r.id}`} className="font-mono text-[0.82rem] font-600 text-[#543CDA] hover:text-[#4330B8]">{docNumber("Invoice", r.seq)}</Link></td>
                      <td className="px-5 py-3 text-[0.85rem] font-600 text-slate-900">{r.customer_name}<span className="ml-1.5 text-[0.72rem] font-400 text-slate-500">{new Date(r.issue_date).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}</span></td>
                      <td className="px-5 py-3 text-right font-mono text-[0.82rem] text-slate-700">{naira(r.total, 0)}</td>
                      {bucket === "accepted" ? <td className="px-5 py-3 font-mono text-[0.76rem] text-slate-500">{r.irn ?? "—"}</td> : null}
                      {bucket === "accepted" ? <td className="px-5 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-600 ${PAYMENT_STYLE[pay]}`}>{pay}</span></td> : null}
                      <td className="px-5 py-3 text-right">
                        {bucket === "ready" ? <form action="/api/einvoice/submit" method="post"><input type="hidden" name="id" value={r.id} /><input type="hidden" name="action" value="submit" /><button className="inline-flex items-center gap-1 rounded-lg bg-[#543CDA] px-3 py-1.5 text-[0.76rem] font-600 text-white hover:bg-[#4330B8]"><Send size={13} /> Submit</button></form>
                          : bucket === "rejected" ? <form action="/api/einvoice/submit" method="post"><input type="hidden" name="id" value={r.id} /><input type="hidden" name="action" value="retry" /><button className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-[0.76rem] font-600 text-[#B45309] hover:bg-amber-50"><RefreshCw size={13} /> Retry</button></form>
                          : <Link href={`/e-invoicing/doc/${r.id}`} className="text-[0.78rem] font-600 text-[#543CDA]">View</Link>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
