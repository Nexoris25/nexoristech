/**
 * NRS document detail. Enforces the core principle: three INDEPENDENT statuses shown side by side -
 * Lifecycle (commercial), NRS Compliance (SI/APP only, read-only), and Payment (Finance only). The
 * page is organised into the required sections: Invoice Summary, NRS Compliance, Payment Tracking, and
 * Delivery. Recording a payment never touches NRS; submitting to NRS never touches payment. The QR and
 * IRN come only from what an accredited SI/APP actually returned, never from anything derived here.
 * When no provider is configured the panel says so rather than leaving the operator to guess.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Send, RefreshCw, Ban, CheckCircle2, XCircle, Clock, ChevronRight, Download } from "lucide-react";
import { requireFiscal } from "../../../../../lib/fiscal/permissions.js";
import { db } from "../../../../../lib/db.js";
import { fiscalAdapter } from "../../../../../lib/fiscal/provider.js";
import {
  DOC_META, NRS_LABEL, NRS_STYLE, LIFECYCLE_LABEL, LIFECYCLE_STYLE,
  PAYMENT_STYLE, BILLING_LABEL, docNumber, naira, paymentStatus, type DocType,
} from "../../../../../lib/einvoice.js";
import { RecordPayment } from "./RecordPayment.js";
import { requireUuid } from "../../../../../lib/route-params.js";

export const dynamic = "force-dynamic";

interface Doc {
  doc_type: DocType; seq: string; reason: string | null; related_seq: string | null;
  customer_name: string; customer_tin: string | null; customer_email: string | null; customer_address: string | null;
  issue_date: string; due_date: string | null; currency: string; payment_terms: string | null; payment_method: string | null;
  subtotal: string; vat: string; total: string; amount_paid: string;
  lifecycle_status: string; nrs_status: string;
  irn: string | null; qr_data: string | null; submission_ref: string | null; submitted_at: string | null;
  si_app_response: string | null; validation_messages: string[]; attempts: number; environment: string; public_token: string;
  billing_type: string; project_name: string | null; project_value: string | null; milestone_name: string | null; milestone_amount: string | null;
  invoice_percentage: string | null; percentage_previously_billed: string; billing_period: string | null; next_billing_date: string | null; contract_reference: string | null;
}

function Row({ k, v }: { k: string; v: ReactNode }): ReactNode {
  return <div className="flex justify-between gap-3 text-[0.82rem]"><dt className="shrink-0 text-slate-500">{k}</dt><dd className="truncate text-right font-600 text-slate-800">{v}</dd></div>;
}

export default async function DocDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ paid?: string; sent?: string; err?: string }> }): Promise<ReactNode> {
  await requireFiscal("INVOICE_VIEW");
  const { id } = await params;
  requireUuid(id);
  const { paid, sent, err } = await searchParams;
  const providerConfigured = fiscalAdapter().configured;
  const pool = db();
  const [{ rows }, { rows: lines }, { rows: events }, { rows: payments }, { rows: deliveries }, { rows: installments }] = await Promise.all([
    pool.query<Doc>(
      `SELECT d.doc_type, d.seq::text, d.reason, r.seq::text related_seq,
              d.customer_name, d.customer_tin, d.customer_email, d.customer_address,
              d.issue_date::text, d.due_date::text, d.currency, d.payment_terms, d.payment_method,
              d.subtotal::text, d.vat::text, d.total::text, d.amount_paid::text,
              d.lifecycle_status, d.nrs_status, d.irn, d.qr_data, d.submission_ref, d.submitted_at::text, d.si_app_response,
              d.validation_messages, d.attempts, d.environment, d.public_token,
              d.billing_type, d.project_name, d.project_value::text, d.milestone_name, d.milestone_amount::text,
              d.invoice_percentage::text, d.percentage_previously_billed::text, d.billing_period, d.next_billing_date::text, d.contract_reference
         FROM einvoice d LEFT JOIN einvoice r ON r.id = d.related_id WHERE d.id=$1`, [id]),
    pool.query<{ description: string; quantity: string; unit_price: string; vat_applicable: boolean; line_total: string }>(
      "SELECT description, quantity::text, unit_price::text, vat_applicable, line_total::text FROM einvoice_line WHERE einvoice_id=$1 ORDER BY sort", [id]),
    pool.query<{ id: string; kind: string; summary: string; ok: boolean; created_at: string }>(
      "SELECT id::text, kind, summary, ok, created_at::text FROM einvoice_event WHERE einvoice_id=$1 ORDER BY created_at DESC", [id]),
    pool.query<{ id: string; payment_date: string; amount: string; method: string; reference: string | null; notes: string | null; remaining_balance: string; recorded_by_name: string | null }>(
      "SELECT p.id::text, p.payment_date::text, p.amount::text, p.method, p.reference, p.notes, p.remaining_balance::text, s.name recorded_by_name FROM einvoice_payment p LEFT JOIN staff s ON s.id=p.recorded_by WHERE p.einvoice_id=$1 ORDER BY p.created_at DESC", [id]),
    pool.query<{ id: string; channel: string; recipient: string | null; created_at: string; by_name: string | null }>(
      "SELECT d.id::text, d.channel, d.recipient, d.created_at::text, s.name by_name FROM einvoice_delivery d LEFT JOIN staff s ON s.id=d.created_by WHERE d.einvoice_id=$1 ORDER BY d.created_at DESC LIMIT 20", [id]),
    pool.query<{ id: string; label: string; percent: string | null; amount: string }>(
      "SELECT id::text, label, percent::text, amount::text FROM einvoice_installment WHERE einvoice_id=$1 ORDER BY sort", [id]),
  ]);
  const d = rows[0];
  if (!d) notFound();
  const meta = DOC_META[d.doc_type];
  const total = Number(d.total), amountPaid = Number(d.amount_paid);
  const outstanding = Math.max(0, total - amountPaid);
  const payStatus = paymentStatus(total, amountPaid, d.due_date);
  const isDraft = d.lifecycle_status === "Draft";
  const canSubmit = d.nrs_status === "NotSubmitted";
  const canRetry = d.nrs_status === "Rejected";
  const canCancel = d.lifecycle_status !== "Closed";
  const accepted = d.nrs_status === "Accepted";
  const backHref = d.doc_type === "Invoice" ? "/finance/invoices" : `/e-invoicing/${meta.path}`;
  const backLabel = d.doc_type === "Invoice" ? "Invoices" : `${meta.label}s`;

  return (
    <div className="mx-auto max-w-5xl">
      <Link href={backHref} className="inline-flex items-center gap-1.5 text-[0.8rem] font-600 text-[#543CDA] hover:text-[#4330B8]"><ArrowLeft size={15} strokeWidth={2.2} /> {backLabel}</Link>

      {/* Header with the three independent statuses */}
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-mono text-[1.25rem] font-700 text-slate-900">{docNumber(d.doc_type, d.seq)}</h1>
          {d.related_seq ? <p className="mt-0.5 text-[0.8rem] text-slate-500">Adjusts {docNumber("Invoice", d.related_seq)}{d.reason ? ` · ${d.reason}` : ""}</p> : null}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[0.72rem]">
            <span className="flex items-center gap-1.5"><span className="uppercase tracking-wide text-slate-500">Lifecycle</span><span className={`rounded-full px-2.5 py-0.5 font-600 ${LIFECYCLE_STYLE[d.lifecycle_status]}`}>{LIFECYCLE_LABEL[d.lifecycle_status]}</span></span>
            <span className="flex items-center gap-1.5"><span className="uppercase tracking-wide text-slate-500">NRS</span><span className={`rounded-full px-2.5 py-0.5 font-600 ${NRS_STYLE[d.nrs_status]}`}>{NRS_LABEL[d.nrs_status]}</span></span>
            <span className="flex items-center gap-1.5"><span className="uppercase tracking-wide text-slate-500">Payment</span><span className={`rounded-full px-2.5 py-0.5 font-600 ${PAYMENT_STYLE[payStatus]}`}>{payStatus}</span></span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isDraft ? <form action="/api/einvoice/lifecycle" method="post"><input type="hidden" name="id" value={id} /><input type="hidden" name="action" value="finalize" /><button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[0.8rem] font-600 text-slate-700 hover:bg-slate-50">Finalize <ChevronRight size={14} /></button></form> : null}
          {canSubmit && !isDraft ? <form action="/api/einvoice/submit" method="post"><input type="hidden" name="id" value={id} /><input type="hidden" name="action" value="submit" /><button className="inline-flex items-center gap-1.5 rounded-lg bg-[#543CDA] px-4 py-2 text-[0.8rem] font-600 text-white hover:bg-[#4330B8]"><Send size={14} /> Submit to NRS</button></form> : null}
          {canRetry ? <form action="/api/einvoice/submit" method="post"><input type="hidden" name="id" value={id} /><input type="hidden" name="action" value="retry" /><button className="inline-flex items-center gap-1.5 rounded-lg bg-[#B45309] px-4 py-2 text-[0.8rem] font-600 text-white hover:bg-[#92400e]"><RefreshCw size={14} /> Retry</button></form> : null}
          {canCancel ? <form action="/api/einvoice/submit" method="post"><input type="hidden" name="id" value={id} /><input type="hidden" name="action" value="cancel" /><button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[0.8rem] font-600 text-slate-600 hover:bg-red-50 hover:text-[#B91C1C]"><Ban size={14} /> Close</button></form> : null}
        </div>
      </div>

      {paid ? <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-[0.84rem] text-green-700">Payment recorded.</div> : null}
      {sent ? <div className="mt-4 rounded-lg border border-[#DBEAFE] bg-[#EFF6FF] px-4 py-2.5 text-[0.84rem] text-[#1D4ED8]">Logged delivery: {sent}.</div> : null}

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-4">
          {/* Invoice Summary */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
              <h2 className="text-[0.9rem] font-700 text-slate-900">Invoice Summary</h2>
              <dl className="mt-3 space-y-2">
                <Row k="Billing type" v={BILLING_LABEL[d.billing_type]} />
                {d.project_name ? <Row k="Project" v={d.project_name} /> : null}
                <Row k="Issued" v={new Date(d.issue_date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })} />
                <Row k="Due" v={d.due_date ? new Date(d.due_date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—"} />
                <Row k="Currency" v={d.currency} />
              </dl>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
              <h2 className="text-[0.9rem] font-700 text-slate-900">Customer Information</h2>
              <dl className="mt-3 space-y-2">
                <Row k="Name" v={d.customer_name} />
                <Row k="TIN" v={d.customer_tin ?? "—"} />
                <Row k="Email" v={d.customer_email ?? "—"} />
                <Row k="Address" v={d.customer_address ?? "—"} />
              </dl>
            </section>
          </div>

          {/* Billing-type specifics */}
          {d.billing_type !== "OneOff" ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
              <h2 className="text-[0.9rem] font-700 text-slate-900">{BILLING_LABEL[d.billing_type]}</h2>
              <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
                {d.billing_type === "Milestone" ? (<>
                  <Row k="Milestone" v={d.milestone_name ?? "—"} />
                  <Row k="Milestone amount" v={d.milestone_amount ? naira(d.milestone_amount, 0) : "—"} />
                  <Row k="Project value" v={d.project_value ? naira(d.project_value, 0) : "—"} />
                  <Row k="Remaining project" v={d.project_value && d.milestone_amount ? naira(Number(d.project_value) - Number(d.milestone_amount), 0) : "—"} />
                </>) : null}
                {d.billing_type === "Percentage" ? (<>
                  <Row k="Project value" v={d.project_value ? naira(d.project_value, 0) : "—"} />
                  <Row k="This invoice %" v={d.invoice_percentage ? `${Number(d.invoice_percentage)}%` : "—"} />
                  <Row k="Previously billed" v={`${Number(d.percentage_previously_billed)}%`} />
                  <Row k="Remaining %" v={d.invoice_percentage ? `${Math.max(0, 100 - Number(d.percentage_previously_billed) - Number(d.invoice_percentage))}%` : "—"} />
                  <Row k="Remaining value" v={d.project_value ? naira(Number(d.project_value) * (Math.max(0, 100 - Number(d.percentage_previously_billed) - Number(d.invoice_percentage ?? 0)) / 100), 0) : "—"} />
                </>) : null}
                {d.billing_type === "Retainer" ? (<>
                  <Row k="Billing period" v={d.billing_period ?? "—"} />
                  <Row k="Next billing" v={d.next_billing_date ? new Date(d.next_billing_date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—"} />
                  <Row k="Contract" v={d.contract_reference ?? "—"} />
                </>) : null}
              </dl>
              {d.billing_type === "CustomSchedule" && installments.length > 0 ? (
                <ul className="mt-3 flex flex-col divide-y divide-slate-100">
                  {installments.map((it) => <li key={it.id} className="flex items-center justify-between py-2 text-[0.83rem]"><span className="text-slate-700">{it.label}{it.percent ? <span className="ml-1.5 text-slate-500">{Number(it.percent)}%</span> : null}</span><span className="font-mono font-600 text-slate-900">{naira(it.amount, 0)}</span></li>)}
                </ul>
              ) : null}
            </section>
          ) : null}

          {/* Items */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-subtle">
            <h2 className="px-5 pt-5 text-[0.9rem] font-700 text-slate-900">Items</h2>
            <table className="mt-3 w-full text-left">
              <thead><tr className="border-b border-slate-100 text-[0.68rem] uppercase tracking-wide text-slate-500"><th className="px-5 py-2 font-600">Description</th><th className="px-3 py-2 text-right font-600">Qty</th><th className="px-3 py-2 text-right font-600">Unit</th><th className="px-5 py-2 text-right font-600">Amount</th></tr></thead>
              <tbody>
                {lines.map((l, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-b-0">
                    <td className="px-5 py-2.5 text-[0.83rem] text-slate-800">{l.description}{l.vat_applicable ? "" : <span className="ml-1.5 text-[0.7rem] text-slate-500">no VAT</span>}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-[0.8rem] text-slate-600">{Number(l.quantity)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-[0.8rem] text-slate-600">{naira(l.unit_price, 0)}</td>
                    <td className="px-5 py-2.5 text-right font-mono text-[0.82rem] text-slate-800">{naira(l.line_total, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="ml-auto max-w-xs space-y-1.5 px-5 py-4 text-[0.84rem]">
              <div className="flex justify-between text-slate-600"><span>Subtotal</span><span className="font-mono">{naira(d.subtotal, 2)}</span></div>
              <div className="flex justify-between text-slate-600"><span>VAT</span><span className="font-mono">{naira(d.vat, 2)}</span></div>
              <div className="flex justify-between border-t border-slate-100 pt-1.5 font-700 text-slate-900"><span>Total</span><span className="font-mono">{naira(d.total, 2)}</span></div>
            </div>
          </section>

          {/* Delivery - only the official PDF, and only for an NRS-accepted (legal) invoice */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
            <h2 className="text-[0.9rem] font-700 text-slate-900">Delivery</h2>
            <div className="mt-3">
              {accepted ? (
                <a href={`/e-invoicing/doc/${id}/pdf`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-[#543CDA] px-4 py-2 text-[0.83rem] font-600 text-white hover:bg-[#4330B8]"><Download size={15} /> Download Invoice PDF</a>
              ) : (
                <div className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-2.5 text-[0.8rem] text-slate-500"><Ban size={14} /> The official invoice PDF is available only after this document is accepted by the NRS.</div>
              )}
              <p className="mt-2 text-[0.74rem] text-slate-500">Share the invoice by sending the downloaded PDF. Only NRS-accepted documents can be issued.</p>
            </div>
            {deliveries.length > 0 ? (
              <div className="mt-4 border-t border-slate-100 pt-3">
                <p className="text-[0.72rem] uppercase tracking-wide text-slate-500">Delivery history</p>
                <ul className="mt-2 flex flex-col divide-y divide-slate-100">
                  {deliveries.map((dl) => <li key={dl.id} className="flex items-center justify-between py-1.5 text-[0.8rem]"><span className="text-slate-700">{dl.channel}{dl.recipient ? ` · ${dl.recipient}` : ""}</span><span className="text-slate-500">{dl.by_name ?? "—"} · {new Date(dl.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span></li>)}
                </ul>
              </div>
            ) : null}
          </section>
        </div>

        {/* Right column: NRS Compliance + Payment Tracking */}
        <aside className="flex flex-col gap-4">
          {/* NRS Compliance (read-only) */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
            <h2 className="text-[0.9rem] font-700 text-slate-900">NRS Compliance</h2>
            {!providerConfigured ? (
              <p className="mt-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[0.76rem] leading-relaxed text-amber-900">
                No accredited SI/APP is configured, so nothing on this document has been sent to the Nigeria Revenue Service and it cannot be fiscalised yet.
              </p>
            ) : null}
            {err === "noprovider" || err === "unavailable" ? (
              <p className="mt-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[0.76rem] leading-relaxed text-red-700" role="alert">
                {err === "noprovider"
                  ? "Not submitted: no accredited SI/APP is configured."
                  : "Not submitted: the service could not be reached. The document is unchanged, so you can retry safely."}
              </p>
            ) : null}
            <div className="mt-3 flex items-center gap-2">
              <span className={`grid h-8 w-8 place-items-center rounded-full ${accepted ? "bg-[#DCFCE7] text-[#15803D]" : d.nrs_status === "Rejected" ? "bg-[#FEE2E2] text-[#B91C1C]" : "bg-slate-100 text-slate-600"}`}>{accepted ? <CheckCircle2 size={16} /> : d.nrs_status === "Rejected" ? <XCircle size={16} /> : <Clock size={16} />}</span>
              <div><p className="text-[0.85rem] font-700 text-slate-900">{NRS_LABEL[d.nrs_status]}</p><p className="text-[0.74rem] text-slate-500">{d.attempts} attempt{d.attempts === 1 ? "" : "s"} · read-only</p></div>
            </div>
            <dl className="mt-4 space-y-2.5 text-[0.8rem]">
              <div><dt className="text-[0.7rem] uppercase tracking-wide text-slate-500">Submission Date</dt><dd className="text-slate-800">{d.submitted_at ? new Date(d.submitted_at).toLocaleString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "Not submitted"}</dd></div>
              <div><dt className="text-[0.7rem] uppercase tracking-wide text-slate-500">Submission Reference</dt><dd className="font-mono text-[0.78rem] text-slate-800">{d.submission_ref ?? "—"}</dd></div>
              <div><dt className="text-[0.7rem] uppercase tracking-wide text-slate-500">IRN</dt><dd className="font-mono text-[0.78rem] text-slate-800 break-all">{d.irn ?? "—"}</dd></div>
              <div><dt className="text-[0.7rem] uppercase tracking-wide text-slate-500">SI/APP Response</dt><dd className="text-slate-800">{d.si_app_response ?? "—"}</dd></div>
            </dl>
            {d.qr_data ? (
              <div className="mt-4">
                <dt className="text-[0.7rem] uppercase tracking-wide text-slate-500">QR Payload</dt>
                <dd className="mt-1.5 break-all rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 font-mono text-[0.7rem] text-slate-700">{d.qr_data}</dd>
                <p className="mt-1 text-[0.68rem] text-slate-500">Shown as issued by the service. Rendering it as a scannable code needs the provider&rsquo;s QR specification.</p>
              </div>
            ) : null}
            {d.validation_messages.length > 0 ? (
              <div className="mt-4"><dt className="text-[0.7rem] uppercase tracking-wide text-[#B91C1C]">Validation Messages</dt>
                <ul className="mt-1.5 space-y-1">{d.validation_messages.map((m, i) => <li key={i} className="flex items-start gap-1.5 text-[0.78rem] text-[#B91C1C]"><XCircle size={13} className="mt-0.5 shrink-0" /> {m}</li>)}</ul>
              </div>
            ) : null}
          </section>

          {/* Payment Tracking */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
            <h2 className="text-[0.9rem] font-700 text-slate-900">Payment Tracking</h2>
            <div className="mt-3 space-y-1.5 text-[0.84rem]">
              <div className="flex justify-between text-slate-600"><span>Invoice total</span><span className="font-mono">{naira(d.total, 2)}</span></div>
              <div className="flex justify-between text-slate-600"><span>Total paid</span><span className="font-mono text-[#15803D]">{naira(amountPaid, 2)}</span></div>
              <div className="flex justify-between border-t border-slate-100 pt-1.5 font-700 text-slate-900"><span>Outstanding</span><span className="font-mono text-[#543CDA]">{naira(outstanding, 2)}</span></div>
              <div className="flex items-center justify-between pt-1"><span className="text-slate-600">Status</span><span className={`rounded-full px-2.5 py-0.5 text-[0.72rem] font-600 ${PAYMENT_STYLE[payStatus]}`}>{payStatus}</span></div>
            </div>
            {accepted ? (
              <RecordPayment id={id} outstanding={outstanding} />
            ) : (
              <p className="mt-3 flex items-center gap-1.5 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-[0.76rem] text-slate-500"><Ban size={13} /> Payments can be recorded only after NRS acceptance.</p>
            )}
            {payments.length > 0 ? (
              <div className="mt-4 border-t border-slate-100 pt-3">
                <p className="text-[0.72rem] uppercase tracking-wide text-slate-500">Payment history</p>
                <ul className="mt-2 flex flex-col divide-y divide-slate-100">
                  {payments.map((p) => (
                    <li key={p.id} className="py-2">
                      <div className="flex items-center justify-between"><span className="font-mono text-[0.82rem] font-700 text-slate-900">{naira(p.amount, 2)}</span><span className="text-[0.72rem] text-slate-500">bal {naira(p.remaining_balance, 0)}</span></div>
                      <p className="text-[0.72rem] text-slate-500">{new Date(p.payment_date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })} · {p.method}{p.reference ? ` · ${p.reference}` : ""} · {p.recorded_by_name ?? "—"}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>

          {/* Submission attempts */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
            <h2 className="text-[0.9rem] font-700 text-slate-900">Submission Attempts</h2>
            {events.length === 0 ? <p className="mt-2 text-[0.8rem] text-slate-500">No attempts yet.</p> : (
              <ul className="mt-3 flex flex-col divide-y divide-slate-100">
                {events.map((e) => (
                  <li key={e.id} className="flex items-start gap-2 py-2">
                    <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${e.ok ? "bg-[#16A34A]" : "bg-[#B91C1C]"}`} />
                    <div className="min-w-0"><p className="text-[0.8rem] text-slate-700">{e.summary}</p><p className="text-[0.72rem] text-slate-500">{new Date(e.created_at).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</p></div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
