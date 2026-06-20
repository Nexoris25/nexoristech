/**
 * Root layout for the admin dashboard: the document frame and global styles only. The signed-in
 * shell (navigation, sign-out) lives in the (dashboard) route group so the login page renders
 * without it.
 */
import type { Metadata } from "next";
import type { ReactNode } from "react";
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
      <body>{children}</body>
    </html>
  );
}
