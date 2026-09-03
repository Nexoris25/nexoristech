/**
 * Record that an article was read, or shared.
 *
 * The CMS has shown a "total views" figure since those screens were built and nothing ever wrote to
 * the column, so every number on them came from seeding. This is the write that makes the figure
 * mean what the screen says.
 *
 * Counted from the browser rather than on the server, because the server does not see most of the
 * reads: article pages are statically generated and revalidated on a timer, so a hundred visitors
 * can share one render. A beacon is the only place a page view is actually observable.
 *
 * It is deliberately not an analytics system. There is no identity here, nothing is stored about
 * who read what, and the only thing that changes is a counter on the row. Anything finer belongs in
 * the analytics the site already has, where a visitor can refuse it.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cmsDb } from "../../../../lib/cms-db.js";
import { rateLimit, clientIp } from "../../../../lib/rate-limit.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The places an article can be shared from. Anything else is counted only in the total. */
const CHANNELS = new Set(["x", "linkedin", "whatsapp", "facebook", "email", "copy"]);

export async function POST(request: NextRequest): Promise<Response> {
  // A counter anybody can increment is a counter anybody can inflate. This does not make it
  // tamper-proof — nothing reachable from a browser is — it keeps a casual loop from mattering.
  if (!rateLimit(`engage:${clientIp(request)}`, 30, 60_000)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  let body: { slug?: unknown; kind?: unknown; channel?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const kind = body.kind === "share" ? "share" : "view";
  const channel = typeof body.channel === "string" && CHANNELS.has(body.channel) ? body.channel : null;
  if (!slug || slug.length > 200) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    if (kind === "view") {
      await cmsDb().query(
        "UPDATE cms_content SET views = COALESCE(views, 0) + 1 WHERE slug = $1 AND kind = 'insight' AND status = 'published'",
        [slug],
      );
    } else {
      // The per-channel tally and the total move together, so they can never disagree.
      await cmsDb().query(
        `UPDATE cms_content
            SET share_count = COALESCE(share_count, 0) + 1,
                shares_by_channel = jsonb_set(
                  COALESCE(shares_by_channel, '{}'::jsonb),
                  ARRAY[$2::text],
                  to_jsonb(COALESCE((shares_by_channel ->> $2)::int, 0) + 1),
                  true)
          WHERE slug = $1 AND kind = 'insight' AND status = 'published'`,
        [slug, channel ?? "other"],
      );
    }
  } catch {
    // A counter is not worth failing a page view over.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
  return NextResponse.json({ ok: true });
}
