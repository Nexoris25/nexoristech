/**
 * Reset-password screen. Opened from the link in the reset email. It verifies the one-time token
 * (signature, expiry, and a match against the token stored on the staff row) and shows a set-password
 * form. Invalid, expired and already-used links all show the same clear message.
 *
 * Public route — there is no session yet. The form posts natively to /api/reset-password, matching the
 * rest of the auth screens, which post rather than using Server Actions so they survive Origin: null.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { KeyRound, AlertTriangle } from "lucide-react";
import { db } from "../../lib/db.js";
import { verifyResetToken } from "../../lib/reset.js";
import { PasswordInput } from "../../components/auth/PasswordInput.js";
import { securityPolicy, passwordRule } from "../../lib/security-policy.js";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string; why?: string }>;
}): Promise<ReactNode> {
  const { token, error, why } = await searchParams;
  // The rule as configured, so the page cannot describe one the server does not apply.
  const rule = passwordRule(await securityPolicy());
  const payload = verifyResetToken(token);

  let valid = false;
  let name = "";
  if (payload) {
    const { rows } = await db().query<{ name: string; reset_token: string | null; active: boolean }>(
      "SELECT name, reset_token, active FROM staff WHERE id = $1 AND email = $2",
      [payload.sub, payload.email],
    );
    const row = rows[0];
    // The token must still be the one on the row: a spent or superseded link stops here.
    if (row && row.reset_token === token && row.active) {
      valid = true;
      name = row.name;
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-subtle sm:p-8">
        <div className="flex items-center gap-2.5">
          <img src="/logo-mark-purple.png" alt="Nexoris Technologies" className="h-9 w-9 object-contain" />
          <span className="font-roboto text-[1.05rem] font-700 leading-none text-slate-900">
            Nexoris
            <span className="mt-1 block font-mono text-[0.52rem] font-500 tracking-[0.24em] text-slate-500">
              TECHNOLOGIES
            </span>
          </span>
        </div>

        {valid ? (
          <>
            <div className="mt-6 flex items-center gap-2 text-[#543CDA]">
              <KeyRound size={18} />
              <h1 className="text-[1.15rem] font-700 text-slate-900">Choose a new password</h1>
            </div>
            <p className="mt-1.5 text-[0.86rem] text-slate-500">
              {name ? `${name.split(/\s+/)[0]}, pick` : "Pick"} a new password for your Nexoris
              Technologies account. This link stops working once you use it.
            </p>

            {error === "mismatch" ? (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[0.8rem] font-600 text-red-600">
                The two passwords did not match.
              </p>
            ) : null}
            {error === "weak" ? (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[0.8rem] font-600 text-red-600">
                {why || rule}
              </p>
            ) : null}
            {error === "expired" ? (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[0.8rem] font-600 text-red-600">
                This link has expired. Request a new one from the sign-in page.
              </p>
            ) : null}

            <form action="/api/reset-password" method="post" className="mt-5 flex flex-col gap-4">
              <input type="hidden" name="token" value={token} />
              <label className="flex flex-col gap-1.5">
                <span className="text-[0.82rem] font-600 text-slate-700">New password</span>
                <PasswordInput name="password" placeholder={rule} autoComplete="new-password" showStrength />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[0.82rem] font-600 text-slate-700">Confirm password</span>
                <PasswordInput name="confirm" placeholder="Re-enter your password" autoComplete="new-password" />
              </label>
              <button
                type="submit"
                className="mt-1 rounded-lg bg-[#543CDA] px-6 py-2.5 text-[0.88rem] font-600 text-white hover:bg-[#4330B8]"
              >
                Save new password
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="mt-6 flex items-center gap-2 text-[#B45309]">
              <AlertTriangle size={18} />
              <h1 className="text-[1.15rem] font-700 text-slate-900">This reset link is not valid</h1>
            </div>
            {/* One message for expired, used and forged links alike: distinguishing them would confirm
                which accounts exist and which links were real. */}
            <p className="mt-1.5 text-[0.86rem] text-slate-500">
              The link may have expired, already been used, or been replaced by a newer one. Request a
              fresh one from the sign-in page.
            </p>
            <Link
              href="/forgot-password"
              className="mt-5 inline-block rounded-lg bg-[#543CDA] px-5 py-2.5 text-[0.85rem] font-600 text-white hover:bg-[#4330B8]"
            >
              Request a new link
            </Link>
            <Link
              href="/login"
              className="mt-5 ml-2 inline-block rounded-lg border border-slate-200 px-5 py-2.5 text-[0.85rem] font-600 text-slate-700 hover:bg-slate-50"
            >
              Go to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
