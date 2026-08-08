/**
 * The database-unreachable screen, rendered on the server.
 *
 * This is deliberately not left to the React error boundary. Next redacts the message of an error
 * thrown in a Server Component before it reaches the client, so a boundary can only see a generic
 * string and a digest — it cannot tell a database outage from any other failure once the app is built
 * for production. Catching it where it happens and rendering this instead behaves identically in
 * development and in production.
 *
 * No host, port or connection string appears here: this renders before anyone is authenticated.
 */
import type { ReactNode } from "react";
import { DatabaseZap } from "lucide-react";

export function DatabaseDown({ area = "This part of the admin" }: { area?: string }): ReactNode {
  return (
    <div className="grid min-h-screen place-items-center bg-white px-5 py-16">
      <div className="w-full max-w-[30rem] text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#FEF3C7] text-[#B45309]">
          <DatabaseZap size={26} />
        </span>

        <h1 className="mt-5 text-[1.25rem] font-700 text-slate-900">The database is not responding</h1>

        <p className="mt-2.5 text-[0.9rem] leading-relaxed text-slate-600">
          {area} needs its database, and it could not be reached. Your sign-in is still valid and
          nothing you did caused this. Outages like this are usually brief.
        </p>

        <p className="mt-4 text-[0.85rem] leading-relaxed text-slate-500">
          Reload in a moment. If it keeps happening, whoever runs the server needs to know the
          database is refusing connections.
        </p>

        {/* A link rather than a button: this renders on the server, so there is no click handler to
            attach, and a plain reload is exactly the right action. */}
        <a
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#543CDA] px-5 py-2.5 text-[0.85rem] font-600 text-white hover:bg-[#4330B8]"
        >
          Try again
        </a>
      </div>
    </div>
  );
}
