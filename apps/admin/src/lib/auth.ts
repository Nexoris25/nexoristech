/**
 * Auth helpers for the admin dashboard (PRD 2.4). getCurrentStaff reads the signed session cookie
 * and re-checks the staff is still active in the database, so a deactivated account loses access
 * immediately. requireStaff and requireAdmin gate server components and actions.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db.js";
import { SESSION_COOKIE, verifySession } from "./session.js";

export interface CurrentStaff {
  id: string;
  name: string;
  role: "admin" | "salesperson" | "viewer";
}

export async function getCurrentStaff(): Promise<CurrentStaff | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const payload = verifySession(token);
  if (!payload) return null;

  const { rows } = await db().query<{ name: string; role: CurrentStaff["role"] }>(
    "SELECT name, role FROM staff WHERE id = $1 AND active = true",
    [payload.sub],
  );
  const row = rows[0];
  if (!row) return null;
  return { id: payload.sub, name: row.name, role: row.role };
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
