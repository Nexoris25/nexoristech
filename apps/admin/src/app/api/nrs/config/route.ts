/**
 * NRS e-invoicing configuration (PRD 15 readiness). Saves the non-secret integration and registration
 * config onto the single company_settings row, and runs a connection "test" that records readiness
 * without calling the NRS - nothing is submitted to the Nigeria Revenue Service from here yet (§17).
 * Secrets never touch the database: credentials are expected in the environment; we store only a flag
 * that they are set. Admin only; every change is logged.
 */
import type { NextRequest } from "next/server";
import { db } from "../../../../lib/db.js";
import { getFiscalStaff } from "../../../../lib/fiscal/permissions.js";
import { credentialsPresent } from "../../../../lib/fiscal/provider.js";
import { seeOther } from "../../../../lib/redirect.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getFiscalStaff("TAX_FISCAL_CONFIG_MANAGE");
  const f = await request.formData();
  const action = String(f.get("action") ?? "");
  const back = action === "registration" ? "/settings/e-invoicing/registration" : "/settings/e-invoicing/integration";
  if (!staff) return seeOther(back);
  const pool = db();

  if (action === "registration") {
    await pool.query(
      "UPDATE company_settings SET tin=$1, rc_number=$2, nrs_taxpayer_tin=$3, updated_at=now() WHERE id=true",
      [String(f.get("tin") ?? "").trim() || null, String(f.get("rc_number") ?? "").trim() || null, String(f.get("nrs_taxpayer_tin") ?? "").trim() || null]);
  } else if (action === "test") {
    // Readiness check only; no live call is made. Credential presence is read from the environment
    // rather than from a flag someone ticked, so this cannot report ready while nothing is configured.
    const c = (await pool.query<{ nrs_environment: string; nrs_taxpayer_tin: string | null; nrs_business_id: string | null; nrs_service_id: string | null }>(
      "SELECT nrs_environment, nrs_taxpayer_tin, nrs_business_id, nrs_service_id FROM company_settings WHERE id=true")).rows[0]!;
    const missing: string[] = [];
    if (!c.nrs_taxpayer_tin) missing.push("taxpayer TIN");
    if (!c.nrs_business_id) missing.push("Business ID");
    if (!c.nrs_service_id) missing.push("Service ID");
    if (!credentialsPresent()) missing.push("environment credentials");
    const ok = missing.length === 0;
    await pool.query("UPDATE company_settings SET nrs_last_test_at=now(), nrs_last_test_ok=$1, nrs_credentials_set=$2 WHERE id=true",
      [ok, credentialsPresent()]);
    await pool.query("INSERT INTO nrs_log (kind, summary, ok) VALUES ('auth', $1, $2)",
      [ok ? `Readiness check passed (${c.nrs_environment})` : `Readiness check failed: missing ${missing.join(", ")}`, ok]);
    return seeOther("/settings/e-invoicing/integration?tested=1");
  } else {
    const env = String(f.get("nrs_environment")) === "production" ? "production" : "sandbox";
    const partnerType = ["SI", "APP"].includes(String(f.get("nrs_partner_type"))) ? String(f.get("nrs_partner_type")) : null;
    await pool.query(
      `UPDATE company_settings SET nrs_enabled=$1, nrs_environment=$2, nrs_partner=$3, nrs_partner_type=$4,
          nrs_business_id=$5, nrs_service_id=$6, nrs_credentials_set=$7, updated_at=now() WHERE id=true`,
      [
        f.get("nrs_enabled") != null, env,
        String(f.get("nrs_partner") ?? "").trim() || null, partnerType,
        // Business ID and Service ID are independent. Neither falls back to the other.
        String(f.get("nrs_business_id") ?? "").trim() || null,
        String(f.get("nrs_service_id") ?? "").trim() || null,
        // Derived from the environment, never from the form: a self-declared flag can claim credentials
        // exist when none do, and the readiness check would then pass on nothing.
        credentialsPresent(),
      ]);
  }
  await pool.query(
    "INSERT INTO audit_log (actor_id, action, entity, entity_id, before, after) VALUES ($1,'update-settings','nrs_config','1',NULL,$2::jsonb)",
    [staff.id, JSON.stringify({ action })]).catch(() => undefined);

  return seeOther(back + "?saved=1");
}
