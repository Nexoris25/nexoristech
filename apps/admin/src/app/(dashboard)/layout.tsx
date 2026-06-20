/**
 * The signed-in dashboard shell (PRD 1.1): left-hand module navigation and the signed-in staff
 * with a sign-out control. Requires a valid session; unauthenticated visitors are redirected to
 * the login page. Sized for the CRM now, ready for more modules later.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { requireStaff } from "../../lib/auth.js";
import { signOut } from "../../lib/auth-actions.js";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}): Promise<ReactNode> {
  const staff = await requireStaff();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col bg-ink-950 px-6 py-8 text-white">
        <p className="font-jakarta text-subhead font-700">Nexoris Admin</p>
        <nav className="mt-10 flex flex-col gap-1" aria-label="Modules">
          <Link
            href="/dashboard"
            className="cursor-pointer rounded-card px-3 py-2 text-label text-purple-100 hover:bg-ink-800 hover:text-white"
          >
            Dashboard
          </Link>
          <Link
            href="/crm"
            className="cursor-pointer rounded-card px-3 py-2 text-label text-purple-100 hover:bg-ink-800 hover:text-white"
          >
            CRM
          </Link>
          {staff.role === "admin" ? (
            <Link
              href="/people"
              className="cursor-pointer rounded-card px-3 py-2 text-label text-purple-100 hover:bg-ink-800 hover:text-white"
            >
              People
            </Link>
          ) : null}
        </nav>
        <div className="mt-auto border-t border-ink-800 pt-4 text-label">
          <p className="text-purple-100">{staff.name}</p>
          <p className="text-purple-200 capitalize">{staff.role}</p>
          <form action={signOut} className="mt-3">
            <button
              type="submit"
              className="cursor-pointer text-purple-200 underline hover:text-white"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 px-8 py-8">{children}</main>
    </div>
  );
}
