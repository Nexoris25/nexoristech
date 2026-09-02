/**
 * Mark an invoice paid, or cancel it.
 *
 * "Mark as paid" is not a flag. It records a payment for whatever is outstanding, through the same
 * ledger as any other payment, so the money shows up in `einvoice_payment` with a date and a method
 * and the revenue figures see it. A boolean would have been a second, quieter source of truth about
 * whether an invoice was settled, and the two would eventually disagree.
 *
 * Cancelling is a state, never a delete. A cancelled invoice stays readable, stops counting as
 * revenue and stops counting as a debt. Two things it refuses:
 *
 *  - An invoice the NRS has accepted. Once a document has been fiscalised it exists in the tax
 *    authority's records and cannot be withdrawn by editing our own database; the instrument for
 *    that is a credit note. Whether a given case needs one is an accounting question, so this
 *    refuses and says why rather than guessing.
 *  - An invoice that has taken money. Cancelling it would leave a payment attached to a document
 *    that no longer claims anything. That needs a refund or a credit note, again not a flag.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "../../../../lib/db.js";
import { getFiscalStaff } from "../../../../lib/fiscal/permissions.js";
import { isPositive, subtractMoney } from "../../../../lib/projects.js";
import { nextSeriesNumber } from "../../../../lib/projects-server.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ISSUED = new Set(["ReadyToSend", "SentToCustomer", "Viewed", "Closed"]);

interface DocRow {
  total: string;
  amount_paid: string;
  lifecycle_status: string;
  nrs_status: string;
  cancelled_at: string | null;
  doc_type: string;
}

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getFiscalStaff("INVOICE_CREATE");
  const f = await request.formData();
  const id = String(f.get("id") ?? "");
  const action = String(f.get("action") ?? "");
  const back = new URL(`/e-invoicing/doc/${id || ""}`, request.url);
  const fail = (err: string, msg?: string): Response =>
    NextResponse.redirect(
      new URL(
        `${back.pathname}?err=${err}${msg ? `&msg=${encodeURIComponent(msg)}` : ""}`,
        request.url,
      ),
      { status: 303 },
    );
  if (!staff || !id) return NextResponse.redirect(back, { status: 303 });

  const pool = db();
  const doc = (
    await pool.query<DocRow>(
      "SELECT total::text, amount_paid::text, lifecycle_status, nrs_status, cancelled_at, doc_type FROM einvoice WHERE id=$1",
      [id],
    )
  ).rows[0];
  if (!doc) return NextResponse.redirect(back, { status: 303 });
  if (doc.doc_type !== "Invoice") return fail("notinvoice");

  if (action === "cancel") {
    if (doc.cancelled_at) return fail("already", "This invoice is already cancelled.");
    if (doc.nrs_status === "Accepted") {
      return fail(
        "fiscal",
        "This invoice has been accepted by the NRS and cannot be cancelled here. Raise a credit note against it instead.",
      );
    }
    if (isPositive(doc.amount_paid)) {
      return fail(
        "haspayment",
        "This invoice has payments recorded against it. Refund or credit those first; cancelling would leave money attached to a document that claims nothing.",
      );
    }
    const reason = String(f.get("reason") ?? "").trim();
    if (reason.length === 0) return fail("reason", "Give a reason for cancelling this invoice.");

    await pool.query(
      "UPDATE einvoice SET cancelled_at=now(), cancel_reason=$1, cancelled_by=$2, lifecycle_status='Closed', updated_at=now() WHERE id=$3",
      [reason, staff.id, id],
    );
    await pool
      .query(
        "INSERT INTO audit_log (actor_id, action, entity, entity_id, before, after) VALUES ($1,'einvoice-cancel','einvoice',$2,$3::jsonb,$4::jsonb)",
        [
          staff.id,
          id,
          JSON.stringify({ lifecycle_status: doc.lifecycle_status, cancelled: false }),
          JSON.stringify({ cancelled: true, reason }),
        ],
      )
      .catch(() => undefined);
    return NextResponse.redirect(new URL(`${back.pathname}?cancelled=1`, request.url), {
      status: 303,
    });
  }

  if (action === "paid") {
    if (doc.cancelled_at) return fail("cancelled", "A cancelled invoice cannot be marked paid.");
    if (!ISSUED.has(doc.lifecycle_status)) {
      return fail("notissued", "Send this invoice to the customer before marking it paid.");
    }
    const outstanding = subtractMoney(doc.total, doc.amount_paid);
    if (!isPositive(outstanding)) {
      return fail("already", "This invoice is already paid in full.");
    }

    const method = String(f.get("method") ?? "").trim() || "Bank Transfer";
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO einvoice_payment (einvoice_id, payment_date, amount, method, reference, notes, remaining_balance, recorded_by)
         VALUES ($1, COALESCE($2::date, current_date), $3::numeric, $4, $5, $6, 0, $7)`,
        [
          id,
          String(f.get("payment_date") ?? "") || null,
          outstanding,
          method,
          String(f.get("reference") ?? "").trim() || null,
          "Marked as paid in full.",
          staff.id,
        ],
      );
      await client.query(
        "UPDATE einvoice SET amount_paid=total, updated_at=now() WHERE id=$1",
        [id],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }

    await pool
      .query(
        "INSERT INTO audit_log (actor_id, action, entity, entity_id, before, after) VALUES ($1,'einvoice-markpaid','einvoice',$2,$3::jsonb,$4::jsonb)",
        [
          staff.id,
          id,
          JSON.stringify({ amount_paid: doc.amount_paid }),
          JSON.stringify({ amount_paid: doc.total, settled: outstanding, method }),
        ],
      )
      .catch(() => undefined);
    return NextResponse.redirect(new URL(`${back.pathname}?paid=1`, request.url), { status: 303 });
  }

  // Turn an ordinary PDF invoice into one destined for the NRS.
  //
  // It takes a number in the fiscal series at this point rather than at creation, which is what
  // keeps that series gapless: invoices that are never filed never consume a fiscal number. The
  // consequence is that the document's number changes, and the customer may already be holding the
  // old one. That is why this is a deliberate action with a warning on it rather than a checkbox
  // somebody flips: whether a re-numbered invoice needs re-issuing, or a credit note against the
  // first, is an accounting decision and not one this code should make quietly.
  if (action === "fiscalise") {
    if (doc.cancelled_at) return fail("cancelled", "A cancelled invoice cannot be filed.");
    const current = (
      await pool.query<{ fiscal_required: boolean; series: string | null; series_no: string | null }>(
        "SELECT fiscal_required, series, series_no::text FROM einvoice WHERE id=$1",
        [id],
      )
    ).rows[0]!;
    if (current.fiscal_required) {
      return fail("already", "This invoice is already marked for NRS submission.");
    }

    const client = await pool.connect();
    let newNo: string;
    try {
      await client.query("BEGIN");
      newNo = await nextSeriesNumber(client, "INV");
      await client.query(
        "UPDATE einvoice SET fiscal_required=true, series='INV', series_no=$1::bigint, updated_at=now() WHERE id=$2",
        [newNo, id],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }

    await pool
      .query(
        "INSERT INTO audit_log (actor_id, action, entity, entity_id, before, after) VALUES ($1,'einvoice-fiscalise','einvoice',$2,$3::jsonb,$4::jsonb)",
        [
          staff.id,
          id,
          JSON.stringify({ fiscal_required: false, series: current.series, series_no: current.series_no }),
          JSON.stringify({ fiscal_required: true, series: "INV", series_no: newNo }),
        ],
      )
      .catch(() => undefined);
    return NextResponse.redirect(new URL(`${back.pathname}?fiscalised=1`, request.url), {
      status: 303,
    });
  }

  return NextResponse.redirect(back, { status: 303 });
}
