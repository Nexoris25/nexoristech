/**
 * NRS Error & Retry Queue (PRD 15, Settings side).
 *
 * This screen used to imply a queue that did not exist: it listed rejected documents and sent the
 * operator elsewhere to act. There is now a real queue behind it, so it shows three distinct things that
 * were previously conflated:
 *
 *   Waiting    - jobs the worker will pick up, with when they are next due.
 *   Gave up    - jobs that exhausted their attempts. These need a person, not another retry.
 *   Rejected   - documents the authority actually considered and refused. Not a queue problem at all;
 *                the data has to change before resubmitting is worth anything.
 *
 * Keeping "could not reach the service" apart from "the service said no" is the whole point. They look
 * similar on a dashboard and mean completely different things.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, PlayCircle, RefreshCw, XCircle } from "lucide-react";
import { requireFiscal } from "../../../../../lib/fiscal/permissions.js";
import { db } from "../../../../../lib/db.js";
import { fiscalAdapter } from "../../../../../lib/fiscal/provider.js";
import { DOC_META, docNumber, type DocType } from "../../../../../lib/einvoice.js";

export const dynamic = "force-dynamic";

interface JobRow {
  id: string; status: string; attempts: number; max_attempts: number;
  next_attempt_at: string; last_error: string | null; due: boolean;
  einvoice_id: string; doc_type: DocType; seq: string; customer_name: string;
}
interface Rejected { id: string; doc_type: DocType; seq: string; customer_name: string; attempts: number; validation_messages: string[] }

const when = (iso: string): string =>
  new Date(iso).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default async function RetryQueuePage({ searchParams }: {
  searchParams: Promise<{ ran?: string; picked?: string; accepted?: string; rejected?: string; deferred?: string; failed?: string }>;
}): Promise<ReactNode> {
  await requireFiscal("TAX_FISCAL_CONFIG_MANAGE");
  const s = await searchParams;
  const pool = db();
  const providerConfigured = fiscalAdapter().configured;

  const [{ rows: jobs }, { rows: rejected }] = await Promise.all([
    pool.query<JobRow>(
      `SELECT j.id, j.status, j.attempts, j.max_attempts, j.next_attempt_at::text, j.last_error,
              (j.next_attempt_at <= now()) AS due,
              e.id AS einvoice_id, e.doc_type, e.seq::text, e.customer_name
         FROM fiscal_submission_job j JOIN einvoice e ON e.id = j.einvoice_id
        WHERE j.status IN ('queued','running','failed')
        ORDER BY (j.status='failed') DESC, j.next_attempt_at
        LIMIT 100`),
    pool.query<Rejected>(
      "SELECT id, doc_type, seq::text, customer_name, attempts, validation_messages FROM einvoice WHERE nrs_status='Rejected' ORDER BY updated_at DESC LIMIT 100"),
  ]);

  const waiting = jobs.filter((j) => j.status !== "failed");
  const gaveUp = jobs.filter((j) => j.status === "failed");
  const dueNow = waiting.filter((j) => j.due).length;

  const card = "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-subtle";
  const ref = (j: { einvoice_id: string; doc_type: DocType; seq: string; customer_name: string }): ReactNode => (
    <p className="text-[0.85rem] font-600 text-slate-900">
      <Link href={`/e-invoicing/doc/${j.einvoice_id}`} className="font-mono text-[#543CDA] hover:text-[#4330B8]">{docNumber(j.doc_type, j.seq)}</Link>
      <span className="font-400 text-slate-500"> · {j.customer_name} · {DOC_META[j.doc_type].label}</span>
    </p>
  );

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900">Error &amp; Retry Queue</h1>
          <p className="mt-1 text-[0.88rem] text-slate-500">Documents waiting to reach the Nigeria Revenue Service, and those that could not.</p>
        </div>
        <form action="/api/fiscal/queue" method="post">
          <button
            disabled={!providerConfigured || waiting.length === 0}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#543CDA] px-4 py-2 text-[0.83rem] font-600 text-white hover:bg-[#4330B8] disabled:cursor-not-allowed disabled:opacity-50">
            <PlayCircle size={15} /> Process queue now
          </button>
        </form>
      </div>

      {s.ran ? (
        <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[0.83rem] text-slate-700">
          Processed {s.picked ?? "0"} job{s.picked === "1" ? "" : "s"}: {s.accepted ?? "0"} accepted, {s.rejected ?? "0"} rejected, {s.deferred ?? "0"} deferred for another try, {s.failed ?? "0"} gave up.
        </p>
      ) : null}

      {!providerConfigured ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[0.83rem] leading-relaxed text-amber-900">
          No accredited SI/APP is configured, so the queue cannot be processed. Nothing here has been sent to the Nigeria Revenue Service.
        </p>
      ) : null}

      {/* Waiting */}
      <section className={`mt-5 ${card}`}>
        <h2 className="flex flex-wrap items-center gap-2 px-5 pt-5 text-[0.95rem] font-700 text-slate-900">
          <Clock size={17} className="text-[#543CDA]" /> Waiting to be sent
          {waiting.length > 0 ? <span className="rounded-full bg-[#EEEBFC] px-2 py-0.5 text-[0.72rem] font-600 text-[#543CDA]">{waiting.length}</span> : null}
          {dueNow > 0 ? <span className="text-[0.74rem] font-400 text-slate-500">{dueNow} due now</span> : null}
        </h2>
        {waiting.length === 0 ? (
          <p className="px-5 py-10 text-center text-[0.86rem] text-slate-500">Nothing is waiting to be sent.</p>
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-slate-100">
            {waiting.map((j) => (
              <li key={j.id} className="flex items-start gap-3 px-5 py-3.5">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#EEEBFC] text-[#543CDA]"><Clock size={16} /></span>
                <div className="min-w-0 flex-1">
                  {ref(j)}
                  <p className="text-[0.78rem] text-slate-500">
                    {j.due ? "Due now" : `Next attempt ${when(j.next_attempt_at)}`}
                    {j.last_error ? ` · ${j.last_error}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-[0.74rem] text-slate-500">{j.attempts} of {j.max_attempts}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Exhausted */}
      {gaveUp.length > 0 ? (
        <section className={`mt-4 ${card} border-amber-200`}>
          <h2 className="flex items-center gap-2 px-5 pt-5 text-[0.95rem] font-700 text-amber-800"><AlertTriangle size={17} /> Gave up after repeated failures</h2>
          <p className="px-5 text-[0.78rem] text-amber-800">The service could not be reached. These were never considered by the authority, so their status is unchanged.</p>
          <ul className="mt-3 flex flex-col divide-y divide-slate-100">
            {gaveUp.map((j) => (
              <li key={j.id} className="flex items-start gap-3 px-5 py-3.5">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#FEF3C7] text-[#B45309]"><AlertTriangle size={16} /></span>
                <div className="min-w-0 flex-1">{ref(j)}<p className="text-[0.78rem] text-[#B45309]">{j.last_error ?? "Could not reach the service."}</p></div>
                <span className="shrink-0 text-[0.74rem] text-slate-500">{j.attempts} attempts</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Rejected: a real answer from the authority, not a delivery problem. */}
      <section className={`mt-4 ${card}`}>
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5">
          <h2 className="flex items-center gap-2 text-[0.95rem] font-700 text-slate-900"><XCircle size={17} className="text-[#B91C1C]" /> Rejected by the NRS</h2>
          <Link href="/e-invoicing/rejected" className="inline-flex items-center gap-1.5 text-[0.8rem] font-600 text-[#543CDA] hover:text-[#4330B8]"><RefreshCw size={14} /> Submission Centre</Link>
        </div>
        <p className="px-5 text-[0.78rem] text-slate-500">Considered and refused. Correct the document before resubmitting.</p>
        {rejected.length === 0 ? (
          <p className="px-5 py-10 text-center text-[0.86rem] text-slate-500">No document has been rejected.</p>
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-slate-100">
            {rejected.map((r) => (
              <li key={r.id} className="flex items-start gap-3 px-5 py-3.5">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#FEE2E2] text-[#B91C1C]"><XCircle size={16} /></span>
                <div className="min-w-0 flex-1">
                  {ref({ einvoice_id: r.id, doc_type: r.doc_type, seq: r.seq, customer_name: r.customer_name })}
                  <p className="text-[0.78rem] text-[#B91C1C]">{r.validation_messages.join("; ") || "Rejected"}</p>
                </div>
                <span className="shrink-0 text-[0.74rem] text-slate-500">{r.attempts} attempt{r.attempts === 1 ? "" : "s"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
