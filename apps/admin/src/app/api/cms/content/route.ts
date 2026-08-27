/**
 * Row-level actions for any CMS content item (nexoris_cms): publish, unpublish, and delete. CMS access
 * only. Every action keeps the knowledge base in step: publishing upserts the page for the website
 * assistant, unpublishing or deleting removes it (§10.3). Native POST so it works in the framed preview;
 * it returns to the list the action came from.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cmsDb } from "../../../../lib/cms-db.js";
import { getCmsStaff, cmsAllows } from "../../../../lib/auth.js";
import { syncToKnowledgeBase } from "../../../../lib/kb-reingest.js";
import { notifyPublished } from "../../../../lib/publish-notify.js";
import { evaluatePseoGate } from "../../../../lib/pseo-gate.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KB_KINDS = new Set(["insight", "case_study", "legal_page", "generated_page", "job"]);
/** The public path for an item, matching the sitemap, so a publish can be announced. */
function publicPath(kind: string, slug: string): string | null {
  switch (kind) {
    case "insight": return `/insights/${slug}`;
    case "case_study": return `/case-studies/${slug}`;
    case "job": return `/careers/${slug}`;
    case "legal_page": case "generated_page": return `/${slug}`;
    default: return null;
  }
}
const safeBack = (raw: string): string => (raw.startsWith("/") && !raw.startsWith("//") ? raw : "/cms");

interface Row { title: string; slug: string; excerpt: string | null; meta_description: string | null; body: string | null; author_id: string | null; target_location: string | null }

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getCmsStaff();
  const f = await request.formData();
  const back = safeBack(String(f.get("back") ?? "/cms"));
  if (!staff) return NextResponse.redirect(new URL(back, request.url), { status: 303 });

  const id = String(f.get("id") ?? "").trim();
  const kind = String(f.get("kind") ?? "").trim();
  const action = String(f.get("action") ?? "").trim();
  if (!id || !kind) return NextResponse.redirect(new URL(back, request.url), { status: 303 });
  const pool = cmsDb();

  const { rows } = await pool.query<Row>(
    "SELECT title, slug, excerpt, meta_description, body, author_id, target_location FROM cms_content WHERE id=$1 AND kind=$2", [id, kind]);
  const row = rows[0];
  if (!row) return NextResponse.redirect(new URL(back, request.url), { status: 303 });

  const sync = (status: string): Promise<void> => (KB_KINDS.has(kind)
    ? syncToKnowledgeBase({ kind: kind as "insight", slug: row.slug, title: row.title, status, excerpt: row.excerpt, metaDescription: row.meta_description, body: row.body })
    : Promise.resolve());

  const path = publicPath(kind, row.slug);
  const announce = (published: boolean): Promise<unknown> => (path && KB_KINDS.has(kind)
    ? notifyPublished({ path, kind: kind as "insight", published })
    : Promise.resolve());

  // Publishing and deleting are the two irreversible acts in the CMS, and until now any granted role
  // could do both. A Content Writer writes; an Editor decides what goes live.
  const need = action === "delete" ? "content.delete" : action === "publish" || action === "unpublish" ? "content.publish" : "content.write";
  if (!(await cmsAllows(staff, need))) {
    return NextResponse.redirect(new URL(`${back}?denied=1`, request.url), { status: 303 });
  }

  if (action === "delete") {
    await pool.query("DELETE FROM cms_content WHERE id=$1 AND kind=$2", [id, kind]);
    await sync("deleted"); // any non-published status removes it from the KB
    await announce(false);
  } else if (action === "unpublish") {
    await pool.query("UPDATE cms_content SET status='draft', updated_at=now() WHERE id=$1 AND kind=$2", [id, kind]);
    await sync("draft");
    await announce(false);
  } else if (action === "publish") {
    // A programmatic page must clear the PRD §9.7 gate before it can be published from the list.
    if (kind === "generated_page") {
      // Readiness is measured here rather than read back, so publishing from the list applies the
      // same rule as saving from the editor, and the stored score is refreshed to match.
      const gate = evaluatePseoGate({ body: row.body, authorId: row.author_id, metaDescription: row.meta_description, targetLocation: row.target_location });
      if (!gate.passes) return NextResponse.redirect(new URL(`${back}?gate=held`, request.url), { status: 303 });
    }
    await pool.query(
      "UPDATE cms_content SET status='published', updated_at=now(), published_at=COALESCE(published_at, now()) WHERE id=$1 AND kind=$2",
      [id, kind]);
    await sync("published");
    await announce(true);
  }
  return NextResponse.redirect(new URL(back, request.url), { status: 303 });
}
