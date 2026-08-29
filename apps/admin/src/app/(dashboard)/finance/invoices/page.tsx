/**
 * Commercial Invoices (Finance). The single invoice of record: raised here, tracked through its
 * commercial lifecycle and receivables, and submitted to the NRS from the e-Invoicing module. Shows
 * the three independent statuses (lifecycle, NRS, payment) and filters by payment state - Paid,
 * Unpaid, Overdue, Cancelled - so receivables can be worked at a glance.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireCapability } from "../../../../lib/auth.js";
import { db } from "../../../../lib/db.js";
import { LIFECYCLE_LABEL, LIFECYCLE_STYLE, NRS_LABEL, NRS_STYLE, PAYMENT_STYLE, docNumber, naira, paymentStatus } from "../../../../lib/einvoice.js";

export const dynamic = "force-dynamic";

interface Row { id: string; seq: string; customer_name: string; issue_date: string; due_date: string | null; total: string; amount_paid: string; lifecycle_status: string; nrs_status: string }

const PAY_TABS = [["All", ""], ["Paid", "paid"], ["Unpaid", "unpaid"], ["Overdue", "overdue"], ["Cancelled", "cancelled"]] as const;
const PAY_SQL: Record<string, string> = {
  paid: "amount_paid >= total AND total > 0",
  unpaid: "amount_paid <= 0 AND lifecycle_status <> 'Closed' AND (due_date IS NULL OR due_date >= current_date)",
  overdue: "amount_paid < total AND due_date IS NOT NULL AND due_date < current_date AND lifecycle_status <> 'Closed'",
  cancelled: "lifecycle_status = 'Closed'",
};

export default async function FinanceInvoicesPage({ searchParams }: { searchParams: Promise<{ pay?: string }> }): Promise<ReactNode> {
  await requireCapability("finance.read");
  const { pay } = await searchParams;
  const payFilter = pay && PAY_SQL[pay] ? pay : "";

  const { rows } = await db().query<Row>(
    `SELECT id, seq::text, customer_name, issue_date::text, due_date::text, total::text, amount_paid::text, lifecycle_status, nrs_status
       FROM einvoice WHERE doc_type='Invoice'${payFilter ? ` AND ${PAY_SQL[payFilter]}` : ""} ORDER BY created_at DESC LIMIT 200`);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900">Invoices</h1>
          <p className="mt-1 text-[0.88rem] text-slate-500">The commercial invoice of record. Raise here; submit to the NRS from e-Invoicing.</p>
        </div>
        <Link href="/finance/invoices/new" className="inline-flex items-center gap-1.5 rounded-lg bg-[#543CDA] px-4 py-2 text-[0.83rem] font-600 text-white hover:bg-[#4330B8]"><Plus size={15} strokeWidth={2.4} /> Raise Invoice</Link>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5"><span className="mr-1 text-[0.68rem] font-600 uppercase tracking-wide text-slate-500">Payment</span>
        {PAY_TABS.map(([label, val]) => {
          const active = (val === "" && !payFilter) || val === payFilter;
          return <Link key={label} href={val ? `/finance/invoices?pay=${val}` : "/finance/invoices"} className={`rounded-full px-3 py-1.5 text-[0.78rem] font-600 ${active ? "bg-[#0F766E] text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>{label}</Link>;
        })}
      </div>

      <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-subtle">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-14 text-center"><p className="text-[0.92rem] font-600 text-slate-700">No invoices{payFilter ? " match this filter" : " yet"}</p>{!payFilter ? <Link href="/finance/invoices/new" className="text-[0.85rem] font-600 text-[#543CDA]">Raise your first invoice</Link> : null}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead><tr className="border-b border-slate-200 bg-slate-50 text-[0.7rem] uppercase tracking-wide text-slate-500"><th className="px-5 py-3 font-600">Invoice</th><th className="px-5 py-3 font-600">Customer</th><th className="px-5 py-3 text-right font-600">Total</th><th className="px-5 py-3 text-right font-600">Outstanding</th><th className="px-5 py-3 font-600">Lifecycle</th><th className="px-5 py-3 font-600">NRS</th><th className="px-5 py-3 font-600">Payment</th></tr></thead>
              <tbody>
                {rows.map((r) => {
                  const cancelled = r.lifecycle_status === "Closed";
                  const pst = cancelled ? "Cancelled" : paymentStatus(Number(r.total), Number(r.amount_paid), r.due_date);
                  const outstanding = Math.max(0, Number(r.total) - Number(r.amount_paid));
                  return (
                    <tr key={r.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60">
                      <td className="px-5 py-3"><Link href={`/e-invoicing/doc/${r.id}`} className="font-mono text-[0.82rem] font-600 text-[#543CDA] hover:text-[#4330B8]">{docNumber("Invoice", r.seq)}</Link></td>
                      <td className="px-5 py-3 text-[0.85rem] font-600 text-slate-900">{r.customer_name}<span className="ml-1.5 text-[0.72rem] font-400 text-slate-500">{new Date(r.issue_date).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}</span></td>
                      <td className="px-5 py-3 text-right font-mono text-[0.82rem] text-slate-700">{naira(r.total, 0)}</td>
                      <td className="px-5 py-3 text-right font-mono text-[0.82rem] font-600 text-slate-900">{outstanding > 0 && !cancelled ? naira(outstanding, 0) : "—"}</td>
                      <td className="px-5 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-600 ${LIFECYCLE_STYLE[r.lifecycle_status]}`}>{LIFECYCLE_LABEL[r.lifecycle_status]}</span></td>
                      <td className="px-5 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-600 ${NRS_STYLE[r.nrs_status]}`}>{NRS_LABEL[r.nrs_status]}</span></td>
                      <td className="px-5 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-600 ${cancelled ? "bg-slate-100 text-slate-600" : PAYMENT_STYLE[pst]}`}>{pst}</span></td>
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
