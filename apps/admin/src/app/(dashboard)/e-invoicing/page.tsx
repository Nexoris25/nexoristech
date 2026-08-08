/**
 * NRS e-Invoicing operational dashboard (PRD 15). The day-to-day view over the documents issued and
 * submitted: totals by status, acceptance rate, the latest documents, and quick links to issue a new
 * one or open the Submission Centre. Configuration lives under Settings; this is the working surface.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, XCircle, FileText, Send } from "lucide-react";
import { requireFiscal } from "../../../lib/fiscal/permissions.js";
import { db } from "../../../lib/db.js";
import { DOC_META, NRS_LABEL, NRS_STYLE, docNumber, naira, type DocType } from "../../../lib/einvoice.js";

export const dynamic = "force-dynamic";

interface Recent { id: string; doc_type: DocType; seq: string; customer_name: string; total: string; nrs_status: string; created_at: string }

export default async function EInvoicingDashboard(): Promise<ReactNode> {
  await requireFiscal("INVOICE_VIEW");
  const pool = db();
  const [{ rows: agg }, { rows: recent }] = await Promise.all([
    pool.query<{ total: string; accepted: string; pending: string; rejected: string; today: string }>(
      `SELECT count(*)::text total,
              count(*) FILTER (WHERE nrs_status='Accepted')::text accepted,
              count(*) FILTER (WHERE nrs_status IN ('NotSubmitted','Submitting'))::text pending,
              count(*) FILTER (WHERE nrs_status='Rejected')::text rejected,
              count(*) FILTER (WHERE created_at::date=current_date)::text today FROM einvoice`),
    pool.query<Recent>(
      "SELECT id, doc_type, seq::text, customer_name, total::text, nrs_status, created_at::text FROM einvoice ORDER BY created_at DESC LIMIT 8"),
  ]);
  const a = agg[0]!;
  const total = Number(a.total), accepted = Number(a.accepted);
  const rate = total > 0 ? Math.round((accepted / total) * 100) : 0;

  const kpis = [
    { label: "Total Documents", value: a.total, icon: FileText, tint: "text-[#543CDA]" },
    { label: "Accepted", value: a.accepted, icon: CheckCircle2, tint: "text-[#15803D]" },
    { label: "Pending", value: a.pending, icon: Clock, tint: "text-[#B45309]" },
    { label: "Rejected", value: a.rejected, icon: XCircle, tint: "text-[#B91C1C]" },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900">NRS e-Invoicing</h1>
          <p className="mt-1 text-[0.88rem] text-slate-500">Submit the commercial invoices raised in Finance to the Nigeria Revenue Service, and track compliance.</p>
        </div>
        <Link href="/e-invoicing/ready" className="inline-flex items-center gap-1.5 rounded-lg bg-[#543CDA] px-4 py-2 text-[0.83rem] font-600 text-white hover:bg-[#4330B8]"><Send size={15} strokeWidth={2} /> Ready for Submission</Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
            <div className="flex items-center justify-between"><span className="text-[0.78rem] font-600 text-slate-500">{k.label}</span><k.icon size={17} className={k.tint} /></div>
            <p className={`mt-2 text-[1.5rem] font-700 ${k.tint}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.95rem] font-700 text-slate-900">Acceptance rate</h2>
          <p className="mt-2 text-[2rem] font-700 text-[#15803D]">{rate}%</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#16A34A]" style={{ width: `${rate}%` }} /></div>
          <p className="mt-2 text-[0.78rem] text-slate-500">{a.accepted} of {a.total} documents accepted · {a.today} today</p>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle lg:col-span-2">
          <div className="flex items-center justify-between"><h2 className="text-[0.95rem] font-700 text-slate-900">Recent documents</h2><Link href="/e-invoicing/accepted" className="text-[0.8rem] font-600 text-[#543CDA] hover:text-[#4330B8]">Accepted</Link></div>
          {recent.length === 0 ? <p className="mt-3 text-[0.85rem] text-slate-500">No documents issued yet.</p> : (
            <ul className="mt-3 flex flex-col divide-y divide-slate-100">
              {recent.map((r) => (
                <li key={r.id} className="flex items-center gap-3 py-2.5">
                  <Link href={`/e-invoicing/doc/${r.id}`} className="font-mono text-[0.8rem] font-600 text-[#543CDA] hover:text-[#4330B8]">{docNumber(r.doc_type, r.seq)}</Link>
                  <span className="min-w-0 flex-1 truncate text-[0.83rem] text-slate-700">{r.customer_name} <span className="text-slate-500">· {DOC_META[r.doc_type].label}</span></span>
                  <span className="shrink-0 font-mono text-[0.8rem] text-slate-700">{naira(r.total, 0)}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.68rem] font-600 ${NRS_STYLE[r.nrs_status]}`}>{NRS_LABEL[r.nrs_status]}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
