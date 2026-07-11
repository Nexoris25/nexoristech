"use client";
/**
 * Forgot password. No mail service is wired in this phase, so the request is recorded for an
 * Admin, who resets the password from the People screen. The confirmation is identical whether or
 * not the email matches a staff account, so the form cannot be used to probe which emails exist.
 */
import type { ReactNode } from "react";
import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import {
  requestPasswordReset,
  type ForgotPasswordState,
} from "../../lib/auth-actions.js";

const initialState: ForgotPasswordState = {};

export default function ForgotPasswordPage(): ReactNode {
  const [state, action, pending] = useActionState(
    requestPasswordReset,
    initialState,
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-card bg-ink-950">
            <img src="/logo-mark-white.png" alt="" className="h-6 w-auto" />
          </span>
          <span className="font-roboto text-subhead font-700 leading-tight text-ink-950">
            Nexoris Technologies
          </span>
        </div>

        <div className="rounded-card border border-purple-200 bg-white p-6 shadow-medium sm:p-10">
          {state.done ? (
            <>
              <h1 className="font-roboto text-dash-title font-700 text-ink-950">
                Request received
              </h1>
              <p className="mt-3 text-label leading-relaxed text-neutral-600">
                If that email belongs to a staff account, an administrator has
                been notified and will reset your password. You will get your
                new sign-in details directly from them.
              </p>
              <Link
                href="/login"
                className="mt-8 inline-flex cursor-pointer items-center gap-2 text-label font-600 text-purple-600 hover:text-purple-700"
              >
                <ArrowLeft size={15} strokeWidth={2} />
                Back to sign in
              </Link>
            </>
          ) : (
            <>
              <h1 className="font-roboto text-dash-title font-700 text-ink-950">
                Forgot your password?
              </h1>
              <p className="mt-1 text-label text-neutral-600">
                Enter the email you sign in with and an administrator will
                reset it for you.
              </p>

              <form action={action} className="mt-8 flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="email"
                    className="text-label font-600 text-ink-950"
                  >
                    Work email
                  </label>
                  <div className="relative">
                    <Mail
                      size={16}
                      strokeWidth={2}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-600"
                      aria-hidden="true"
                    />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="username"
                      required
                      placeholder="you@nexoristech.com"
                      className="w-full rounded-card border border-neutral-200 bg-white py-3 pl-10 pr-3 text-dash-data text-ink-950 placeholder:text-neutral-600/60 focus:border-purple-500"
                    />
                  </div>
                </div>

                {state.error ? (
                  <p
                    className="rounded-card border border-purple-200 bg-purple-100 px-4 py-3 text-label text-ink-950"
                    role="alert"
                  >
                    {state.error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={pending}
                  className="cursor-pointer rounded-card bg-purple-600 py-3.5 text-label font-600 text-white shadow-subtle transition-colors hover:bg-purple-700 disabled:opacity-60"
                >
                  {pending ? "Sending" : "Request a reset"}
                </button>

                <Link
                  href="/login"
                  className="inline-flex cursor-pointer items-center gap-2 text-label font-600 text-purple-600 hover:text-purple-700"
                >
                  <ArrowLeft size={15} strokeWidth={2} />
                  Back to sign in
                </Link>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
