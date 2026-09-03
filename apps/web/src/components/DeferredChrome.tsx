"use client";
/**
 * The three pieces of page furniture that nobody is waiting for.
 *
 * The chat widget, the cookie notice and the analytics beacon are on every page, and all three used
 * to be part of the first hydration: their JavaScript was parsed, evaluated and hydrated before the
 * browser would respond to a tap, even though none of them is doing anything until somebody clicks a
 * bubble, dismisses a banner, or navigates. On a mid-range phone that showed up as total blocking
 * time, which is most of what a poor performance score is made of.
 *
 * Loaded here instead, after the page is interactive. `ssr: false` keeps them out of the server render
 * as well, which is right for all three: the chat panel and the cookie choice depend on what is in
 * this browser's storage, and analytics has nothing to say about a page nobody has seen yet.
 *
 * Nothing is lost by the delay. The widget's own launcher is what a visitor reaches for, and it is
 * drawn by the widget within a few hundred milliseconds of the page settling; the cookie banner
 * appears a moment later than it used to, which no one can act on sooner anyway.
 */
import dynamic from "next/dynamic";

const OgeWidget = dynamic(() => import("./OgeWidget.js").then((m) => m.OgeWidget), { ssr: false });
const CookieConsent = dynamic(() => import("./CookieConsent.js").then((m) => m.CookieConsent), { ssr: false });
// Site-wide, and deferred with the rest: nobody is waiting to scroll back up on first paint.
const ScrollToTop = dynamic(() => import("./ScrollToTop.js").then((m) => m.ScrollToTop), { ssr: false });
const Analytics = dynamic(() => import("./Analytics.js").then((m) => m.Analytics), { ssr: false });

export function DeferredChrome(): React.ReactNode {
  return (
    <>
      <OgeWidget />
      <CookieConsent />
      <ScrollToTop />
      <Analytics />
    </>
  );
}
