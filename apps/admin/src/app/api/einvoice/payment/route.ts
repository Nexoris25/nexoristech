/**
 * Record a payment against an invoice (Payment Tracking). Finance-only, manual: no gateway, no webhook.
 * Recording a payment updates only the receivables side - total paid, outstanding balance, payment
 * history - and NEVER the NRS compliance status. Nothing is transmitted to the SI/APP or the NRS when
 * a payment is recorded (compliance rule). The payment status is derived from what has been paid.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "../../../../lib/db.js";
import { getFiscalStaff } from "../../../../lib/fiscal/permissions.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const METHODS = new Set(["Bank Transfer", "Cash", "POS", "Card", "Cheque", "Other"]);

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getFiscalStaff("INVOICE_CREATE");
  const f = await request.formData();
  const id = String(f.get("id") ?? "");
  const back = new URL(`/e-invoicing/doc/${id || ""}`, request.url);
  // Only authorized Finance users (admins here) may record payments.
  if (!staff || !id) return NextResponse.redirect(back, { status: 303 });

  const amount = Number.parseFloat(String(f.get("amount") ?? ""));
  if (!Number.isFinite(amount) || amount <= 0) return NextResponse.redirect(new URL(`${back.pathname}?err=amount`, request.url), { status: 303 });

  const pool = db();
  const doc = (await pool.query<{ total: string; amount_paid: string; nrs_status: string }>("SELECT total::text, amount_paid::text, nrs_status FROM einvoice WHERE id=$1", [id])).rows[0];
  if (!doc) return NextResponse.redirect(back, { status: 303 });
  // Only a legal (NRS-accepted) invoice can take a payment.
  if (doc.nrs_status !== "Accepted") return NextResponse.redirect(new URL(`${back.pathname}?err=notaccepted`, request.url), { status: 303 });

  const total = Number(doc.total);
  const newPaid = Math.min(total, Number(doc.amount_paid) + amount); // never over-apply beyond the total
  const remaining = Math.max(0, total - newPaid);
  const method = METHODS.has(String(f.get("method"))) ? String(f.get("method")) : "Bank Transfer";

  await pool.query(
    `INSERT INTO einvoice_payment (einvoice_id, payment_date, amount, method, reference, notes, remaining_balance, recorded_by)
     VALUES ($1, COALESCE($2::date, current_date), $3, $4, $5, $6, $7, $8)`,
    [id, String(f.get("payment_date") ?? "") || null, amount, method,
      String(f.get("reference") ?? "").trim() || null, String(f.get("notes") ?? "").trim() || null, remaining, staff.id]);
  // Update the receivable only - the NRS status is deliberately untouched.
  await pool.query("UPDATE einvoice SET amount_paid=$1, updated_at=now() WHERE id=$2", [newPaid, id]);
  await pool.query(
    "INSERT INTO audit_log (actor_id, action, entity, entity_id, before, after) VALUES ($1,'einvoice-payment','einvoice',$2,NULL,$3::jsonb)",
    [staff.id, id, JSON.stringify({ amount, method, remaining })]).catch(() => undefined);

  return NextResponse.redirect(new URL(`${back.pathname}?paid=1`, request.url), { status: 303 });
}
