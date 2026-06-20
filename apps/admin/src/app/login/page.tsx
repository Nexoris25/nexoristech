"use client";
/**
 * The admin sign-in page (PRD 1.1). A single form posting to the signIn server action. No public
 * navigation; this is the entry to the staff dashboard.
 */
import type { ReactNode } from "react";
import { useActionState } from "react";
import { Button } from "@nexoris/ui";
import { signIn, type SignInState } from "../../lib/auth-actions.js";

const initialState: SignInState = {};

export default function LoginPage(): ReactNode {
  const [state, action, pending] = useActionState(signIn, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-card border border-neutral-200 bg-white p-8">
        <p className="font-jakarta text-subhead font-700 text-ink-950">
          Nexoris Admin
        </p>
        <p className="mt-1 text-label text-neutral-600">
          Sign in to the staff dashboard.
        </p>

        <form action={action} className="mt-8 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-label font-600 text-ink-950">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              className="rounded-card border border-neutral-300 p-3 text-body"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="password"
              className="text-label font-600 text-ink-950"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="rounded-card border border-neutral-300 p-3 text-body"
            />
          </div>

          {state.error ? (
            <p className="text-label text-purple-700" role="alert">
              {state.error}
            </p>
          ) : null}

          <Button type="submit" disabled={pending}>
            {pending ? "Signing in" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
