"use client";
/**
 * What the admin shows when a screen cannot render.
 *
 * There was no error boundary anywhere in this app, so any thrown error reached the user as a Next.js
 * runtime overlay: a stack trace, a file path and a line number. That is a development tool. Someone
 * signing in to do their job needs to know what is wrong and whether it is theirs to fix.
 *
 * The database case is separated out because it is the one that actually happens in operation and the
 * one most easily misread. It is nobody's mistake and retrying is genuinely worth doing, so the screen
 * says so rather than implying the person did something wrong.
 *
 * Nothing here names a host, a port or a connection string. This boundary is a client component and
 * renders before any authentication check, so anything it displays is public.
 */
import type { ReactNode } from "react";
import { AlertTriangle, DatabaseZap, RotateCw } from "lucide-react";
import { DB_UNREACHABLE_MARKER } from "../lib/db-errors.js";

export function FailureScreen({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): ReactNode {
  const dbDown = error.message === DB_UNREACHABLE_MARKER;

  return (
    <div className="grid min-h-[70vh] place-items-center px-5 py-16">
      <div className="w-full max-w-[30rem] text-center">
        <span
          className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl ${
            dbDown ? "bg-[#FEF3C7] text-[#B45309]" : "bg-[#FEE2E2] text-[#B91C1C]"
          }`}
        >
          {dbDown ? <DatabaseZap size={26} /> : <AlertTriangle size={26} />}
        </span>

        <h1 className="mt-5 text-[1.25rem] font-700 text-slate-900">
          {dbDown ? "The database is not responding" : "This screen could not load"}
        </h1>

        <p className="mt-2.5 text-[0.9rem] leading-relaxed text-slate-600">
          {dbDown ? (
            <>
              The admin could not reach its database, so there is nothing it can show you here. Your
              sign-in is fine and nothing you did caused this. It is usually brief; try again in a
              moment, and tell whoever runs the server if it continues.
            </>
          ) : (
            <>
              Something went wrong rendering this page. Trying again often clears it. If it keeps
              happening, pass on the reference below so it can be traced in the logs.
            </>
          )}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg bg-[#543CDA] px-5 py-2.5 text-[0.85rem] font-600 text-white hover:bg-[#4330B8]"
          >
            <RotateCw size={15} /> Try again
          </button>
          <a
            href="/dashboard"
            className="rounded-lg border border-slate-200 px-5 py-2.5 text-[0.85rem] font-600 text-slate-600 hover:bg-slate-50"
          >
            Back to dashboard
          </a>
        </div>

        {/* The digest is Next's own identifier for the logged error: enough to find it, and it reveals
            nothing about the system on its own. */}
        {!dbDown && error.digest ? (
          <p className="mt-5 font-mono text-[0.72rem] text-slate-400">Reference {error.digest}</p>
        ) : null}
      </div>
    </div>
  );
}
