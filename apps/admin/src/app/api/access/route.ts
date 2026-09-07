/**
 * People & Access mutations (PRD 3.2) as a route handler with native form posts, so granting works
 * everywhere the dashboard runs (Server Actions are rejected when the app is framed and the browser
 * sends `Origin: null`). Three actions:
 *   grant   - give a person a module + role (upsert into the one access table every check reads)
 *   revoke  - remove a module grant
 *   invite  - create the login account for someone onboarded in HR and issue a link they follow to set
 *             their own password, linking employee.staff_id so the HR record and the login are the same
 *             person. The link is emailed, and it is also on the access screen to copy: the email is
 *             the route in, the copyable link is what makes an unconfigured or failing provider a
 *             delay rather than a lockout. This path is module-agnostic by design, so somebody who
 *             will only ever open Finance or HR is invited exactly like an editor.
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
import { invitationEmail, passwordResetEmail } from "../../../lib/email-templates.js";
import { createResetToken, resetLink, RESET_MAX_AGE_MINUTES } from "../../../lib/reset.js";

/**
 * Email an invitation. Never throws and never blocks the redirect: an account that was just created
 * must not look like it failed because a mail provider was slow, and the link is on the next screen
 * either way.
 *
 * It does report what happened, though. Silently returning void meant the screen said the same thing
 * whether the invitation had been delivered or had never left the building, so "the invite is not
 * sending" was invisible from the one page an admin was looking at.
 */
/**
 * Three outcomes, not two.
 *
 * "Nobody configured a mail provider" and "the provider was asked and refused" were both reported as
 * `not-sent`, so the screen showed the same red "the invitation email could not be sent" warning in
 * both cases. On a deployment that deliberately hands invitation links over by hand — which is how
 * this platform is run — that warning appeared on every single invitation, describing a fault that
 * did not exist, and taught whoever saw it to ignore a message that also reports real failures.
 *
 * `not-configured` is now its own outcome and reads as the ordinary path. `failed` still warns,
 * because a provider that was set up and then stopped working is worth knowing about.
 */
type Delivery = "sent" | "not-configured" | "failed";

async function emailInvitation(to: string, name: string, invitedBy: string, token: string): Promise<Delivery> {
  try {
    const link = inviteLink(await shareOrigin(), token);
    const message = invitationEmail(name || to, invitedBy, link, 7);
    const result = await sendEmail({ to, ...message }, "invitation");
    if (result.status === "sent") return "sent";
    return result.status === "not-configured" ? "not-configured" : "failed";
  } catch (e) {
    console.error("[invite] could not send:", e instanceof Error ? e.message : e);
    return "failed";
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
      // The address on the HR record, or the one typed alongside the picker when that record has
      // none. The list offers employees marked "(no email on record)" and this used to reject them
      // with a bare error, so the people most likely to need a platform-only login were the ones who
      // could not be given one.
      email = (emp.work_email ?? emp.personal_email ?? "").trim().toLowerCase() || emailRaw;
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
    const delivery = await emailInvitation(email, name, admin.name, token);
    // The admin still lands on the person's row, where the link is there to copy if the email does
    // not arrive or no provider is configured yet. The screen now says which of those happened.
    return back(request, `?invited=${encodeURIComponent(staffId)}&mail=${delivery}`);
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
    const delivery = await emailInvitation(row.email, row.name ?? "", admin.name, token);
    return back(request, `?invited=${encodeURIComponent(staffId)}&mail=${delivery}`);
  }

  /*
   * Start someone else's password reset, rather than choosing a password for them.
   *
   * The same mechanism as /forgot-password, including the rule that matters: the link is sent to the
   * address on the staff record and never to one supplied in this request. An admin can start the
   * flow; only the person holding the mailbox can finish it.
   */
  if (action === "send-reset") {
    const staffId = String(f.get("staffId") ?? "").trim();
    if (!staffId) return back(request);
    const { rows } = await pool.query<{ id: string; name: string; email: string }>(
      "SELECT id, name, email FROM staff WHERE id=$1 AND active = true", [staffId]);
    const person = rows[0];
    if (!person) return back(request, "?error=reset");

    const token = createResetToken(person.id, person.email);
    // The stored copy is what makes it single-use; the signature alone keeps verifying until expiry.
    await pool.query(
      "UPDATE staff SET reset_token=$1, reset_expires=now() + ($2 || ' minutes')::interval WHERE id=$3",
      [token, String(RESET_MAX_AGE_MINUTES), person.id]);

    const link = resetLink(await shareOrigin(), token);
    const message = passwordResetEmail(person.name, link, RESET_MAX_AGE_MINUTES);
    const result = await sendEmail({ to: person.email, ...message }, "password reset");

    await pool.query(
      `INSERT INTO audit_log (actor_id, action, entity, entity_id, after)
       VALUES ($1,'send-reset-link','staff',$2,$3::jsonb)`,
      // What was done, not what the password became: nobody here chose one. The link is not recorded
      // either, because the audit log is read by more people than may use it.
      [admin.id, person.id, JSON.stringify({ delivered: result.status === "sent" })]);

    /*
     * When it could not be emailed, hand the link back so the admin can pass it on.
     *
     * Marking the outstanding request resolved is what keeps the queue honest: the person asked, the
     * admin acted, and the row should stop looking like it still needs attention.
     *
     * The token is in the URL, which is the same place the invitation link already appears on this
     * screen. It is single-use and lives thirty minutes, and it is only ever produced for an admin who
     * has just been authorised to produce it.
     */
    await pool.query(
      "UPDATE password_reset_request SET status='resolved', resolved_at=now(), resolved_by=$1 WHERE staff_id=$2 AND status='open'",
      [admin.id, person.id]);

    if (result.status === "sent") return back(request, "?reset=sent");
    return back(request, `?resetlink=${encodeURIComponent(link)}&resetfor=${encodeURIComponent(person.name)}`);
  }

  return back(request);
}
