/**
 * Finance settings (PRD 6.10 Settings): financial year start, currency, VAT and WHT rates, and adding
 * a category or a payment method / bank account (6.2, 6.7). Finance Admin only; each change is logged.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "../../../../lib/db.js";
import { getCurrentStaff } from "../../../../lib/auth.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getCurrentStaff();
  if (!staff || staff.role !== "admin") return NextResponse.redirect(new URL("/finance/settings", request.url), { status: 303 });
  const f = await request.formData();
  const action = String(f.get("action") ?? "general");
  const pool = db();

  if (action === "category") {
    const kind = String(f.get("kind") ?? "") === "Income" ? "Income" : "Expense";
    const name = String(f.get("name") ?? "").trim();
    if (name) await pool.query("INSERT INTO finance_category (kind, name, sort) VALUES ($1,$2,50) ON CONFLICT (kind, name) DO NOTHING", [kind, name]);
  } else if (action === "method") {
    const name = String(f.get("name") ?? "").trim();
    const kind = ["Bank", "Cash", "Mobile"].includes(String(f.get("kind"))) ? String(f.get("kind")) : "Bank";
    if (name) await pool.query(
      "INSERT INTO payment_method (name, kind, bank_name, account_no) VALUES ($1,$2,$3,$4)",
      [name, kind, String(f.get("bank_name") ?? "").trim() || null, String(f.get("account_no") ?? "").trim() || null]);
  } else {
    const fyMonth = Math.min(12, Math.max(1, Math.round(Number.parseFloat(String(f.get("financial_year_start_month") ?? "1")) || 1)));
    const currency = String(f.get("currency") ?? "NGN").trim().slice(0, 8) || "NGN";
    const vat = Number.parseFloat(String(f.get("vat_rate") ?? "7.5"));
    const wht = Number.parseFloat(String(f.get("wht_rate") ?? "5"));
    await pool.query(
      "UPDATE finance_settings SET financial_year_start_month=$1, currency=$2, vat_rate=$3, wht_rate=$4, updated_at=now() WHERE id=true",
      [fyMonth, currency, Number.isFinite(vat) ? vat : 7.5, Number.isFinite(wht) ? wht : 5],
    );
  }
  await pool.query(
    "INSERT INTO audit_log (actor_id, action, entity, entity_id, before, after) VALUES ($1,'finance-settings','finance_settings','1',NULL,'{}'::jsonb)",
    [staff.id],
  ).catch(() => undefined);

  return NextResponse.redirect(new URL("/finance/settings?saved=1", request.url), { status: 303 });
}
