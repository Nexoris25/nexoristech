"use client";
/**
 * The password input with a show/hide toggle. Isolated as a small client island so the sign-in page
 * itself stays a server component and the form submits natively (no hydration needed to sign in);
 * the toggle is a progressive enhancement that simply does nothing if the island has not hydrated.
 */
import type { ReactNode } from "react";
import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

export function PasswordField({ defaultValue = "" }: { defaultValue?: string }): ReactNode {
  const [show, setShow] = useState(false);
  return (
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
        type={show ? "text" : "password"}
        autoComplete="current-password"
        required
        defaultValue={defaultValue}
        placeholder="Your password"
        className="w-full rounded-card border border-neutral-200 bg-white py-3 pl-10 pr-11 text-dash-data text-ink-950 placeholder:text-neutral-600/60 focus:border-purple-500"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer p-1 text-neutral-600 hover:text-ink-950"
      >
        {show ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
      </button>
    </div>
  );
}
