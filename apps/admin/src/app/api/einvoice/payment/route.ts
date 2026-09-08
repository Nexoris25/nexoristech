/**
 * Record a payment against an invoice (Payment Tracking). Finance-only, manual: no gateway, no webhook.
 * Recording a payment updates only the receivables side - total paid, outstanding balance, payment
 * history - and NEVER the NRS compliance status. Nothing is transmitted to the SI/APP or the NRS when
 * a payment is recorded (compliance rule). The payment status is derived from what has been paid.
 *
 * Two things this route used to get wrong.
 *
 * It refused any invoice whose `nrs_status` was not `Accepted`, which meant an ordinary PDF invoice
 * could never be paid and never appeared as a debt. `lib/einvoice.ts` already documents the three
 * statuses as independent - lifecycle is the commercial workflow, NRS is tax compliance, payment is
 * receivables, and "they never affect each other" - so this restores the stated design rather than
 * changing it. Whether a document reached the tax authority is not a question about whether the
 * customer owes us money. The gate is now the commercial one: an invoice has to have been issued.
 *
 * And it did the money in floats, then hid the drift with `Math.min(total, paid + amount)`, which
 * silently recorded a smaller payment than the one entered. Arithmetic now goes through Decimal in
 * `applyPayment`, and an overpayment is refused with the balance named rather than trimmed.
 */
import type { NextRequest } from "next/server";
import { db } from "../../../../lib/db.js";
import { getFiscalStaff } from "../../../../lib/fiscal/permissions.js";
import { applyPayment, isPercentageProblem } from "../../../../lib/projects.js";
import { seeOther } from "../../../../lib/redirect.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const METHODS = new Set(["Bank Transfer", "Cash", "POS", "Card", "Cheque", "Other"]);

/** An invoice can take money once it has been issued to the customer. */
const ISSUED = new Set(["ReadyToSend", "SentToCustomer", "Viewed", "Closed"]);

interface DocRow {
  total: string;
  amount_paid: string;
  lifecycle_status: string;
  cancelled_at: string | null;
  doc_type: string;
}

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getFiscalStaff("INVOICE_CREATE");
  const f = await request.formData();
  const id = String(f.get("id") ?? "");
  const back = `/e-invoicing/doc/${id || ""}`;
  const fail = (err: string): Response =>
    seeOther(`${back}?err=${err}`);
  // Only authorized Finance users (admins here) may record payments.
  if (!staff || !id) return seeOther(back);

  const pool = db();
  const doc = (
    await pool.query<DocRow>(
      "SELECT total::text, amount_paid::text, lifecycle_status, cancelled_at, doc_type FROM einvoice WHERE id=$1",
      [id],
    )
  ).rows[0];
  if (!doc) return seeOther(back);

  if (doc.cancelled_at) return fail("cancelled");
  if (doc.doc_type !== "Invoice") return fail("notinvoice");
  // Not a compliance gate: an invoice simply has to have been issued before it can be paid.
  if (!ISSUED.has(doc.lifecycle_status)) return fail("notissued");

  const applied = applyPayment({
    total: doc.total,
    alreadyPaid: doc.amount_paid,
    amount: f.get("amount"),
  });
  if (isPercentageProblem(applied)) {
    return seeOther(`${back}?err=amount&msg=${encodeURIComponent(applied.error)}`);
  }

  const method = METHODS.has(String(f.get("method"))) ? String(f.get("method")) : "Bank Transfer";
  const amount = String(f.get("amount") ?? "").trim();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO einvoice_payment (einvoice_id, payment_date, amount, method, reference, notes, remaining_balance, recorded_by)
       VALUES ($1, COALESCE($2::date, current_date), $3::numeric, $4, $5, $6, $7::numeric, $8)`,
      [
        id,
        String(f.get("payment_date") ?? "") || null,
        amount,
        method,
        String(f.get("reference") ?? "").trim() || null,
        String(f.get("notes") ?? "").trim() || null,
        applied.remaining,
        staff.id,
      ],
    );
    // Update the receivable only - the NRS status is deliberately untouched.
    await client.query("UPDATE einvoice SET amount_paid=$1::numeric, updated_at=now() WHERE id=$2", [
      applied.paid,
      id,
    ]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }

  await pool
    .query(
      "INSERT INTO audit_log (actor_id, action, entity, entity_id, before, after) VALUES ($1,'einvoice-payment','einvoice',$2,$3::jsonb,$4::jsonb)",
      [
        staff.id,
        id,
        JSON.stringify({ amount_paid: doc.amount_paid }),
        JSON.stringify({ amount, method, amount_paid: applied.paid, remaining: applied.remaining }),
      ],
    )
    .catch(() => undefined);

  return seeOther(`${back}?paid=1`);
}
