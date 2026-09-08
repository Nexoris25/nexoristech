/**
 * Save the company profile (PRD 15). The single company_settings row: legal identity, registration,
 * contact, logo, fiscal year, default VAT, and notification channels. Admin only; the change is
 * logged. NRS credentials are handled on the e-invoicing screens, never here, and secrets never land
 * in this table.
 */
import type { NextRequest } from "next/server";
import { db } from "../../../../lib/db.js";
import { getCurrentStaff } from "../../../../lib/auth.js";
import { seeOther } from "../../../../lib/redirect.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getCurrentStaff();
  if (!staff || staff.role !== "admin") return seeOther("/settings/company");
  const f = await request.formData();

  const fyMonth = Math.min(12, Math.max(1, Math.round(Number.parseFloat(String(f.get("fiscal_year_start_month") ?? "1")) || 1)));
  const vat = Number.parseFloat(String(f.get("vat_rate") ?? "7.5"));

  await db().query(
    `UPDATE company_settings SET
        legal_name=$1, tin=$2, rc_number=$3, registration_number=$4, address=$5, email=$6, phone=$7,
        logo_url=$8, fiscal_year_start_month=$9, vat_rate=$10,
        notify_email=$11, notify_sms=$12, notify_inapp=$13, updated_at=now()
      WHERE id=true`,
    [
      String(f.get("legal_name") ?? "").trim() || "Nexoris Technologies Ltd",
      String(f.get("tin") ?? "").trim() || null,
      String(f.get("rc_number") ?? "").trim() || null,
      String(f.get("registration_number") ?? "").trim() || null,
      String(f.get("address") ?? "").trim(),
      String(f.get("email") ?? "").trim(),
      String(f.get("phone") ?? "").trim(),
      String(f.get("logo_url") ?? "").trim() || null,
      fyMonth,
      Number.isFinite(vat) ? vat : 7.5,
      f.get("notify_email") != null,
      f.get("notify_sms") != null,
      f.get("notify_inapp") != null,
    ],
  );
  await db().query(
    "INSERT INTO audit_log (actor_id, action, entity, entity_id, before, after) VALUES ($1,'update-settings','company_settings','1',NULL,'{}'::jsonb)",
    [staff.id],
  ).catch(() => undefined);

  return seeOther("/settings/company?saved=1");
}
