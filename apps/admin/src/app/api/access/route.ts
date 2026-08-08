/**
 * People & Access mutations (PRD 3.2) as a route handler with native form posts, so granting works
 * everywhere the dashboard runs (Server Actions are rejected when the app is framed and the browser
 * sends `Origin: null`). Three actions:
 *   grant   - give a person a module + role (upsert into the one access table every check reads)
 *   revoke  - remove a module grant
 *   invite  - create the login account for someone onboarded in HR and issue a link they follow to set
 *             their own password, linking employee.staff_id so the HR record and the login are the same
 *             person. Nothing is emailed: the admin copies the link from the access screen and shares it.
 *   reissue - mint a fresh link for a pending invite, for when the old one expired or went astray.
 * Admin only. Every change writes to the shared audit log.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "../../../lib/db.js";
import { requireAdmin } from "../../../lib/auth.js";
import { MODULES, MODULE_ROLES, type ModuleId } from "../../../lib/shell-constants.js";
import { createInviteToken, inviteLink, shareOrigin } from "../../../lib/invite.js";
import { sendEmail } from "../../../lib/email.js";
import { invitationEmail } from "../../../lib/email-templates.js";

/**
 * Email an invitation. Never throws and never blocks the redirect: an account that was just created
 * must not look like it failed because a mail provider was slow, and the link is on the next screen
 * either way.
 */
async function emailInvitation(to: string, name: string, invitedBy: string, token: string): Promise<void> {
  try {
    const link = inviteLink(await shareOrigin(), token);
    const message = invitationEmail(name || to, invitedBy, link, 7);
    await sendEmail({ to, ...message }, "invitation");
  } catch (e) {
    console.error("[invite] could not send:", e instanceof Error ? e.message : e);
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const back = (request: NextRequest, query = ""): Response =>
  NextResponse.redirect(new URL(`/settings/access${query}`, request.url), { status: 303 });

export async function POST(request: NextRequest): Promise<Response> {
  const admin = await requireAdmin();
  const f = await request.formData();
  const action = String(f.get("action") ?? "").trim();
  const pool = db();

  if (action === "grant") {
    const staffId = String(f.get("staffId") ?? "").trim();
    const moduleId = String(f.get("module") ?? "").trim();
    const role = String(f.get("role") ?? "").trim();
    if (!staffId || !(MODULES as readonly string[]).includes(moduleId)) return back(request, "?error=module");
    if (!MODULE_ROLES[moduleId as ModuleId].includes(role)) return back(request, "?error=role");
    await pool.query(
      `INSERT INTO module_access (staff_id, module, role, granted_by) VALUES ($1,$2,$3,$4)
       ON CONFLICT (staff_id, module) DO UPDATE SET role = EXCLUDED.role, granted_by = EXCLUDED.granted_by, granted_at = now()`,
      [staffId, moduleId, role, admin.id]);
    await pool.query(
      `INSERT INTO audit_log (actor_id, action, entity, entity_id, after)
       VALUES ($1,'grant-access','module_access',$2,$3::jsonb)`,
      [admin.id, staffId, JSON.stringify({ module: moduleId, role })]);
    return back(request, "?granted=1");
  }

  if (action === "revoke") {
    const staffId = String(f.get("staffId") ?? "").trim();
    const moduleId = String(f.get("module") ?? "").trim();
    if (!staffId || !moduleId) return back(request);
    await pool.query("DELETE FROM module_access WHERE staff_id=$1 AND module=$2", [staffId, moduleId]);
    await pool.query(
      `INSERT INTO audit_log (actor_id, action, entity, entity_id, before)
       VALUES ($1,'revoke-access','module_access',$2,$3::jsonb)`,
      [admin.id, staffId, JSON.stringify({ module: moduleId })]);
    return back(request, "?revoked=1");
  }

  if (action === "invite") {
    const employeeId = String(f.get("employeeId") ?? "").trim();
    const emailRaw = String(f.get("email") ?? "").trim().toLowerCase();
    const nameRaw = String(f.get("name") ?? "").trim();

    // Invite an existing HR employee, or a brand-new person by name + email.
    let name = nameRaw;
    let email = emailRaw;
    if (employeeId) {
      const { rows } = await pool.query<{ full_name: string; work_email: string | null; personal_email: string | null }>(
        "SELECT full_name, work_email, personal_email FROM employee WHERE id=$1", [employeeId]);
      const emp = rows[0];
      if (!emp) return back(request, "?error=employee");
      name = emp.full_name;
      email = (emp.work_email ?? emp.personal_email ?? "").trim().toLowerCase();
    }
    if (!name || !email) return back(request, "?error=email");

    // Reuse an existing account for this email; otherwise create one awaiting invite acceptance.
    const { rows: existing } = await pool.query<{ id: string }>("SELECT id FROM staff WHERE email=$1", [email]);
    let staffId = existing[0]?.id;
    if (!staffId) {
      const { rows: made } = await pool.query<{ id: string }>(
        `INSERT INTO staff (name, email, password_hash, role, active, account_status)
         VALUES ($1,$2,'disabled','viewer',true,'invited') RETURNING id`, [name, email]);
      staffId = made[0]?.id;
    }
    if (!staffId) return back(request, "?error=email");
    if (employeeId) await pool.query("UPDATE employee SET staff_id=$1 WHERE id=$2", [staffId, employeeId]);

    const token = createInviteToken(staffId, email);
    await pool.query("UPDATE staff SET invite_token=$1, invite_expires=now()+interval '7 days' WHERE id=$2", [token, staffId]);
    await pool.query(
      `INSERT INTO audit_log (actor_id, action, entity, entity_id, after)
       VALUES ($1,'create','staff',$2,$3::jsonb)`,
      [admin.id, staffId, JSON.stringify({ invited: email })]);
    await emailInvitation(email, name, admin.name, token);
    // The admin still lands on the person's row, where the link is there to copy if the email does
    // not arrive or no provider is configured yet.
    return back(request, `?invited=${encodeURIComponent(staffId)}`);
  }

  if (action === "reissue") {
    const staffId = String(f.get("staffId") ?? "").trim();
    if (!staffId) return back(request);
    // Only for accounts that have not been activated. An active user changes their password, not this.
    const { rows } = await pool.query<{ email: string; name: string | null; account_status: string | null }>(
      "SELECT email, name, account_status FROM staff WHERE id=$1", [staffId]);
    const row = rows[0];
    if (!row || row.account_status === "active") return back(request, "?error=reissue");

    const token = createInviteToken(staffId, row.email);
    await pool.query("UPDATE staff SET invite_token=$1, invite_expires=now()+interval '7 days' WHERE id=$2", [token, staffId]);
    await pool.query(
      `INSERT INTO audit_log (actor_id, action, entity, entity_id, after)
       VALUES ($1,'reissue-invite','staff',$2,$3::jsonb)`,
      [admin.id, staffId, JSON.stringify({ email: row.email })]);
    await emailInvitation(row.email, row.name ?? "", admin.name, token);
    return back(request, `?invited=${encodeURIComponent(staffId)}`);
  }

  return back(request);
}
