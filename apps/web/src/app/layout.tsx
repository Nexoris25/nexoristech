/**
 * Root layout for the Nexoris Technologies marketing site. Sets the en-NG language, the
 * skip-to-content link first in the DOM, the shared header and footer, and the main landmark.
 * Per-page metadata and JSON-LD come from each route (PRD 7, 9, 15).
 */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SkipLink } from "@nexoris/ui";
import { SITE_ORIGIN } from "@nexoris/seo";
import { SiteHeader } from "../components/SiteHeader.js";
import { SiteFooter } from "../components/SiteFooter.js";
import { OgeWidget } from "../components/OgeWidget.js";
import { CookieConsent } from "../components/CookieConsent.js";
import "./globals.css";
import "../styles/design.css";
import "../styles/service.css";
import "../styles/geo-widget.css";
import "../styles/chat-widget.css";
import "../styles/calc-widget.css";
import "../styles/store-widget.css";
import "../styles/integration-widget.css";
import "../styles/dashboard-widget.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: "Nexoris Technologies",
    template: "%s",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return (
    <html lang="en-NG">
      <body>
        <SkipLink targetId="main-content" />
        <SiteHeader />
        <main id="main-content">{children}</main>
        <SiteFooter />
        <OgeWidget />
        <CookieConsent />
      </body>
    </html>
  );
}
