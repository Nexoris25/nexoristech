/**
 * Set up the platform owner's account, and retire the seeded one.
 *
 * A deployment starts with an account created by `scripts/seed-admin.ts` from environment variables,
 * because something has to be able to sign in before anything exists. That account is a bootstrap,
 * not a person: its password was set outside the platform, it may be recorded in a shell history or
 * a deploy config, and it is the same for anybody who has ever read that config. Leaving it live is
 * the standing risk of every seeded system.
 *
 * So there are two actions here and they are deliberately separate. First the owner creates their
 * own account with a password only they have typed. Then, once they are signed in as that account
 * and it is demonstrably working, the seeded one is removed.
 *
 * Three refusals, each protecting against a way of locking everybody out:
 *   - you cannot retire the account you are signed in as
 *   - you cannot retire the last active administrator
 *   - you cannot retire an account that is not the seeded one, which is what the ordinary user
 *     screens are for
 *
 * Deleting the row takes the password hash with it, which is the point: there is no "disabled"
 * state that still holds a credential somebody set outside the platform.
 */
import type { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "../../../lib/db.js";
import { requireStaff } from "../../../lib/auth.js";
import { seeOther } from "../../../lib/redirect.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIN_PASSWORD = 12;

/** The address the deployment seeded, read at runtime and never written into the source. */
function seededEmail(): string {
  return (process.env.ADMIN_SEED_EMAIL ?? "").trim().toLowerCase();
}

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await requireStaff();
  if (staff.role !== "admin") {
    return seeOther("/dashboard");
  }

  const f = await request.formData();
  const action = String(f.get("action") ?? "");
  const back = (q: string): Response =>
    seeOther(`/settings/owner${q}`);
  const fail = (msg: string): Response => back(`?error=1&msg=${encodeURIComponent(msg)}`);

  const pool = db();

  if (action === "create") {
    const name = String(f.get("name") ?? "").trim();
    const email = String(f.get("email") ?? "").trim().toLowerCase();
    const password = String(f.get("password") ?? "");
    const confirm = String(f.get("confirm") ?? "");

    if (!name) return fail("Enter the account holder's name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Enter a valid email address.");
    if (password.length < MIN_PASSWORD) {
      return fail(`Use a password of at least ${MIN_PASSWORD} characters.`);
    }
    if (password !== confirm) return fail("The two passwords do not match.");
    if (email === seededEmail()) {
      return fail("Use a different address from the seeded account. The point is to replace it.");
    }

    const hash = await bcrypt.hash(password, 10);
    // An existing account for this address is upgraded rather than duplicated: two rows for one
    // person is how somebody ends up locked out of the half they are not signed in to.
    const { rows } = await pool.query<{ id: string }>(
      `INSERT INTO staff (name, email, password_hash, role, active, account_status)
       VALUES ($1,$2,$3,'admin',true,'active')
       ON CONFLICT (email) DO UPDATE
         SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash,
             role = 'admin', active = true, account_status = 'active'
       RETURNING id`,
      [name, email, hash],
    );
    const id = rows[0]?.id;
    await pool
      .query(
        "INSERT INTO audit_log (actor_id, action, entity, entity_id, after) VALUES ($1,'owner-account-set','staff',$2,$3::jsonb)",
        [staff.id, id ?? null, JSON.stringify({ email, role: "admin" })],
      )
      .catch(() => undefined);
    return back(`?created=${encodeURIComponent(email)}`);
  }

  if (action === "retire") {
    const id = String(f.get("id") ?? "").trim();
    const seeded = seededEmail();
    if (!seeded) {
      return fail("No seeded account is configured, so there is nothing to retire.");
    }

    const { rows } = await pool.query<{ id: string; email: string }>(
      "SELECT id, email FROM staff WHERE id=$1",
      [id],
    );
    const target = rows[0];
    if (!target) return fail("That account no longer exists.");
    if (target.email.toLowerCase() !== seeded) {
      return fail("That is not the seeded account. Ordinary accounts are managed under People and Access.");
    }
    if (target.id === staff.id) {
      return fail("You are signed in as the seeded account. Sign in as your own account first, then retire this one.");
    }

    const { rows: others } = await pool.query<{ n: string }>(
      "SELECT count(*)::text n FROM staff WHERE role='admin' AND active AND id <> $1",
      [target.id],
    );
    if (Number(others[0]?.n ?? "0") === 0) {
      return fail("This is the last active administrator. Create your own admin account first.");
    }

    // Sessions go with the account: a live session would otherwise outlive the credential it was
    // issued against.
    await pool.query("DELETE FROM staff_session WHERE staff_id=$1", [target.id]).catch(() => undefined);
    await pool.query("DELETE FROM staff WHERE id=$1", [target.id]);
    await pool
      .query(
        "INSERT INTO audit_log (actor_id, action, entity, entity_id, before) VALUES ($1,'seed-account-retired','staff',$2,$3::jsonb)",
        [staff.id, target.id, JSON.stringify({ email: target.email })],
      )
      .catch(() => undefined);
    return back("?retired=1");
  }

  return back("");
}
