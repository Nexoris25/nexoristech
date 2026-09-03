/**
 * What the dashboard shows while a page is being built on the server.
 *
 * These screens open with several queries against a database on another host, so there is a real
 * pause between clicking a link in the sidebar and anything appearing. Without this the old page
 * simply sits there, which reads as a click that did not register — and the second click is a
 * second round of those queries.
 *
 * Deliberately not a skeleton of any particular screen: the module pages differ too much for one
 * shape to be honest about what is coming, and a skeleton that does not match what arrives is a
 * small lie told on every navigation.
 */
import type { ReactNode } from "react";

export default function Loading(): ReactNode {
  return (
    <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-live="polite">
      <span className="flex items-center gap-2.5 text-[0.85rem] font-600 text-slate-500">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#543CDA] border-r-transparent" aria-hidden="true" />
        Loading
      </span>
    </div>
  );
}
