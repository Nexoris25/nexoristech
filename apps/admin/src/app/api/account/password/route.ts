/**
 * Change your own password.
 *
 * There was no way to. An administrator could send somebody a reset link, but nobody — including
 * the administrator — could simply change their own, which means the password set when an account
 * was created is the password it keeps. Every account here can do this, whatever it can otherwise
 * see: a password is not a permission, it is the thing standing between an account and everyone
 * else, and gating its replacement behind a role is how weak ones survive.
 *
 * The current password is required. Without it, an unattended session is a password change, and
 * from there an account somebody else keeps.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "../../../../lib/db.js";
import { requireStaff } from "../../../../lib/auth.js";
import { revokeOtherSessions } from "../../../../lib/sessions.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIN_LENGTH = 12;

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await requireStaff();
  const f = await request.formData();
  const back = (q: string): Response =>
    NextResponse.redirect(new URL(`/account${q}`, request.url), { status: 303 });
  const fail = (msg: string): Response => back(`?error=1&msg=${encodeURIComponent(msg)}`);

  const current = String(f.get("current") ?? "");
  const next = String(f.get("next") ?? "");
  const confirm = String(f.get("confirm") ?? "");

  if (!current) return fail("Enter your current password.");
  if (next.length < MIN_LENGTH) return fail(`Use a new password of at least ${MIN_LENGTH} characters.`);
  if (next !== confirm) return fail("The two new passwords do not match.");
  if (next === current) return fail("The new password is the same as the current one.");

  const pool = db();
  const row = (
    await pool.query<{ password_hash: string }>("SELECT password_hash FROM staff WHERE id=$1", [staff.id])
  ).rows[0];
  if (!row) return fail("That account no longer exists.");

  // An account created by invitation has no usable password yet; it is set through the invite, not
  // here, and saying so is more use than "incorrect password".
  if (row.password_hash === "disabled") {
    return fail("This account has no password yet. Use the invitation link to set one.");
  }
  if (!(await bcrypt.compare(current, row.password_hash))) {
    return fail("That is not your current password.");
  }

  const hash = await bcrypt.hash(next, 10);
  await pool.query("UPDATE staff SET password_hash=$1 WHERE id=$2", [hash, staff.id]);

  /*
   * Every other session for this account ends.
   *
   * Somebody changing a password often does it because they think someone else has it. Leaving
   * those sessions signed in would make the change cosmetic. The current one is kept so the change
   * does not sign the person out of the screen they are standing on.
   */
  await revokeOtherSessions(staff.id, staff.sessionId).catch(() => undefined);

  await pool
    .query(
      "INSERT INTO audit_log (actor_id, action, entity, entity_id, after) VALUES ($1,'password-changed','staff',$2,'{}'::jsonb)",
      [staff.id, staff.id],
    )
    .catch(() => undefined);

  return back("?changed=1");
}
