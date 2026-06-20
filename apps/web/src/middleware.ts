/**
 * Serves the CMS-managed redirects (PRD Stage 7). On each request it checks the incoming path
 * against the enabled redirects, fetched from the content API and cached in the process for a
 * minute, and issues a 301 (permanent) or 302 (temporary). Paths are compared without a trailing
 * slash so the match is consistent with the site's trailing-slash routing. The cache suits the
 * single-instance VPS deployment; a shared store would be needed if scaled horizontally.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CMS_API = process.env.CMS_CONTENT_API_URL ?? "http://localhost:1337/api";
const TTL_MS = 60_000;

interface Redirect {
  destination: string;
  permanent: boolean;
}

let cache: { at: number; map: Map<string, Redirect> } | null = null;

function normalise(path: string): string {
  if (typeof path !== "string" || path.length === 0) return "/";
  let p = path.trim();
  if (!p.startsWith("/") && !p.startsWith("http")) p = `/${p}`;
  return p.replace(/\/+$/, "") || "/";
}

async function loadRedirects(): Promise<Map<string, Redirect>> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.map;
  const map = new Map<string, Redirect>();
  try {
    const res = await fetch(
      `${CMS_API}/redirects?filters[enabled][$eq]=true&pagination[limit]=500`,
    );
    if (res.ok) {
      const json = (await res.json()) as {
        data?: { source?: string; destination?: string; permanent?: boolean }[];
      };
      for (const row of json.data ?? []) {
        const source = normalise(row.source ?? "");
        const destination = (row.destination ?? "").trim();
        if (source !== "/" && destination) {
          map.set(source, { destination, permanent: row.permanent !== false });
        }
      }
    }
  } catch {
    // CMS unreachable: serve no redirects rather than blocking the request.
  }
  cache = { at: Date.now(), map };
  return map;
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const path = normalise(request.nextUrl.pathname);
  const map = await loadRedirects();
  const hit = map.get(path);
  if (hit) {
    const destination = hit.destination.startsWith("http")
      ? hit.destination
      : new URL(hit.destination, request.url).toString();
    return NextResponse.redirect(destination, hit.permanent ? 301 : 302);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|llms.txt|brand|fonts).*)",
  ],
};
