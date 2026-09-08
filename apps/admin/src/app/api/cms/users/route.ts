/**
 * Create or update a CMS user (admin database: staff + the CMS module grant). CMS access only. Creating a
 * user adds a staff row (invited or active) and grants the CMS module with the chosen role. Super Admin
 * maps to the admin base role (implicit full access, no grant); every other role is a CMS-only grant.
 */
import type { NextRequest } from "next/server";
import { db } from "../../../../lib/db.js";
import { getCmsStaffFor } from "../../../../lib/auth.js";
import { createInviteToken, inviteLink, shareOrigin } from "../../../../lib/invite.js";
import { sendEmail } from "../../../../lib/email.js";
import { invitationEmail } from "../../../../lib/email-templates.js";
import { seeOther } from "../../../../lib/redirect.js";

/** Email an invitation. Never throws and never blocks the redirect; see the People & Access route. */
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

const STATUSES = new Set(["active", "invited", "suspended"]);

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getCmsStaffFor("admin.manage");
  if (!staff) return seeOther("/cms/admin/users");
  const f = await request.formData();
  const id = String(f.get("id") ?? "").trim();
  const first = String(f.get("first_name") ?? "").trim();
  const last = String(f.get("last_name") ?? "").trim();
  const email = String(f.get("email") ?? "").trim().toLowerCase();
  const cmsRole = String(f.get("role") ?? "Editor").trim() || "Editor";
  const department = String(f.get("department") ?? "").trim() || null;
  const name = `${first} ${last}`.trim() || first;
  const baseRole = cmsRole === "Super Admin" ? "admin" : "viewer";
  const pool = db();

  if (id) {
    const statusRaw = String(f.get("status") ?? "active").trim();
    const status = STATUSES.has(statusRaw) ? statusRaw : "active";
    await pool.query(
      "UPDATE staff SET name=$1, cms_department=$2, account_status=$3, active=$4, role=$5 WHERE id=$6",
      [name, department, status, status !== "suspended", baseRole, id]);
    if (cmsRole === "Super Admin") {
      await pool.query("DELETE FROM module_access WHERE staff_id=$1 AND module='cms'", [id]);
    } else {
      await pool.query(
        `INSERT INTO module_access (staff_id, module, role, granted_by) VALUES ($1,'cms',$2,$3)
         ON CONFLICT (staff_id, module) DO UPDATE SET role = EXCLUDED.role`, [id, cmsRole, staff.id]);
    }
    return seeOther(`/cms/admin/users/${id}`);
  }

  if (!first || !email) return seeOther("/cms/admin/users/new?error=required");
  const status = f.get("send_invite") != null ? "invited" : "active";
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO staff (name, email, password_hash, role, active, cms_department, account_status)
     VALUES ($1,$2,'disabled',$3,true,$4,$5)
     ON CONFLICT (email) DO NOTHING RETURNING id`,
    [name, email, baseRole, department, status]);
  const newId = rows[0]?.id;
  if (!newId) return seeOther("/cms/admin/users/new?error=email_exists");
  if (cmsRole !== "Super Admin") {
    await pool.query("INSERT INTO module_access (staff_id, module, role, granted_by) VALUES ($1,'cms',$2,$3)", [newId, cmsRole, staff.id]);
  }

  // Issue the invitation: store a one-time token on the row and email the link to the person it is
  // for. The link also stays on the user's page for an admin to copy, which is the fallback when no
  // mail provider is configured. A CMS-only user only ever gets the 'cms' grant above, so after
  // setting a password they can reach only the CMS.
  if (status === "invited") {
    const token = createInviteToken(newId, email);
    await pool.query("UPDATE staff SET invite_token=$1, invite_expires=now()+interval '7 days' WHERE id=$2", [token, newId]);
    await emailInvitation(email, name, staff.name, token);
    return seeOther(`/cms/admin/users/${newId}?invited=1`);
  }
  return seeOther(`/cms/admin/users/${newId}`);
}
