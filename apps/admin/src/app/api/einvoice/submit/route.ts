/**
 * Drive an NRS document through its lifecycle (PRD 15): submit, retry a rejected one, or cancel.
 *
 * Submission goes through the SI/APP adapter and nowhere else. Fiscal fields — `irn`, `qr_data`,
 * `submission_ref`, and `nrs_status='Accepted'` — are written ONLY from what a provider actually
 * returned. With no accredited provider configured the adapter reports `unavailable`, the document is
 * left untouched, and the operator is told plainly that nothing was sent.
 *
 * This replaces an earlier simulated submission that invented an IRN and an acceptance. A document that
 * has not reached the Nigeria Revenue Service must never look as though it has.
 *
 * Cancel remains a commercial action and never touches NRS status.
 *
 * Submission is queued rather than transmitted inline. A slow provider used to hold the operator's
 * request open and a failed one lost the attempt; now the document waits in the queue and the worker
 * retries it with backoff. The refusal when no provider is configured still happens here, up front, so
 * nothing joins the queue that cannot possibly be sent.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "../../../../lib/db.js";
import { getFiscalStaff } from "../../../../lib/fiscal/permissions.js";
import { fiscalAdapter } from "../../../../lib/fiscal/provider.js";
import { enqueueSubmission } from "../../../../lib/fiscal/queue.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface DocRow { id: string; doc_type: string; nrs_status: string; lifecycle_status: string; fiscal_required: boolean; cancelled_at: string | null }

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getFiscalStaff("INVOICE_SUBMIT");
  const f = await request.formData();
  const id = String(f.get("id") ?? "");
  const action = String(f.get("action") ?? "submit");
  const back = new URL(`/e-invoicing/doc/${id || ""}`, request.url);
  if (!staff || !id) return NextResponse.redirect(back, { status: 303 });

  const pool = db();
  const doc = (await pool.query<DocRow>(
    "SELECT id, doc_type, nrs_status, lifecycle_status, fiscal_required, cancelled_at FROM einvoice WHERE id=$1", [id])).rows[0];
  if (!doc) return NextResponse.redirect(back, { status: 303 });

  // Cancel is a commercial (lifecycle) action - it closes the document and never touches NRS status.
  if (action === "cancel") {
    await pool.query("UPDATE einvoice SET lifecycle_status='Closed', updated_at=now() WHERE id=$1", [id]);
    await pool.query("INSERT INTO einvoice_event (einvoice_id, kind, summary, ok) VALUES ($1,'cancel','Document closed',true)", [id]);
    return NextResponse.redirect(back, { status: 303 });
  }

  // Submitting is opt-in. An invoice raised as an ordinary PDF invoice is not a document anybody
  // asked to file, and sending one to the tax authority because a button was available would be a
  // filing nobody decided to make. Converting it is a deliberate, separate action.
  if (!doc.fiscal_required) {
    return NextResponse.redirect(new URL(`${back.pathname}?err=notfiscal`, request.url), { status: 303 });
  }
  if (doc.cancelled_at) {
    return NextResponse.redirect(new URL(`${back.pathname}?err=cancelled`, request.url), { status: 303 });
  }

  // Submit or retry: only from a non-final NRS state, and only NRS status is ever changed here.
  if (!["NotSubmitted", "Rejected"].includes(doc.nrs_status)) return NextResponse.redirect(back, { status: 303 });
  // A commercial invoice must be finalized (out of Draft, not Closed) before it can be submitted. Only
  // invoices carry the Finance lifecycle; credit/debit notes are raised finalized in the NRS module.
  if (doc.doc_type === "Invoice" && (doc.lifecycle_status === "Draft" || doc.lifecycle_status === "Closed")) {
    return NextResponse.redirect(new URL(`${back.pathname}?err=notfinal`, request.url), { status: 303 });
  }

  const adapter = fiscalAdapter();

  // Refuse before recording an attempt when there is no provider to receive it. An attempt count should
  // measure how often the authority was asked, not how often the operator clicked a dead button.
  if (!adapter.configured) {
    await pool.query(
      "INSERT INTO einvoice_event (einvoice_id, kind, summary, ok) VALUES ($1,'blocked',$2,false)",
      [id, "Submission blocked: no accredited SI/APP is configured, so nothing was sent to the NRS."]);
    return NextResponse.redirect(new URL(`${back.pathname}?err=noprovider`, request.url), { status: 303 });
  }

  const queued = await enqueueSubmission(id, staff.id);
  if (!queued.queued) return NextResponse.redirect(new URL(`${back.pathname}?err=queued`, request.url), { status: 303 });

  await pool.query("INSERT INTO einvoice_event (einvoice_id, kind, summary, ok) VALUES ($1,$2,$3,true)",
    [id, action === "retry" ? "retry" : "submit",
     action === "retry" ? `Queued for resubmission to ${adapter.providerName}` : `Queued for submission to ${adapter.providerName}`]);
  await pool.query(
    "INSERT INTO audit_log (actor_id, action, entity, entity_id, before, after) VALUES ($1,'einvoice-submit','einvoice',$2,$3::jsonb,$4::jsonb)",
    [staff.id, id, JSON.stringify({ nrs_status: doc.nrs_status }), JSON.stringify({ queued: true })]).catch(() => undefined);

  return NextResponse.redirect(new URL(`${back.pathname}?queued=1`, request.url), { status: 303 });
}
