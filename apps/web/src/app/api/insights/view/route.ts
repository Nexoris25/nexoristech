/**
 * Count one view of a published insight.
 *
 * The admin's Insights list shows a views column with an eye icon beside every article. Nothing in
 * the platform ever incremented it, so it read 0 for everything, forever: a number that looked like
 * a measurement and was decoration.
 *
 * Counted here rather than while rendering the page, because the article is statically generated and
 * revalidated. Rendering happens when the cache rebuilds, not when a person reads, so counting there
 * would have measured cache misses.
 *
 * Deliberately modest about what it claims. It counts browsers that ran JavaScript and reported once
 * per session, which undercounts anyone with scripts off and does not pretend to filter bots. It is
 * a signal of relative interest between articles, not an analytics product, and GA4 remains the
 * place for real traffic numbers.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cmsDb } from "../../../../lib/cms-db.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  let slug = "";
  try {
    const body = (await request.json()) as { slug?: unknown };
    slug = typeof body.slug === "string" ? body.slug.trim() : "";
  } catch {
    return NextResponse.json({ counted: false }, { status: 400 });
  }

  // A slug is a slug. Anything else is not worth a database round trip.
  if (!slug || slug.length > 200 || !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ counted: false }, { status: 400 });
  }

  try {
    const { rowCount } = await cmsDb().query(
      // Published only: a draft nobody can read cannot have been read.
      "UPDATE cms_content SET views = coalesce(views, 0) + 1 WHERE slug = $1 AND kind = 'insight' AND status = 'published'",
      [slug],
    );
    return NextResponse.json({ counted: rowCount === 1 });
  } catch (e) {
    // A counter must never break the page it counts, and a failure here is not the reader's problem.
    console.error(`[views] could not count a view of ${slug}: ${e instanceof Error ? e.message : String(e)}`);
    return NextResponse.json({ counted: false });
  }
}
