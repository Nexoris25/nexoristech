/**
 * The admin dashboard shell (PRD Part Three, 1.1): a single app frame with left-hand module
 * navigation, sized for the CRM now and ready for more modules later. Deliberately thin: it
 * assumes nothing specific to the CRM.
 */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexoris Technologies Admin",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return (
    <html lang="en-NG">
      <body>
        <div className="flex min-h-screen">
          <aside className="w-60 shrink-0 bg-ink-950 px-6 py-8 text-white">
            <p className="font-jakarta text-subhead font-700">Nexoris Admin</p>
            <nav className="mt-10 flex flex-col gap-1" aria-label="Modules">
              <Link
                href="/crm"
                className="cursor-pointer rounded-card px-3 py-2 text-label text-purple-100 hover:bg-ink-800 hover:text-white"
              >
                CRM
              </Link>
            </nav>
          </aside>
          <main className="flex-1 px-8 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
