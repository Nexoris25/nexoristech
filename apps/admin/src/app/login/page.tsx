"use client";
/**
 * The admin sign-in page. A premium two-panel layout: a dark brand panel carrying the Nexoris
 * Technologies lockup, the team photograph, and the platform line; and the sign-in form with
 * "keep me signed in" and the forgot-password path. Single column below lg, correct down to 360px.
 */
import type { ReactNode } from "react";
import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { signIn, type SignInState } from "../../lib/auth-actions.js";

const initialState: SignInState = {};

export default function LoginPage(): ReactNode {
  const [state, action, pending] = useActionState(signIn, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* Brand panel */}
      <aside className="relative hidden w-[46%] overflow-hidden bg-ink-950 lg:block">
        <img
          src="/login-side.webp"
          alt="The Nexoris Technologies team working together in the office"
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, rgba(13,10,28,.55) 0%, rgba(84,60,218,.42) 55%, rgba(13,10,28,.9) 100%)",
          }}
        />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <img src="/logo-mark-white.png" alt="" className="h-9 w-auto" />
            <span className="font-roboto text-[1.15rem] font-700 leading-tight text-white">
              Nexoris{" "}
              <span className="font-mono text-[0.65rem] font-500 tracking-[.14em] text-purple-100">
                TECHNOLOGIES
              </span>
            </span>
          </div>
          <div>
            <h1 className="max-w-md font-roboto text-[2rem] font-700 leading-tight text-white">
              One platform for everything Nexoris Technologies runs on.
            </h1>
            <p className="mt-4 max-w-md text-body text-purple-100">
              CRM, Finance, HR, and Payroll in one place, with Oge working
              alongside the team.
            </p>
            <p className="mt-10 font-mono text-[0.68rem] uppercase tracking-[.14em] text-purple-200">
              Staff access only
            </p>
          </div>
        </div>
      </aside>

      {/* Sign-in form */}
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          {/* Mobile brand header */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="grid h-11 w-11 place-items-center rounded-card bg-ink-950">
              <img src="/logo-mark-white.png" alt="" className="h-6 w-auto" />
            </span>
            <span className="font-roboto text-subhead font-700 leading-tight text-ink-950">
              Nexoris Technologies
            </span>
          </div>

          <div className="rounded-card border border-purple-200 bg-white p-6 shadow-medium sm:p-10">
            <h2 className="font-roboto text-dash-title font-700 text-ink-950">
              Welcome back
            </h2>
            <p className="mt-1 text-label text-neutral-600">
              Sign in to the Nexoris Technologies staff dashboard.
            </p>

            <form action={action} className="mt-8 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-label font-600 text-ink-950">
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

              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-label font-600 text-ink-950">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    strokeWidth={2}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-600"
                    aria-hidden="true"
                  />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="Your password"
                    className="w-full rounded-card border border-neutral-200 bg-white py-3 pl-10 pr-11 text-dash-data text-ink-950 placeholder:text-neutral-600/60 focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer p-1 text-neutral-600 hover:text-ink-950"
                  >
                    {showPassword ? (
                      <EyeOff size={16} strokeWidth={2} />
                    ) : (
                      <Eye size={16} strokeWidth={2} />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex cursor-pointer items-center gap-2 text-label text-ink-950">
                  <input
                    type="checkbox"
                    name="remember"
                    className="h-4 w-4 cursor-pointer accent-purple-600"
                  />
                  Keep me signed in
                </label>
                <Link
                  href="/forgot-password"
                  className="cursor-pointer text-label font-600 text-purple-600 hover:text-purple-700"
                >
                  Forgot password?
                </Link>
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
                {pending ? "Signing in" : "Sign in"}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-label text-neutral-600">
            Access is granted by an administrator. Need an account? Contact
            your admin.
          </p>
        </div>
      </main>
    </div>
  );
}
