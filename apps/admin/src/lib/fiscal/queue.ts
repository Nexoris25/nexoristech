/**
 * The submission queue.
 *
 * Submission used to run inline in the operator's request: a slow SI/APP held the page open, and a
 * failed one lost the attempt entirely. Now a submission is enqueued and a worker drains it, so a
 * provider outage delays a document rather than dropping it.
 *
 * Every attempt writes a `fiscal_submission` row before the job row is touched. That ordering is
 * deliberate — the evidence of what was sent survives even if the job bookkeeping then fails.
 */
import { createHash } from "node:crypto";
import { db } from "../db.js";
import { fiscalAdapter } from "./provider.js";
import type { FiscalDocument } from "./adapter.js";
import { docNumber, type DocType } from "../einvoice.js";

/** Backoff between attempts. Deliberately coarse: a tax authority is not a service to hammer. */
const BACKOFF_MINUTES = [1, 5, 15, 60, 240];

export interface EnqueueResult { queued: boolean; reason?: string }

/**
 * Put a document in the queue.
 *
 * The partial unique index means a document already queued or running cannot be enqueued again, so a
 * double click cannot cause a document to be transmitted and fiscalised twice.
 */
export async function enqueueSubmission(einvoiceId: string, requestedBy: string): Promise<EnqueueResult> {
  const { rows } = await db().query<{ id: string }>(
    `INSERT INTO fiscal_submission_job (einvoice_id, requested_by)
     VALUES ($1,$2)
     ON CONFLICT (einvoice_id) WHERE status IN ('queued','running') DO NOTHING
     RETURNING id`,
    [einvoiceId, requestedBy]);
  return rows[0]
    ? { queued: true }
    : { queued: false, reason: "This document is already waiting to be submitted." };
}

interface DocRow {
  id: string; doc_type: string; seq: string; nrs_status: string; customer_name: string;
  customer_tin: string | null; issue_date: string; currency: string; environment: string;
  subtotal: string; vat: string; total: string;
}
interface LineRow { description: string; quantity: string; unit_price: string; line_total: string; vat_applicable: boolean }

async function buildPayload(doc: DocRow): Promise<FiscalDocument> {
  const { rows: lines } = await db().query<LineRow>(
    "SELECT description, quantity::text, unit_price::text, line_total::text, vat_applicable FROM einvoice_line WHERE einvoice_id=$1 ORDER BY sort",
    [doc.id]);
  return {
    id: doc.id,
    docType: doc.doc_type as FiscalDocument["docType"],
    reference: docNumber(doc.doc_type as DocType, doc.seq),
    buyerName: doc.customer_name,
    buyerTin: doc.customer_tin,
    issueDate: doc.issue_date,
    currency: doc.currency,
    subtotal: doc.subtotal, vat: doc.vat, total: doc.total,
    lines: lines.map((l) => ({
      description: l.description, quantity: l.quantity, unitPrice: l.unit_price,
      lineTotal: l.line_total, vatApplicable: l.vat_applicable,
    })),
  };
}

/** A stable fingerprint of what was sent, so an unchanged document is provably unchanged across retries. */
function digest(payload: FiscalDocument): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex").slice(0, 32);
}

export interface DrainResult { picked: number; accepted: number; rejected: number; deferred: number; failed: number }

/**
 * Process every job that is due. Returns counts for the operator.
 *
 * Jobs are claimed with `FOR UPDATE SKIP LOCKED` so two workers running at once cannot both take the
 * same document — the one thing that would cause a duplicate transmission.
 */
export async function drainQueue(limit = 25): Promise<DrainResult> {
  const pool = db();
  const adapter = fiscalAdapter();
  const result: DrainResult = { picked: 0, accepted: 0, rejected: 0, deferred: 0, failed: 0 };

  const client = await pool.connect();
  let claimed: { id: string; einvoice_id: string; attempts: number; max_attempts: number }[];
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<{ id: string; einvoice_id: string; attempts: number; max_attempts: number }>(
      `SELECT id, einvoice_id, attempts, max_attempts FROM fiscal_submission_job
        WHERE status='queued' AND next_attempt_at <= now()
        ORDER BY next_attempt_at
        LIMIT $1 FOR UPDATE SKIP LOCKED`, [limit]);
    claimed = rows;
    if (rows.length > 0) {
      await client.query("UPDATE fiscal_submission_job SET status='running', updated_at=now() WHERE id = ANY($1::uuid[])",
        [rows.map((r) => r.id)]);
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  result.picked = claimed.length;

  for (const job of claimed) {
    const doc = (await pool.query<DocRow>(
      `SELECT id, doc_type, seq::text, nrs_status, customer_name, customer_tin, issue_date::text,
              currency, environment, subtotal::text, vat::text, total::text
         FROM einvoice WHERE id=$1`, [job.einvoice_id])).rows[0];

    // The document went away, or something else already fiscalised it. Either way there is nothing to do.
    if (!doc || doc.nrs_status === "Accepted") {
      await pool.query("UPDATE fiscal_submission_job SET status='done', updated_at=now() WHERE id=$1", [job.id]);
      continue;
    }

    const payload = await buildPayload(doc);
    const attemptNumber = job.attempts + 1;
    const started = Date.now();
    const outcome = await adapter.submit(payload);
    const elapsed = Date.now() - started;

    // Evidence first, bookkeeping second.
    await pool.query(
      `INSERT INTO fiscal_submission (einvoice_id, attempt_number, provider, environment, request_digest,
          outcome, irn, provider_ref, raw_response, messages, duration_ms)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11)`,
      [doc.id, attemptNumber, adapter.providerName, doc.environment, digest(payload),
       outcome.outcome,
       outcome.outcome === "accepted" ? outcome.irn : null,
       outcome.outcome === "accepted" ? outcome.providerReference : outcome.outcome === "rejected" ? outcome.providerReference : null,
       outcome.outcome === "unavailable" ? outcome.reason : outcome.rawResponse,
       JSON.stringify(outcome.outcome === "rejected" ? outcome.messages : []),
       elapsed]);

    if (outcome.outcome === "unavailable") {
      // Not a tax outcome. Defer and try again, or give up and ask for a human once attempts run out.
      const exhausted = attemptNumber >= job.max_attempts;
      const wait = BACKOFF_MINUTES[Math.min(attemptNumber - 1, BACKOFF_MINUTES.length - 1)]!;
      await pool.query(
        `UPDATE fiscal_submission_job
            SET status=$1, attempts=$2, last_error=$3, next_attempt_at=now() + ($4 || ' minutes')::interval, updated_at=now()
          WHERE id=$5`,
        [exhausted ? "failed" : "queued", attemptNumber, outcome.reason, String(wait), job.id]);
      await pool.query("INSERT INTO einvoice_event (einvoice_id, kind, summary, ok) VALUES ($1,'unavailable',$2,false)",
        [doc.id, exhausted ? `Gave up after ${attemptNumber} attempts: ${outcome.reason}` : `Not submitted: ${outcome.reason}`]);
      if (exhausted) result.failed += 1; else result.deferred += 1;
      continue;
    }

    if (outcome.outcome === "rejected") {
      await pool.query(
        `UPDATE einvoice SET nrs_status='Rejected', submission_ref=$1, si_app_response=$2,
            validation_messages=$3::jsonb, submitted_at=now(), attempts=attempts+1, updated_at=now() WHERE id=$4`,
        [outcome.providerReference, outcome.rawResponse, JSON.stringify(outcome.messages), doc.id]);
      await pool.query("INSERT INTO einvoice_event (einvoice_id, kind, summary, ok) VALUES ($1,'reject',$2,false)",
        [doc.id, `Rejected · ${outcome.messages.join("; ")}`]);
      // A rejection is a real answer, so the job is done. Fixing the data raises a fresh submission.
      await pool.query("UPDATE fiscal_submission_job SET status='done', attempts=$1, updated_at=now() WHERE id=$2",
        [attemptNumber, job.id]);
      result.rejected += 1;
      continue;
    }

    await pool.query(
      `UPDATE einvoice SET nrs_status='Accepted', irn=$1, qr_data=$2, submission_ref=$3, si_app_response=$4,
          validation_messages='[]'::jsonb, submitted_at=now(), attempts=attempts+1, updated_at=now() WHERE id=$5`,
      [outcome.irn, outcome.qrPayload, outcome.providerReference, outcome.rawResponse, doc.id]);
    await pool.query("INSERT INTO einvoice_event (einvoice_id, kind, summary, ok) VALUES ($1,'accept',$2,true)",
      [doc.id, `Accepted · IRN ${outcome.irn}`]);
    await pool.query("UPDATE fiscal_submission_job SET status='done', attempts=$1, updated_at=now() WHERE id=$2",
      [attemptNumber, job.id]);
    result.accepted += 1;
  }

  return result;
}
