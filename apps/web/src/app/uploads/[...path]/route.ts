/**
 * Serves CMS uploads from this origin, reading where they live at request time.
 *
 * This was a `rewrites()` entry in next.config, and that was wrong in a way that only showed up on a
 * server. Next resolves rewrites when it builds and writes the finished destination into
 * routes-manifest.json, so the value of CMS_MEDIA_BASE at build time is frozen into the deployment:
 * a build made on a laptop shipped `http://localhost:3102` to the VPS, and a build made before the
 * variable was set shipped no rewrite at all. Either way every image on the site 404s, setting the
 * variable afterwards changes nothing, and the only symptom is that the pictures are missing.
 *
 * A route handler reads the environment on each request, so the address can be corrected by editing
 * the file and restarting rather than rebuilding.
 *
 * The browser still only ever talks to this origin. The fetch to the media host happens here, on the
 * server, which is what allows the admin to stay unreachable from the internet.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
/* The destination is read per request, so this must never be cached as a static route. */
export const dynamic = "force-dynamic";

/** A week in the browser, a year on any shared cache: upload names are content-addressed UUIDs. */
const CACHE_CONTROL = "public, max-age=604800, s-maxage=31536000, immutable";

function mediaBase(): string {
  return (process.env.CMS_MEDIA_BASE ?? "").trim().replace(/\/+$/, "");
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const base = mediaBase();
  if (!base) {
    // Said out loud rather than returning a bare 404: a missing variable and a missing file look
    // identical from the browser, and this one is the operator's to fix.
    console.error("[uploads] CMS_MEDIA_BASE is not set; cannot serve /uploads.");
    return new NextResponse("Media origin is not configured.", { status: 500 });
  }

  const { path } = await context.params;
  /*
   * Only ever a flat upload name. The segments come from the URL, so a crafted path must not be able
   * to walk out of /uploads and ask the media host for something else.
   */
  if (path.some((seg) => seg === ".." || seg === "." || seg.includes("\\") || seg.includes("\0"))) {
    return new NextResponse("Not found", { status: 404 });
  }

  const target = `${base}/uploads/${path.map(encodeURIComponent).join("/")}`;

  try {
    const upstream = await fetch(target, {
      // The media host is on the same machine; a slow one should not hold a page open.
      signal: AbortSignal.timeout(10_000),
      headers: request.headers.get("range") ? { range: request.headers.get("range")! } : {},
    });

    if (!upstream.ok || !upstream.body) {
      return new NextResponse("Not found", { status: upstream.status === 404 ? 404 : 502 });
    }

    const headers = new Headers();
    const type = upstream.headers.get("content-type");
    if (type) headers.set("content-type", type);
    const length = upstream.headers.get("content-length");
    if (length) headers.set("content-length", length);
    const range = upstream.headers.get("content-range");
    if (range) headers.set("content-range", range);
    headers.set("cache-control", CACHE_CONTROL);

    return new NextResponse(upstream.body, { status: upstream.status, headers });
  } catch (error) {
    console.error(
      "[uploads] could not reach the media origin:",
      error instanceof Error ? error.message : error,
    );
    return new NextResponse("Media origin unreachable.", { status: 502 });
  }
}
