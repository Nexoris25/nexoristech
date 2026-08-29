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
import { moduleOf, roleAllows, type Capability } from "./permissions.js";
import type { ModuleId } from "./shell-constants.js";
import { rethrowAsUserFacing } from "./db-errors.js";

export interface CurrentStaff {
  id: string;
  name: string;
  role: "admin" | "ceo" | "executive" | "salesperson" | "viewer";
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
 * The role a staff member holds in a module, or null when they hold no grant there.
 *
 * One grant per person per module is what the access screen writes, so LIMIT 1 is the shape of the
 * data rather than a guess at it.
 */
export async function moduleRoleOf(staffId: string, module: ModuleId): Promise<string | null> {
  const { rows } = await db().query<{ role: string }>(
    "SELECT role FROM module_access WHERE staff_id = $1 AND module = $2 LIMIT 1",
    [staffId, module],
  );
  return rows[0]?.role ?? null;
}

/**
 * Whether the signed-in person may do a particular thing.
 *
 * The base admin role is above the module model and holds everything, which is what makes it the
 * account you use to hand out access rather than an account you grant into every module by hand.
 * Everyone else is judged on the role they were granted in that module and nothing else, so being
 * signed in stops being an implicit permission the way it was for CRM.
 */
export async function can(staff: CurrentStaff, capability: Capability): Promise<boolean> {
  if (staff.role === "admin") return true;
  const module = moduleOf(capability);
  return roleAllows(module, await moduleRoleOf(staff.id, module), capability);
}

/**
 * Require a capability for a page. Anyone without it goes to their own dashboard.
 *
 * Their dashboard, not the CRM. requireAdmin has always sent refusals to /crm, which was harmless
 * when only admins reached these pages and is not once other people do: it would drop a Payroll
 * Officer into a module they may have no grant for at all.
 */
export async function requireCapability(capability: Capability): Promise<CurrentStaff> {
  const staff = await requireStaff();
  if (!(await can(staff, capability))) redirect("/dashboard");
  return staff;
}

/**
 * Require any access at all to a module, for a module's layout.
 *
 * This is the gate that was missing entirely. A module's pages used to ask "is anyone signed in",
 * so the sidebar hiding a link was the only thing keeping people out of it, and a URL typed by hand
 * went straight through. Read capability is the floor: holding no role in a module means holding
 * none of its capabilities, including reading.
 */
export async function requireModule(module: ModuleId): Promise<CurrentStaff> {
  const staff = await requireStaff();
  if (staff.role === "admin") return staff;
  if (await moduleRoleOf(staff.id, module)) return staff;
  redirect("/dashboard");
}

/** The same capability check for an API route: the staff member, or null when they may not do this. */
export async function getStaffFor(capability: Capability): Promise<CurrentStaff | null> {
  const staff = await getCurrentStaff();
  if (!staff) return null;
  return (await can(staff, capability)) ? staff : null;
}

/**
 * The modules a staff member was granted (not counting the implicit admin-sees-all). Used to route a
 * CMS-only user straight to the CMS and to keep them out of the admin dashboard.
 */
export async function grantedModules(staffId: string): Promise<string[]> {
  const { rows } = await db().query<{ module: string }>("SELECT DISTINCT module FROM module_access WHERE staff_id = $1", [staffId]);
  return rows.map((r) => r.module);
}
