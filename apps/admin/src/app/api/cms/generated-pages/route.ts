/**
 * Create or update a generated (programmatic SEO) page (nexoris_cms, kind='generated_page'). CMS access
 * only. Stores the page body as semantic HTML plus the programmatic metadata (service, industry, location,
 * intent, keyword) and SEO fields. Publishing stamps published_at. Per PRD §9.7 a page should only reach
 * 'published' once it clears the quality + data-readiness gates.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cmsDb } from "../../../../lib/cms-db.js";
import { getCmsStaff } from "../../../../lib/auth.js";
import { syncToKnowledgeBase } from "../../../../lib/kb-reingest.js";
import { notifyPublished } from "../../../../lib/publish-notify.js";
import { evaluatePseoGate, applyPseoGate } from "../../../../lib/pseo-gate.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const slugify = (s: string): string => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const VALID = new Set(["draft", "in_review", "scheduled", "published", "archived"]);

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getCmsStaff();
  if (!staff) return NextResponse.redirect(new URL("/cms/generated-pages", request.url), { status: 303 });
  const f = await request.formData();
  const id = String(f.get("id") ?? "").trim();
  const title = String(f.get("title") ?? "").trim();
  if (!title) return NextResponse.redirect(new URL(`${id ? `/cms/generated-pages/${id}` : "/cms/generated-pages/new"}?error=title`, request.url), { status: 303 });

  const statusRaw = String(f.get("status") ?? "draft").trim();
  const requestedStatus = VALID.has(statusRaw) ? statusRaw : "draft";
  const slug = slugify(String(f.get("slug") ?? "") || title);
  /** Accept a JSON field only if it parses; a malformed one becomes an empty array rather than a 500. */
  const jsonOr = (v: FormDataEntryValue | null, fallback: string): string => { try { const t = String(v ?? ""); JSON.parse(t); return t || fallback; } catch { return fallback; } };
  const body = String(f.get("body") ?? "");
  const excerpt = String(f.get("excerpt") ?? "").trim() || null;
  const metaDesc = String(f.get("meta_description") ?? "").trim() || null;
  const authorId = String(f.get("author_id") ?? "").trim() || null;

  // PRD §9.7: a programmatic page that fails the gate is held at draft and forced to noindex, so a thin
  // or unready page can never reach Google. The system holds it back; it does not rely on care.
  const gate = evaluatePseoGate({
    body, authorId, metaDescription: metaDesc,
    readinessScore: Number(f.get("readiness_score")) || null,
  });
  const gated = applyPseoGate(requestedStatus, f.get("noindex") != null, gate);
  const status = gated.status;
  const vals = [
    title,                                                       // 1
    slug,                                                        // 2
    body,                                                        // 3
    excerpt,                                                     // 4
    String(f.get("service_industry") ?? "").trim() || null,      // 5 primary service
    String(f.get("industry") ?? "").trim() || null,              // 6
    String(f.get("target_location") ?? "").trim() || null,       // 7
    String(f.get("search_intent") ?? "").trim() || null,         // 8
    String(f.get("target_keyword") ?? "").trim() || null,        // 9
    String(f.get("template") ?? "").trim() || null,              // 10
    status,                                                       // 11
    String(f.get("featured_image") ?? "").trim() || null,        // 12
    String(f.get("featured_image_alt") ?? "").trim() || null,    // 13
    String(f.get("meta_title") ?? "").trim() || null,            // 14
    metaDesc,                                                    // 15
    gated.noindex,                                               // 16
    authorId,                                                    // 17
    String(f.get("fact_checker_id") ?? "").trim() || null,       // 18
    String(f.get("author_bio") ?? "").trim() || null,            // 19
    String(f.get("fact_checker_bio") ?? "").trim() || null,      // 20
    String(f.get("short_title") ?? "").trim() || title,          // 21
    // Generated FAQs and TL;DR, stored the way Insights stores them, so a programmatic page can carry
    // FAQPage schema too. They were dropped on save before, so anything Oge produced here survived
    // only as body text and never reached the page's structured data.
    jsonOr(f.get("faqs"), "[]"),                                 // 22
    jsonOr(f.get("tldr"), "[]"),                                 // 23
    // The category the page belongs to. Insights have carried one from the start; programmatic pages
    // did not, so there was no way to group them, filter them, or show a reader what a page sits under.
    String(f.get("category_id") ?? "").trim() || null,            // 24
  ];
  const pool = cmsDb();

  if (id) {
    await pool.query(
      `UPDATE cms_content SET title=$1, slug=$2, body=$3, excerpt=$4, service_industry=$5, industry=$6, target_location=$7,
              search_intent=$8, target_keyword=$9, template=$10, status=$11, featured_image=$12, featured_image_alt=$13,
              meta_title=$14, meta_description=$15, noindex=$16, author_id=$17, fact_checker_id=$18,
              author_bio=$19, fact_checker_bio=$20, short_title=$21, faqs=$22::jsonb, tldr=$23::jsonb,
              category_id=$24::uuid, updated_at=now(),
              published_at = CASE WHEN $11='published' AND published_at IS NULL THEN now() ELSE published_at END
        WHERE id=$25 AND kind='generated_page'`,
      [...vals, id]);
    await syncToKnowledgeBase({ kind: "generated_page", slug, title, status, excerpt, metaDescription: metaDesc, body });
    await notifyPublished({ path: `/${slug}`, kind: "generated_page", published: status === "published" && !gated.noindex });
    return NextResponse.redirect(new URL(`/cms/generated-pages/${id}${gated.heldBack ? "?gate=held" : ""}`, request.url), { status: 303 });
  }
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO cms_content (kind, title, slug, body, excerpt, service_industry, industry, target_location,
            search_intent, target_keyword, template, status, featured_image, featured_image_alt, meta_title,
            meta_description, noindex, author_id, fact_checker_id, author_bio, fact_checker_bio, short_title, faqs, tldr,
            category_id, published_at)
     VALUES ('generated_page',$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,
            $22::jsonb,$23::jsonb,$24::uuid,
            CASE WHEN $11='published' THEN now() ELSE NULL END) RETURNING id`,
    vals);
  await syncToKnowledgeBase({ kind: "generated_page", slug, title, status, excerpt, metaDescription: metaDesc, body });
    await notifyPublished({ path: `/${slug}`, kind: "generated_page", published: status === "published" && !gated.noindex });
  return NextResponse.redirect(new URL(`/cms/generated-pages/${rows[0]?.id ?? ""}${gated.heldBack ? "?gate=held" : ""}`, request.url), { status: 303 });
}
