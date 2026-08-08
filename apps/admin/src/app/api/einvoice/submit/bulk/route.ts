/**
 * Bulk NRS submission. Two modes from the compliance lists: "ready" submits every finalized invoice not
 * yet sent, and "rejected" retries every rejected one.
 *
 * Like the single-document route, this enqueues rather than transmitting inline: a batch of 500 documents
 * must not be attempted inside one HTTP request. The worker drains the queue with backoff, and fiscal
 * fields are still only ever written from what a provider returned.
 *
 * With no accredited provider configured it refuses the whole batch up front rather than queueing work
 * that cannot possibly be sent. Documents already queued are skipped, so pressing this twice is safe.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "../../../../../lib/db.js";
import { getFiscalStaff } from "../../../../../lib/fiscal/permissions.js";
import { fiscalAdapter } from "../../../../../lib/fiscal/provider.js";
import { enqueueSubmission } from "../../../../../lib/fiscal/queue.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface DocRow { id: string }

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getFiscalStaff("INVOICE_SUBMIT");
  const f = await request.formData();
  const mode = String(f.get("mode") ?? "rejected") === "ready" ? "ready" : "rejected";
  const back = new URL(`/e-invoicing/${mode === "ready" ? "ready" : "rejected"}`, request.url);
  if (!staff) return NextResponse.redirect(back, { status: 303 });

  const adapter = fiscalAdapter();
  if (!adapter.configured) {
    await db().query("INSERT INTO nrs_log (kind, summary, ok) VALUES ('submit', $1, false)",
      ["Bulk submission blocked: no accredited SI/APP is configured, so nothing was sent to the NRS."]);
    return NextResponse.redirect(new URL(`${back.pathname}?err=noprovider`, request.url), { status: 303 });
  }

  const pool = db();
  const where = mode === "ready"
    ? "doc_type='Invoice' AND nrs_status='NotSubmitted' AND lifecycle_status NOT IN ('Draft','Closed')"
    : "nrs_status='Rejected'";
  const { rows } = await pool.query<DocRow>(`SELECT id FROM einvoice WHERE ${where} LIMIT 500`);

  let queued = 0;
  let skipped = 0;
  for (const doc of rows) {
    const r = await enqueueSubmission(doc.id, staff.id);
    if (!r.queued) { skipped += 1; continue; }
    queued += 1;
    await pool.query("INSERT INTO einvoice_event (einvoice_id, kind, summary, ok) VALUES ($1,$2,$3,true)",
      [doc.id, mode === "ready" ? "submit" : "retry",
       mode === "ready" ? `Queued for submission to ${adapter.providerName}` : `Queued for resubmission to ${adapter.providerName}`]);
  }

  await pool.query("INSERT INTO nrs_log (kind, summary, ok) VALUES ('submit', $1, true)",
    [`Bulk ${mode}: queued ${queued} document${queued === 1 ? "" : "s"}${skipped > 0 ? `, skipped ${skipped} already waiting` : ""}.`]);

  back.searchParams.set("queued", String(queued));
  if (skipped > 0) back.searchParams.set("skipped", String(skipped));
  return NextResponse.redirect(back, { status: 303 });
}
