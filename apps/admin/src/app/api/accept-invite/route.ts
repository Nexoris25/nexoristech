/**
 * Completes an invitation: verifies the one-time token, sets the invitee's password, activates the
 * account, and clears the token so the link cannot be reused. Native POST (works behind the framed
 * preview's Origin: null). On success it sends the user to sign in; the modules they can see are decided
 * by their role and their module_access grants, so a CMS-only invitee sees only the CMS.
 */
import type { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "../../../lib/db.js";
import { verifyInviteToken } from "../../../lib/invite.js";
import { securityPolicy, passwordProblem } from "../../../lib/security-policy.js";
import { issueRecoveryCodes } from "../../../lib/recovery-codes.js";
import { seeOther } from "../../../lib/redirect.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  const f = await request.formData();
  const token = String(f.get("token") ?? "");
  const password = String(f.get("password") ?? "");
  const confirm = String(f.get("confirm") ?? "");
  const back = `/accept-invite?token=${encodeURIComponent(token)}`;

  const payload = verifyInviteToken(token);
  if (!payload) return seeOther("/accept-invite");
  // The configured policy, not a hardcoded eight characters. Global Settings said twelve with a symbol
  // and this accepted "password" regardless.
  // The reason travels with the redirect. It used to be thrown away for a bare `error=weak`, and the
  // page then rendered a fixed "Use at least 8 characters" while the policy required twelve and a
  // symbol. Someone typing a ten-character password was told to use eight, typed nine, and was
  // refused again with the same sentence: the screen was describing a rule the server did not apply.
  const problem = passwordProblem(password, await securityPolicy());
  if (problem) {
    return seeOther(`${back}&error=weak&why=${encodeURIComponent(problem)}`);
  }
  if (password !== confirm) return seeOther(`${back}&error=mismatch`);

  const pool = db();
  // The token must still match the row (guards against reuse and re-issued invites).
  const { rows } = await pool.query<{ id: string }>(
    "SELECT id FROM staff WHERE id=$1 AND email=$2 AND invite_token=$3", [payload.sub, payload.email, token]);
  if (!rows[0]) return seeOther("/accept-invite");

  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    "UPDATE staff SET password_hash=$1, account_status='active', active=true, invite_token=NULL, invite_expires=NULL WHERE id=$2",
    [hash, payload.sub]);

  /*
   * Recovery codes, issued here because this is the one moment the person is definitely present and
   * definitely themselves. Handing them out later means catching somebody who has no reason to care
   * yet; handing them out now costs one extra screen at the point where they are already setting up.
   *
   * Failing to issue them must not fail the activation. The account works either way, and somebody
   * whose password was accepted and who was then shown an error would have no idea whether they can
   * sign in. They can ask an administrator for a reset link, which is the fallback anyway.
   */
  let codes: string[] = [];
  try {
    codes = await issueRecoveryCodes(payload.sub);
  } catch (e) {
    console.error(`[recovery] could not issue codes on activation: ${e instanceof Error ? e.message : String(e)}`);
  }

  if (codes.length === 0) return seeOther("/login?accepted=1");

  // Shown once, on the next screen, and never again. They travel in the URL fragment rather than the
  // query so they are not sent to the server on that request and do not reach any access log.
  return seeOther(`/recovery-codes#codes=${encodeURIComponent(codes.join(","))}`);
}
