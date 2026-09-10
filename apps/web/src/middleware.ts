/**
 * Serves the CMS-managed redirects (PRD Stage 7).
 *
 * The rules come from /api/redirects, which reads the CMS database on the Node runtime — middleware
 * runs on the edge and cannot open a database connection. It previously fetched Strapi's content API,
 * which was removed with Strapi, so every CMS-managed redirect had silently stopped working.
 *
 * What each rule means is decided in lib/redirect-match.ts, where it can be tested. Four settings the
 * CMS form has always offered are honoured here for the first time: the match pattern (including
 * regular expressions, with $1…$9 substituted into the destination), case sensitivity, slash handling,
 * and the expiry date. So are 307 and 410, which were both being served as a permanent 301 — the
 * opposite of what "temporary" means, and not a redirect at all in the case of "gone".
 *
 * Cached in the process for ten seconds. Together with the route's own ten-second cache a saved
 * redirect is live within about twenty; it used to be two minutes, which is long enough that anyone
 * testing a redirect straight after saving it concluded the feature did not work.
 */
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import {
  matchRedirect,
  resolveDestination,
  statusFor,
  type RedirectRule,
} from "./lib/redirect-match.js";

const TTL_MS = 10_000;

let cache: { at: number; rules: RedirectRule[] } | null = null;

async function loadRules(origin: string): Promise<RedirectRule[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.rules;
  let rules: RedirectRule[] = [];
  try {
    /*
     * Same-origin, so the request never leaves the instance and needs no absolute host configured.
     *
     * The trailing slash is not cosmetic. The site sets `trailingSlash: true`, so a request to
     * `/api/redirects` is answered with a 308 to `/api/redirects/` — and this runs on every page
     * request that is not a static asset, so the site was paying an extra internal round trip on
     * every single page view to be told the address it already had.
     */
    const res = await fetch(`${origin}/api/redirects/`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const json = (await res.json()) as { redirects?: RedirectRule[] };
      rules = (json.redirects ?? []).filter((r) => r && typeof r.source === "string" && r.source !== "");
    }
  } catch {
    // Unreachable or slow: serve no redirects rather than holding up every request on the site.
  }
  cache = { at: Date.now(), rules };
  return rules;
}

/**
 * Count the redirect without making the visitor wait for it.
 *
 * `waitUntil` keeps the runtime alive for the write after the response has gone out. Failures are
 * ignored on purpose: a usage counter must never turn a working redirect into an error.
 */
function countHit(event: NextFetchEvent, origin: string, id: string): void {
  const secret = process.env.REVALIDATION_SECRET;
  if (!secret || !id) return;
  event.waitUntil(
    fetch(`${origin}/api/redirects/hit/`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-redirect-hit": secret },
      body: JSON.stringify({ id }),
      signal: AbortSignal.timeout(3000),
    }).catch(() => undefined),
  );
}

export async function middleware(request: NextRequest, event: NextFetchEvent): Promise<NextResponse> {
  const rules = await loadRules(request.nextUrl.origin);
  if (rules.length === 0) return NextResponse.next();

  const hit = matchRedirect(request.nextUrl.pathname, rules);
  if (!hit) return NextResponse.next();

  // Redirecting the home page would take the whole site down, whatever the rule says.
  if (request.nextUrl.pathname === "/" && hit.rule.pattern === "Exact match") return NextResponse.next();

  const status = statusFor(hit.rule.type);
  countHit(event, request.nextUrl.origin, hit.rule.id);

  if (status === 410) {
    // Gone is an answer, not a redirect: the page is deliberately and permanently removed.
    return new NextResponse("410 Gone", {
      status: 410,
      headers: { "content-type": "text/plain; charset=utf-8" },
    }) as NextResponse;
  }

  const destination = resolveDestination(hit.destination, request.url);
  // A rule that resolves to the address already being requested would loop forever.
  if (destination === request.url) return NextResponse.next();
  return NextResponse.redirect(destination, status);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|llms.txt|brand|fonts).*)",
  ],
};
