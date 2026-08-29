/**
 * Completes a password reset: verifies the one-time token, sets the new password, clears the token so
 * the link cannot be reused, and revokes every existing session for that account.
 *
 * Revoking sessions is the part that is easy to leave out and matters most. Someone resetting a
 * password is often doing it because they think someone else has it. Leaving that other party signed in
 * makes the reset ceremonial.
 *
 * Native POST, matching the other auth screens, so it works behind the framed preview's Origin: null.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "../../../lib/db.js";
import { verifyResetToken } from "../../../lib/reset.js";
import { securityPolicy, passwordProblem } from "../../../lib/security-policy.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  const f = await request.formData();
  const token = String(f.get("token") ?? "");
  const password = String(f.get("password") ?? "");
  const confirm = String(f.get("confirm") ?? "");
  const back = `/reset-password?token=${encodeURIComponent(token)}`;

  const payload = verifyResetToken(token);
  // No token, or an expired one: the page's own invalid state explains it without saying which.
  if (!payload) return NextResponse.redirect(new URL("/reset-password", request.url), { status: 303 });

  // The configured policy, not a hardcoded minimum — the same rule the invitation flow applies.
  // The reason travels with the redirect. It used to be thrown away for a bare `error=weak`, and the
  // page then rendered a fixed "Use at least 8 characters" while the policy required twelve and a
  // symbol. Someone typing a ten-character password was told to use eight, typed nine, and was
  // refused again with the same sentence: the screen was describing a rule the server did not apply.
  const problem = passwordProblem(password, await securityPolicy());
  if (problem) {
    return NextResponse.redirect(
      new URL(`${back}&error=weak&why=${encodeURIComponent(problem)}`, request.url),
      { status: 303 },
    );
  }
  if (password !== confirm) {
    return NextResponse.redirect(new URL(`${back}&error=mismatch`, request.url), { status: 303 });
  }

  const pool = db();
  // The token must still be the one on the row, and still inside its window. Checking the expiry in
  // SQL as well as in the signature means a token cannot outlive the database's own record of it.
  const { rows } = await pool.query<{ id: string }>(
    `SELECT id FROM staff
      WHERE id = $1 AND email = $2 AND reset_token = $3
        AND reset_expires IS NOT NULL AND reset_expires > now() AND active = true`,
    [payload.sub, payload.email, token],
  );
  if (!rows[0]) return NextResponse.redirect(new URL("/reset-password", request.url), { status: 303 });

  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    `UPDATE staff SET password_hash = $1, reset_token = NULL, reset_expires = NULL,
            account_status = 'active'
      WHERE id = $2`,
    [hash, payload.sub],
  );

  // Every session that existed before this moment belonged to whoever held the old password.
  await pool
    .query("UPDATE staff_session SET revoked_at = now() WHERE staff_id = $1 AND revoked_at IS NULL", [payload.sub])
    .catch((e: unknown) => {
      // A reset that succeeded must not report failure because the session sweep did. Logged so an
      // operator can revoke by hand if it ever happens.
      console.error("[auth] reset succeeded but session revocation failed:", e instanceof Error ? e.message : e);
    });

  // Close out any open request in the queue, so the list reflects reality.
  await pool
    .query(
      `UPDATE password_reset_request SET status = 'resolved', resolved_at = now()
        WHERE staff_id = $1 AND status = 'open'`,
      [payload.sub],
    )
    .catch(() => undefined);

  return NextResponse.redirect(new URL("/login?reset=1", request.url), { status: 303 });
}
