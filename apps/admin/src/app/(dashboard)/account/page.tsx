/**
 * Your own account.
 *
 * There was nowhere to change your own password. An administrator could send somebody a reset link,
 * but nobody could change their own, so whatever was set when an account was created is what it
 * kept. This page is reachable by every signed-in account whatever else it can see: a password is
 * not a permission.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { KeyRound, ShieldCheck } from "lucide-react";
import { requireStaff } from "../../../lib/auth.js";

export const dynamic = "force-dynamic";

const field =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[0.85rem] text-slate-900 outline-none focus:border-[#543CDA] focus:ring-2 focus:ring-[#543CDA]/15";
const lbl = "block text-[0.75rem] font-600 text-slate-600";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; msg?: string; changed?: string }>;
}): Promise<ReactNode> {
  const staff = await requireStaff();
  const { error, msg, changed } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-[1.4rem] font-700 text-slate-900">Your account</h1>
      <p className="mt-1 text-[0.88rem] text-slate-500">
        Signed in as <b className="text-slate-700">{staff.name}</b>.
      </p>

      {error ? (
        <p className="mt-4 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-[0.85rem] text-[#B91C1C]">
          {msg ?? "That could not be done."}
        </p>
      ) : null}
      {changed ? (
        <p className="mt-4 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-[0.85rem] text-green-700">
          <ShieldCheck size={16} className="mt-0.5 shrink-0" />
          Your password has been changed. Any other session signed in as you has been ended; this one
          is still yours.
        </p>
      ) : null}

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
        <h2 className="flex items-center gap-2 text-[0.95rem] font-700 text-slate-900">
          <KeyRound size={16} className="text-[#543CDA]" /> Change your password
        </h2>
        <p className="mt-1 text-[0.8rem] text-slate-500">
          Your current password is required, so that an unattended session cannot be turned into
          somebody else&apos;s account. Changing it signs out every other session you have.
        </p>
        <form action="/api/account/password" method="post" className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={lbl} htmlFor="current">Current password</label>
            <input id="current" name="current" type="password" required autoComplete="current-password" className={`mt-1 ${field}`} />
          </div>
          <div>
            <label className={lbl} htmlFor="next">New password</label>
            <input id="next" name="next" type="password" required minLength={12} autoComplete="new-password" className={`mt-1 ${field}`} />
            <span className="mt-1 block text-[0.72rem] text-slate-500">At least 12 characters.</span>
          </div>
          <div>
            <label className={lbl} htmlFor="confirm">Confirm new password</label>
            <input id="confirm" name="confirm" type="password" required minLength={12} autoComplete="new-password" className={`mt-1 ${field}`} />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="rounded-lg bg-[#543CDA] px-5 py-2.5 text-[0.85rem] font-600 text-white hover:bg-[#4330B8]">
              Change password
            </button>
          </div>
        </form>
      </section>

      <p className="mt-4 text-[0.83rem] text-slate-500">
        Signed in somewhere you do not recognise?{" "}
        <Link href="/users/sessions" className="font-600 text-[#543CDA] hover:underline">
          Review your active sessions
        </Link>
        .
      </p>
    </div>
  );
}
