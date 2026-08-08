"use server";
/**
 * Shell actions (PRD 3.2, 3.4, 15): granting and revoking per-module access, updating company
 * settings and NRS e-invoicing readiness, and resolving a password-reset request by setting a new
 * password. Admin only. Every change writes to the one shared audit log.
 */
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { db } from "./db.js";
import { requireAdmin } from "./auth.js";
import { type SettingsState } from "./shell-constants.js";
import { securityPolicy, passwordProblem } from "./security-policy.js";

// Granting and revoking module access moved to the /api/access route handler: native form posts work
// when the dashboard is framed, where a Server Action is rejected on `Origin: null`.

export async function updateSettings(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const admin = await requireAdmin();
  const legalName = String(formData.get("legalName") ?? "").trim();
  const tin = String(formData.get("tin") ?? "").trim() || null;
  const address = String(formData.get("address") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const vatRaw = String(formData.get("vatRate") ?? "7.5").trim();
  const vatRate = Number.parseFloat(vatRaw);
  const nrsEnabled = formData.get("nrsEnabled") === "on";
  const nrsEnvironment = String(formData.get("nrsEnvironment") ?? "sandbox");
  const nrsPartner = String(formData.get("nrsPartner") ?? "").trim() || null;
  const nrsPartnerTypeRaw = String(formData.get("nrsPartnerType") ?? "").trim();
  const nrsPartnerType = nrsPartnerTypeRaw === "SI" || nrsPartnerTypeRaw === "APP" ? nrsPartnerTypeRaw : null;

  if (!legalName) return { error: "The legal name is required." };
  if (Number.isNaN(vatRate) || vatRate < 0 || vatRate > 100) {
    return { error: "Enter a valid VAT rate." };
  }
  if (!["sandbox", "production"].includes(nrsEnvironment)) {
    return { error: "Choose a valid NRS environment." };
  }
  if (nrsEnabled && !tin) {
    return { error: "A company TIN is required before NRS e-invoicing can be switched on." };
  }

  const pool = db();
  await pool.query(
    `UPDATE company_settings
        SET legal_name = $1, tin = $2, address = $3, email = $4, phone = $5, vat_rate = $6,
            nrs_enabled = $7, nrs_environment = $8, nrs_partner = $9, nrs_partner_type = $10,
            updated_at = now()
      WHERE id = true`,
    [legalName, tin, address, email, phone, vatRate, nrsEnabled, nrsEnvironment, nrsPartner, nrsPartnerType],
  );
  await pool.query(
    `INSERT INTO audit_log (actor_id, action, entity, entity_id, after)
     VALUES ($1, 'update-settings', 'company_settings', 'singleton', $2::jsonb)`,
    [admin.id, JSON.stringify({ nrsEnabled, nrsEnvironment, vatRate })],
  );
  revalidatePath("/settings");
  return { ok: true };
}

export async function resolvePasswordReset(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const requestId = String(formData.get("requestId") ?? "");
  const staffId = String(formData.get("staffId") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  // An administrator resetting someone's password is held to the same policy as the person themselves.
  if (!requestId || !staffId) return;
  if (passwordProblem(newPassword, await securityPolicy())) return;

  const pool = db();
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await pool.query("UPDATE staff SET password_hash = $1 WHERE id = $2", [passwordHash, staffId]);
  await pool.query(
    "UPDATE password_reset_request SET status = 'resolved', resolved_at = now(), resolved_by = $1 WHERE id = $2",
    [admin.id, requestId],
  );
  await pool.query(
    `INSERT INTO audit_log (actor_id, action, entity, entity_id, after)
     VALUES ($1, 'reset-password', 'staff', $2, $3::jsonb)`,
    [admin.id, staffId, JSON.stringify({ via: "admin reset" })],
  );
  revalidatePath("/settings/access");
}
