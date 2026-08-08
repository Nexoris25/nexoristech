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
import { Analytics } from "../components/Analytics.js";
import "./globals.css";
import "../styles/design.css";
import "../styles/service.css";
import "../styles/geo-widget.css";
import "../styles/chat-widget.css";
import "../styles/calc-widget.css";
import "../styles/store-widget.css";
import "../styles/integration-widget.css";
import "../styles/dashboard-widget.css";
import "../styles/readiness-widget.css";
import "../styles/govtech-widget.css";
import "../styles/monitor-widget.css";
import "../styles/ops-widget.css";
import "../styles/oge-widget.css";
import "../styles/oge-page.css";
import "../styles/how-we-work.css";
import "../styles/about.css";
import "../styles/contact.css";
import "../styles/case-studies.css";
import "../styles/legal.css";
import "../styles/careers.css";
import "../styles/insights.css";
import "../styles/article.css";
import "../styles/floating-toc.css";
import "../styles/case-study.css";
import "../styles/author.css";
import "../styles/job.css";
import "../styles/industry.css";
import "../styles/pseo.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: "Nexoris Technologies",
    template: "%s",
  },
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png", sizes: "64x64" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
    ],
    shortcut: "/favicon.png",
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
      <head>
        {/* The two faces above the fold. Preloading them stops the swap from landing after first paint,
            which is what shows up as a layout shift in Cumulative Layout Shift. The rest load on demand. */}
        <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/roboto.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>
        <SkipLink targetId="main-content" />
        <SiteHeader />
        <main id="main-content">{children}</main>
        <SiteFooter />
        <OgeWidget />
        <CookieConsent />
        <Analytics />
      </body>
    </html>
  );
}
