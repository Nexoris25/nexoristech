/**
 * Record an expense (PRD 6.5) - the payable side of the ledger. A company expense entered directly by
 * Finance against a category and an optional vendor, paid from a bank account. VAT is captured for the
 * input-VAT report but is part of what we pay. Payroll posts its own expense rows automatically on
 * disbursement (8.9); those carry source = 'Payroll' and are not entered here.
 */
import type { NextRequest } from "next/server";
import { db } from "../../../../lib/db.js";
import { getStaffFor } from "../../../../lib/auth.js";
import { seeOther } from "../../../../lib/redirect.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getStaffFor("finance.payment.record");
  if (!staff) return seeOther("/finance/payables");
  const f = await request.formData();

  const description = String(f.get("description") ?? "").trim();
  const amount = Number.parseFloat(String(f.get("amount") ?? ""));
  if (!description || !Number.isFinite(amount) || amount < 0) {
    return seeOther("/finance/payables?error=1");
  }
  const vat = Number.parseFloat(String(f.get("vat") ?? "0")) || 0;
  const status = String(f.get("status") ?? "Paid") === "Unpaid" ? "Unpaid" : "Paid";

  const row = (await db().query<{ id: string }>(
    `INSERT INTO expense (expense_date, category_id, vendor, description, amount, vat, payment_method_id, status, reference, created_by)
     VALUES (COALESCE($1::date, current_date), $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
    [
      String(f.get("expense_date") ?? "") || null,
      String(f.get("category_id") ?? "") || null,
      String(f.get("vendor") ?? "").trim() || null,
      description, amount, vat,
      String(f.get("payment_method_id") ?? "") || null,
      status,
      String(f.get("reference") ?? "").trim() || null,
      staff.id,
    ],
  )).rows[0]!;
  await db().query(
    "INSERT INTO audit_log (actor_id, action, entity, entity_id, before, after) VALUES ($1,'expense-recorded','expense',$2,NULL,$3::jsonb)",
    [staff.id, row.id, JSON.stringify({ description, amount })],
  ).catch(() => undefined);

  return seeOther("/finance/payables");
}
