"use client";
/**
 * GA4 page analytics, gated on cookie consent (PRD Stage 10, legal). The gtag script is injected only
 * after the visitor has opted into analytics in the cookie banner, and it is removed again if consent is
 * withdrawn, so no analytics cookie is ever set without permission. The measurement id is public by
 * design (NEXT_PUBLIC_GA4_MEASUREMENT_ID); nothing sensitive is exposed. Renders nothing.
 */
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

const CONSENT_COOKIE = "nx-consent";
const SCRIPT_ID = "ga4-src";

declare global {
  interface Window { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void }
}

/** True when the visitor has opted into analytics cookies. */
function analyticsAllowed(): boolean {
  const raw = document.cookie.split("; ").find((c) => c.startsWith(`${CONSENT_COOKIE}=`));
  if (!raw) return false;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw.split("=").slice(1).join("="))) as { analytics?: boolean };
    return parsed.analytics === true;
  } catch {
    return false;
  }
}

export function Analytics(): ReactNode {
  const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  // Re-check consent on mount and whenever the visitor navigates (the banner sets the cookie without a
  // reload, so a poll for the first choice keeps this honest without a global state store).
  useEffect(() => {
    setAllowed(analyticsAllowed());
    const id = window.setInterval(() => setAllowed(analyticsAllowed()), 2000);
    return () => window.clearInterval(id);
  }, [pathname]);

  useEffect(() => {
    if (!measurementId) return;
    const existing = document.getElementById(SCRIPT_ID);
    if (!allowed) {
      existing?.remove();
      return;
    }
    if (existing) return;
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer ?? [];
    const gtag = (...args: unknown[]): void => { window.dataLayer?.push(args); };
    window.gtag = gtag;
    gtag("js", new Date());
    gtag("config", measurementId, { anonymize_ip: true });
  }, [allowed, measurementId]);

  // Report client-side navigations as page views once analytics is running.
  useEffect(() => {
    if (allowed && measurementId && window.gtag) {
      window.gtag("event", "page_view", { page_path: pathname });
    }
  }, [pathname, allowed, measurementId]);

  return null;
}
