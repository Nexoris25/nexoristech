/**
 * VAT charged on invoices that have not been filed with the NRS.
 *
 * This is the list a month end actually needs. Charging VAT means tax has been collected, and tax
 * collected has to be accounted for whether or not the document went to the tax authority. An
 * unfiled invoice is not invalid — filing may not be available yet, and the platform deliberately
 * does not block on it — but it is an obligation, and an obligation nobody can see is one that gets
 * missed.
 *
 * The pair that defines it, `vat_charged AND NOT fiscal_required`, needed no new column: it was
 * already sitting in the data, unread. Cancelled invoices are excluded, because no tax was collected
 * on a document that claims nothing.
 *
 * The opposite case — no VAT charged — is not listed here. That one carries a recorded reason on the
 * invoice itself, which is what makes it defensible.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { requireFiscal } from "../../../../lib/fiscal/permissions.js";
import { db } from "../../../../lib/db.js";
import { docNumber, naira, type DocType } from "../../../../lib/einvoice.js";

export const dynamic = "force-dynamic";

interface Row {
  id: string;
  doc_type: DocType;
  seq: string;
  series: string | null;
  series_no: string | null;
  customer_name: string;
  issue_date: string;
  subtotal: string;
  vat: string;
  total: string;
  project_name: string | null;
}

export default async function VatToAccountPage(): Promise<ReactNode> {
  await requireFiscal("INVOICE_VIEW");
  const pool = db();

  const [{ rows }, { rows: byMonth }] = await Promise.all([
    pool.query<Row>(
      `SELECT id, doc_type, seq::text, series, series_no::text, customer_name, issue_date::text,
              subtotal::text, vat::text, total::text, project_name
         FROM einvoice
        WHERE doc_type = 'Invoice' AND vat_charged AND NOT fiscal_required AND cancelled_at IS NULL
        ORDER BY issue_date DESC LIMIT 500`,
    ),
    pool.query<{ month: string; vat: string; count: string }>(
      `SELECT to_char(date_trunc('month', issue_date), 'Mon YYYY') month,
              SUM(vat)::text vat, count(*)::text count
         FROM einvoice
        WHERE doc_type = 'Invoice' AND vat_charged AND NOT fiscal_required AND cancelled_at IS NULL
        GROUP BY date_trunc('month', issue_date)
        ORDER BY date_trunc('month', issue_date) DESC LIMIT 12`,
    ),
  ]);

  const totalVat = rows.reduce((t, r) => t + Number(r.vat), 0);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-[1.4rem] font-700 text-slate-900">VAT to account for</h1>
      <p className="mt-1 max-w-2xl text-[0.88rem] text-slate-500">
        Invoices that charged VAT and have not been filed with the NRS. The tax has been collected
        either way, so it still has to be accounted for. Filing one removes it from this list.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div className="text-[0.7rem] font-600 uppercase tracking-wide text-slate-500">VAT collected, unfiled</div>
          <div className="mt-1 font-mono text-[1.15rem] font-700 tabular-nums text-[#B45309]">{naira(totalVat)}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div className="text-[0.7rem] font-600 uppercase tracking-wide text-slate-500">Invoices</div>
          <div className="mt-1 font-mono text-[1.15rem] font-700 tabular-nums text-slate-900">{rows.length}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div className="text-[0.7rem] font-600 uppercase tracking-wide text-slate-500">Oldest</div>
          <div className="mt-1 font-mono text-[0.95rem] font-700 tabular-nums text-slate-900">
            {rows.length > 0 ? rows[rows.length - 1]!.issue_date : "—"}
          </div>
        </div>
      </div>

      {byMonth.length > 0 ? (
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-subtle">
          <div className="border-b border-slate-200 px-5 py-2.5 text-[0.8rem] font-700 text-slate-900">By month</div>
          <table className="w-full text-left">
            <tbody>
              {byMonth.map((m) => (
                <tr key={m.month} className="border-b border-slate-100 last:border-0">
                  <td className="px-5 py-2 text-[0.84rem] text-slate-700">{m.month}</td>
                  <td className="px-5 py-2 text-right text-[0.8rem] text-slate-500">{m.count} invoice{m.count === "1" ? "" : "s"}</td>
                  <td className="px-5 py-2 text-right font-mono text-[0.84rem] tabular-nums text-slate-900">{naira(m.vat)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-subtle">
        {rows.length === 0 ? (
          <p className="px-5 py-12 text-center text-[0.88rem] text-slate-500">
            Nothing outstanding. Every invoice that charged VAT has been filed.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[0.7rem] uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-600">Invoice</th>
                  <th className="px-5 py-3 font-600">Customer</th>
                  <th className="px-5 py-3 font-600">Issued</th>
                  <th className="px-5 py-3 text-right font-600">Net</th>
                  <th className="px-5 py-3 text-right font-600">VAT</th>
                  <th className="px-5 py-3 text-right font-600">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <Link href={`/e-invoicing/doc/${r.id}`} className="font-mono text-[0.82rem] font-600 text-[#543CDA] hover:text-[#4330B8]">
                        {docNumber(r.doc_type, r.seq, r.series, r.series_no)}
                      </Link>
                      {r.project_name ? <span className="block text-[0.7rem] text-slate-400">{r.project_name}</span> : null}
                    </td>
                    <td className="px-5 py-3 text-[0.85rem] text-slate-800">{r.customer_name}</td>
                    <td className="px-5 py-3 text-[0.8rem] text-slate-600">{r.issue_date}</td>
                    <td className="px-5 py-3 text-right font-mono text-[0.82rem] tabular-nums text-slate-600">{naira(r.subtotal)}</td>
                    <td className="px-5 py-3 text-right font-mono text-[0.82rem] tabular-nums font-600 text-[#B45309]">{naira(r.vat)}</td>
                    <td className="px-5 py-3 text-right font-mono text-[0.82rem] tabular-nums text-slate-900">{naira(r.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
