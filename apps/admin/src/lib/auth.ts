/**
 * Auth helpers for the admin dashboard (PRD 2.4). getCurrentStaff reads the signed session cookie
 * and re-checks the staff is still active in the database, so a deactivated account loses access
 * immediately. requireStaff and requireAdmin gate server components and actions.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db.js";
import { SESSION_COOKIE, verifySession } from "./session.js";
import { sessionIsLive } from "./sessions.js";
import { cmsCan, type CmsCapability } from "./cms-roles.js";
import { rethrowAsUserFacing } from "./db-errors.js";

export interface CurrentStaff {
  id: string;
  name: string;
  role: "admin" | "salesperson" | "viewer";
  /** The staff_session row backing this request, when the cookie carries one. */
  sessionId?: string;
}

export async function getCurrentStaff(): Promise<CurrentStaff | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const payload = verifySession(token);
  if (!payload) return null;

  // A valid signature is not enough: the session must not have been signed out from another device.
  // This also stamps last_seen_at, which is what makes the sessions list say something useful.
  if (!(await sessionIsLive(payload.sid))) return null;

  // A database outage is not the same as a missing session. Returning null here would send the person
  // to the login page, which cannot authenticate them either, and would report the wrong cause: they
  // would be told they are signed out when in fact the database is down. Access is still refused —
  // nothing below this line runs — but the failure is reported as what it is.
  let rows: { name: string; role: CurrentStaff["role"] }[];
  try {
    ({ rows } = await db().query<{ name: string; role: CurrentStaff["role"] }>(
      "SELECT name, role FROM staff WHERE id = $1 AND active = true",
      [payload.sub],
    ));
  } catch (error) {
    rethrowAsUserFacing(error, "checking the signed-in staff member");
  }
  const row = rows[0];
  if (!row) return null;
  return { id: payload.sub, name: row.name, role: row.role, ...(payload.sid ? { sessionId: payload.sid } : {}) };
}

/** Require a signed-in staff member, redirecting to the login page otherwise. */
export async function requireStaff(): Promise<CurrentStaff> {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");
  return staff;
}

/** Require an admin, redirecting non-admins to the CRM. */
export async function requireAdmin(): Promise<CurrentStaff> {
  const staff = await requireStaff();
  if (staff.role !== "admin") redirect("/crm");
  return staff;
}

/**
 * CMS access model (RBAC). The CMS is a granted module: admins have it implicitly; Content Writers,
 * Editors, and Fact-Checkers are granted the `cms` module and see only the CMS when they sign in.
 */
export async function hasCmsAccess(staffId: string, role: CurrentStaff["role"]): Promise<boolean> {
  if (role === "admin") return true;
  const { rows } = await db().query("SELECT 1 FROM module_access WHERE staff_id = $1 AND module = 'cms' LIMIT 1", [staffId]);
  return rows.length > 0;
}

/** Require CMS access for a CMS page. Signed-out users go to login; users without CMS access go to their dashboard. */
export async function requireCmsAccess(): Promise<CurrentStaff> {
  const staff = await requireStaff();
  if (await hasCmsAccess(staff.id, staff.role)) return staff;
  redirect("/dashboard");
}

/** Return the signed-in staff if they can edit the CMS (admin or granted), else null. For CMS API routes. */
export async function getCmsStaff(): Promise<CurrentStaff | null> {
  const staff = await getCurrentStaff();
  if (!staff) return null;
  return (await hasCmsAccess(staff.id, staff.role)) ? staff : null;
}

/** The CMS role granted to a staff member, or null when they hold no CMS grant. */
export async function cmsRoleOf(staffId: string): Promise<string | null> {
  const { rows } = await db().query<{ role: string }>(
    "SELECT role FROM module_access WHERE staff_id = $1 AND module = 'cms' LIMIT 1", [staffId]);
  return rows[0]?.role ?? null;
}

/**
 * Whether the signed-in person may do a particular thing in the CMS.
 *
 * Access used to stop at "has the cms module", so a Content Writer and a CMS Admin were the same thing
 * to the code. This reads the granted role and checks it against the capability model.
 */
export async function cmsAllows(staff: CurrentStaff, capability: CmsCapability): Promise<boolean> {
  if (staff.role === "admin") return true;
  return cmsCan(staff.role, await cmsRoleOf(staff.id), capability);
}

/** Require a CMS capability for a page. Anyone without it is sent back to the CMS home. */
export async function requireCmsCapability(capability: CmsCapability): Promise<CurrentStaff> {
  const staff = await requireCmsAccess();
  if (!(await cmsAllows(staff, capability))) redirect("/cms");
  return staff;
}

/** The same check for an API route: the staff member, or null when they may not do this. */
export async function getCmsStaffFor(capability: CmsCapability): Promise<CurrentStaff | null> {
  const staff = await getCmsStaff();
  if (!staff) return null;
  return (await cmsAllows(staff, capability)) ? staff : null;
}

/**
 * The modules a staff member was granted (not counting the implicit admin-sees-all). Used to route a
 * CMS-only user straight to the CMS and to keep them out of the admin dashboard.
 */
export async function grantedModules(staffId: string): Promise<string[]> {
  const { rows } = await db().query<{ module: string }>("SELECT DISTINCT module FROM module_access WHERE staff_id = $1", [staffId]);
  return rows.map((r) => r.module);
}
