/**
 * Who may do what in the fiscal module.
 *
 * Two problems this fixes. First, every e-invoicing route gated on the global `admin` base role, so the
 * `e-Invoicing Admin` grant existed in the constants but conferred nothing — granting it was a no-op, and
 * the only way to let someone raise an invoice was to make them a full platform admin.
 *
 * Second, and more important: **managing the fiscal integration is not an invoice permission**.
 * `TAX_FISCAL_CONFIG_MANAGE` controls the Business ID, Service ID, environment and credentials — the
 * settings that determine where tax documents go and under whose identity. Someone who raises and submits
 * invoices all day has no need of it, and an operational role should never quietly carry the ability to
 * repoint the integration. It is therefore held by the platform admin alone and is not granted by any
 * e-invoicing module role.
 */
import { redirect } from "next/navigation";
import { db } from "../db.js";
import { getCurrentStaff, type CurrentStaff } from "../auth.js";

export type FiscalPermission =
  /** See documents and their compliance state. */
  | "INVOICE_VIEW"
  /** Raise, edit and record payment against a document. */
  | "INVOICE_CREATE"
  /** Transmit a document to the Nigeria Revenue Service through the SI/APP. */
  | "INVOICE_SUBMIT"
  /** Change where tax documents go and under whose identity. Deliberately not an invoice permission. */
  | "TAX_FISCAL_CONFIG_MANAGE";

/** What each `einvoicing` module role confers. No role here grants TAX_FISCAL_CONFIG_MANAGE. */
export const ROLE_PERMISSIONS: Record<string, readonly FiscalPermission[]> = {
  "e-Invoicing Admin": ["INVOICE_VIEW", "INVOICE_CREATE", "INVOICE_SUBMIT"],
  "e-Invoicing Viewer": ["INVOICE_VIEW"],
};

/**
 * The fiscal permissions a person holds.
 *
 * A platform admin holds everything, including configuration. Everyone else holds exactly what their
 * `einvoicing` grant confers, and nothing if they have no grant.
 */
export async function fiscalPermissions(staff: CurrentStaff): Promise<Set<FiscalPermission>> {
  if (staff.role === "admin") {
    return new Set<FiscalPermission>(["INVOICE_VIEW", "INVOICE_CREATE", "INVOICE_SUBMIT", "TAX_FISCAL_CONFIG_MANAGE"]);
  }
  const { rows } = await db().query<{ role: string }>(
    "SELECT role FROM module_access WHERE staff_id=$1 AND module='einvoicing'", [staff.id]);
  const held = new Set<FiscalPermission>();
  for (const r of rows) for (const p of ROLE_PERMISSIONS[r.role] ?? []) held.add(p);
  return held;
}

export async function hasFiscalPermission(staff: CurrentStaff, permission: FiscalPermission): Promise<boolean> {
  return (await fiscalPermissions(staff)).has(permission);
}

/** For pages. Signed-out users go to login; users without the permission go to their dashboard. */
export async function requireFiscal(permission: FiscalPermission): Promise<CurrentStaff> {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");
  if (!(await hasFiscalPermission(staff, permission))) redirect("/dashboard");
  return staff;
}

/** For route handlers. Returns the staff member when permitted, else null so the caller can redirect. */
export async function getFiscalStaff(permission: FiscalPermission): Promise<CurrentStaff | null> {
  const staff = await getCurrentStaff();
  if (!staff) return null;
  return (await hasFiscalPermission(staff, permission)) ? staff : null;
}
