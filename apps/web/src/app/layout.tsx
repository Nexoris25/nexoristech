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

import { WhatsAppButton } from "../components/WhatsAppButton.js";
import { DeferredChrome } from "../components/DeferredChrome.js";
/*
 * Only the stylesheets every route genuinely uses belong here. This block once imported all 29,
 * so a service page downloaded the article, author, job, legal and case-study CSS it never renders,
 * and every widget's CSS whether or not that widget appeared. The cost showed up as four
 * render-blocking CSS requests and 1.6s of style and layout work on pages whose largest element is
 * a paragraph of text.
 *
 * The rest now sit with the route or component that owns them, each confirmed to have a single
 * consumer by matching class names rather than filenames, so Next bundles them only into the routes
 * that reach them. store-widget.css was deleted outright: nothing referenced its storew- classes.
 */
import "./globals.css";
import "../styles/design.css";
import "../styles/service.css";
import "../styles/how-we-work.css";
import "../styles/about.css";
import "../styles/contact.css";
import "../styles/case-studies.css";
import "../styles/careers.css";
import "../styles/insights.css";
import "../styles/industry.css";
import "../styles/pseo.css";
import "../styles/editorial.css";
import "../styles/studio.css";

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
      <body className="nexoris-site">
        <SkipLink targetId="main-content" />
        <SiteHeader />
        <main id="main-content">{children}</main>
        <SiteFooter />
        <WhatsAppButton />
        {/* Loaded after the page is interactive; see DeferredChrome. */}
        <DeferredChrome />
      </body>
    </html>
  );
}
