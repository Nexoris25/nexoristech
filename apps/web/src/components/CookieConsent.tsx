"use client";
/**
 * The cookie consent banner (PRD Stage 10, 6 legal): granular toggles wired to the cookie policy.
 * Necessary cookies are always on; analytics and personalisation are off until the visitor opts in.
 * The choice is stored in a first-party cookie so the server can gate personalisation and analytics
 * (without consent, everyone sees the same site). Shown once until a choice is recorded.
 */
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@nexoris/ui";

const COOKIE = "nx-consent";
const MAX_AGE = 60 * 60 * 24 * 182; // about six months

function persist(analytics: boolean, personalisation: boolean): void {
  const value = encodeURIComponent(
    JSON.stringify({ necessary: true, analytics, personalisation }),
  );
  document.cookie = `${COOKIE}=${value}; path=/; max-age=${MAX_AGE}; SameSite=Lax`;
}

export function CookieConsent(): ReactNode {
  const [open, setOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [personalisation, setPersonalisation] = useState(false);

  useEffect(() => {
    const seen = document.cookie
      .split("; ")
      .some((c) => c.startsWith(`${COOKIE}=`));
    if (!seen) setOpen(true);
  }, []);

  if (!open) return null;

  const close = (a: boolean, p: boolean): void => {
    persist(a, p);
    setOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Cookie choices"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-purple-200 bg-white p-4 shadow-2xl md:p-6"
    >
      <div className="mx-auto flex max-w-[1100px] flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="max-w-[60ch]">
          <p className="text-label text-ink-950">
            We use necessary cookies to make the site work. With your permission
            we also use analytics and personalisation cookies. You can read more
            in our{" "}
            <Link
              href="/cookie-policy"
              className="cursor-pointer text-purple-700 underline hover:text-purple-600"
            >
              Cookie Policy
            </Link>
            .
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-label">
            <label className="flex items-center gap-2 text-neutral-600">
              <input type="checkbox" checked disabled aria-label="Necessary" />
              Necessary
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-ink-950">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
              />
              Analytics
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-ink-950">
              <input
                type="checkbox"
                checked={personalisation}
                onChange={(e) => setPersonalisation(e.target.checked)}
              />
              Personalisation
            </label>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => close(false, false)}>
            Reject non-essential
          </Button>
          <Button variant="ghost" onClick={() => close(analytics, personalisation)}>
            Save choices
          </Button>
          <Button onClick={() => close(true, true)}>Accept all</Button>
        </div>
      </div>
    </div>
  );
}
