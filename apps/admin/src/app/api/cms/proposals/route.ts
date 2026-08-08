/**
 * Act on a programmatic SEO proposal (nexoris_cms). CMS access only. `reject` marks it rejected; `approve`
 * marks it approved and creates a draft generated page seeded from the proposal, with a full body auto-drafted
 * by Oge (keyword + industry) so the page opens with real, structured content rather than an empty topic
 * (§9.6-9.7). The editor still reviews and approves before it can be published.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cmsDb } from "../../../../lib/cms-db.js";
import { getCmsStaff } from "../../../../lib/auth.js";
import { composePageBody, generateEditorial } from "../../../../lib/oge-content.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const slugify = (s: string): string => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getCmsStaff();
  if (!staff) return NextResponse.redirect(new URL("/cms/proposals", request.url), { status: 303 });
  const f = await request.formData();
  const id = String(f.get("id") ?? "").trim();
  const action = String(f.get("action") ?? "").trim();
  if (!id) return NextResponse.redirect(new URL("/cms/proposals", request.url), { status: 303 });
  const pool = cmsDb();

  if (action === "reject") {
    await pool.query("UPDATE cms_proposal SET status='Rejected' WHERE id=$1", [id]);
    return NextResponse.redirect(new URL("/cms/proposals", request.url), { status: 303 });
  }

  if (action === "approve") {
    const { rows } = await pool.query<{ keyword: string; industry: string | null }>("SELECT keyword, industry FROM cms_proposal WHERE id=$1", [id]);
    const p = rows[0];
    if (!p) return NextResponse.redirect(new URL("/cms/proposals", request.url), { status: 303 });
    await pool.query("UPDATE cms_proposal SET status='Approved' WHERE id=$1", [id]);
    // The approved keyword IS the page: it becomes both the title and the target keyword, so the two
    // can never drift apart. Appending "Solutions" made every title differ from the term it targets.
    const title = p.keyword;
    const industry = p.industry ?? "";
    // Auto-draft the full page body so the editor opens to real content, not a bare topic.
    const gen = await generateEditorial({ kind: "page-body", title, focusKeyword: p.keyword, industry });
    const body = typeof gen.result === "string" && gen.result.trim() ? gen.result : composePageBody(title, p.keyword, industry, "");
    const excerpt = `${p.keyword} for ${industry || "your business"}, built and delivered by Nexoris Technologies.`.slice(0, 180);
    const { rows: made } = await pool.query<{ id: string }>(
      `INSERT INTO cms_content (kind, title, slug, industry, target_keyword, search_intent, status, template, body, excerpt)
       VALUES ('generated_page', $1, $2, $3, $4, 'Informational', 'draft', 'Service + Industry', $5, $6) RETURNING id`,
      [title, slugify(p.keyword), p.industry, p.keyword, body, excerpt]);
    return NextResponse.redirect(new URL(`/cms/generated-pages/${made[0]?.id ?? ""}`, request.url), { status: 303 });
  }
  return NextResponse.redirect(new URL("/cms/proposals", request.url), { status: 303 });
}
