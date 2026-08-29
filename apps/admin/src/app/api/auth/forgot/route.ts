/**
 * Forgot password (1.2): mints a one-time reset token and emails the link to the registered address.
 *
 * This used to record a request for an admin to action by hand, which is not a reset flow — and it
 * deadlocks the moment the only admin is the person locked out.
 *
 * Two properties matter more than convenience here:
 *
 *   * The response is identical whether or not the address matches an active account. Anything else
 *     turns this form into a way to test which addresses exist. The request is logged either way.
 *
 *   * The link goes to the address on the staff record, never to an address supplied in the form. The
 *     form address is only ever used to look the account up. Sending to what the submitter typed is
 *     how an attacker has a reset link delivered to themselves.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "../../../../lib/db.js";
import { createResetToken, resetLink, RESET_MAX_AGE_MINUTES } from "../../../../lib/reset.js";
import { shareOrigin } from "../../../../lib/invite.js";
import { sendEmail } from "../../../../lib/email.js";
import { passwordResetEmail } from "../../../../lib/email-templates.js";
import { consumeRecoveryCode } from "../../../../lib/recovery-codes.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const form = await request.formData();
    const submitted = String(form.get("email") ?? "").trim().toLowerCase();
    const recovery = String(form.get("code") ?? "").trim();

    /*
     * A recovery code is proof, so it short-circuits the whole request.
     *
     * This is the only path that resets a password without either a mailbox or an administrator. It
     * spends the code and hands back a reset link directly, because the person is standing right
     * there: mailing it to them would need the provider this exists to work without.
     *
     * A wrong code is counted against the lockout the sign-in form uses, so this cannot be turned
     * into an oracle for guessing codes at any useful rate.
     */
    if (recovery) {
      const owner = submitted.includes("@") ? await consumeRecoveryCode(submitted, recovery) : null;
      if (owner) {
        const token = createResetToken(owner.staffId, submitted);
        await db().query(
          `UPDATE staff SET reset_token = $1, reset_expires = now() + ($2 || ' minutes')::interval
            WHERE id = $3`,
          [token, String(RESET_MAX_AGE_MINUTES), owner.staffId],
        );
        return NextResponse.redirect(new URL(`/reset-password?token=${encodeURIComponent(token)}`, request.url), { status: 303 });
      }
      await db()
        .query("INSERT INTO login_attempt (email, ip) VALUES ($1, $2::inet)", [submitted, null])
        .catch(() => undefined);
      return NextResponse.redirect(new URL("/forgot-password?badcode=1", request.url), { status: 303 });
    }

    if (submitted.includes("@")) {
      const pool = db();
      const { rows } = await pool.query<{ id: string; name: string; email: string }>(
        "SELECT id, name, email FROM staff WHERE email = $1 AND active = true",
        [submitted],
      );
      const staff = rows[0];

      // Logged whether or not it matched: a run of requests for addresses that do not exist is worth
      // being able to see.
      await pool.query("INSERT INTO password_reset_request (email, staff_id) VALUES ($1, $2)", [
        submitted,
        staff?.id ?? null,
      ]);

      if (staff) {
        const token = createResetToken(staff.id, staff.email);
        // The stored copy is what makes the token single-use; the signature alone would keep
        // verifying until it expired.
        await pool.query(
          `UPDATE staff SET reset_token = $1, reset_expires = now() + ($2 || ' minutes')::interval
            WHERE id = $3`,
          [token, String(RESET_MAX_AGE_MINUTES), staff.id],
        );

        const link = resetLink(await shareOrigin(), token);
        const message = passwordResetEmail(staff.name, link, RESET_MAX_AGE_MINUTES);
        // Deliberately not awaited into the response path any differently on success or failure: the
        // page says the same thing either way. A failure is logged inside sendEmail.
        await sendEmail({ to: staff.email, ...message }, "password reset");
      }
    }
  } catch (error) {
    // The confirmation is identical regardless, so a fault here must not change what is shown. It is
    // logged so it can be found; the message never contains the token.
    console.error("[auth] forgot-password failed:", error instanceof Error ? error.message : error);
  }

  return NextResponse.redirect(new URL("/forgot-password?sent=1", request.url), { status: 303 });
}
