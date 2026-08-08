/**
 * Create or update a CMS insight (nexoris_cms). Admin only. Stores the semantic HTML body plus the SEO
 * fields (meta title/description, focus keyword) and a derived read time, so the public page and the
 * search/answer engines get real, crawlable markup. Publishing stamps published_at the first time.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cmsDb } from "../../../../lib/cms-db.js";
import { getCmsStaff } from "../../../../lib/auth.js";
import { syncToKnowledgeBase } from "../../../../lib/kb-reingest.js";
import { notifyPublished } from "../../../../lib/publish-notify.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const slugify = (s: string): string => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const VALID = new Set(["draft", "in_review", "scheduled", "published", "archived"]);

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getCmsStaff();
  if (!staff) return NextResponse.redirect(new URL("/cms/insights", request.url), { status: 303 });
  const f = await request.formData();
  const id = String(f.get("id") ?? "").trim();
  const title = String(f.get("title") ?? "").trim();
  if (!title) return NextResponse.redirect(new URL(`${id ? `/cms/insights/${id}` : "/cms/insights/new"}?error=title`, request.url), { status: 303 });

  const slug = slugify(String(f.get("slug") ?? "") || title);
  const body = String(f.get("body") ?? "");
  const excerpt = String(f.get("excerpt") ?? "").trim() || null;
  const categoryId = String(f.get("category_id") ?? "").trim() || null;
  const authorId = String(f.get("author_id") ?? "").trim() || null;
  const factCheckerId = String(f.get("fact_checker_id") ?? "").trim() || null;
  const statusRaw = String(f.get("status") ?? "draft").trim();
  const status = VALID.has(statusRaw) ? statusRaw : "draft";
  const featured = String(f.get("featured_image") ?? "").trim() || null;
  const featuredAlt = String(f.get("featured_image_alt") ?? "").trim() || null;
  const metaTitle = String(f.get("meta_title") ?? "").trim() || null;
  const metaDesc = String(f.get("meta_description") ?? "").trim() || null;
  const keyword = String(f.get("focus_keyword") ?? "").trim() || null;
  const readTime = Number(f.get("read_time_min")) || null;
  const authorBio = String(f.get("author_bio") ?? "").trim() || null;
  const factCheckerBio = String(f.get("fact_checker_bio") ?? "").trim() || null;
  const jsonOr = (v: FormDataEntryValue | null, fallback: string): string => { try { const s = String(v ?? ""); JSON.parse(s); return s || fallback; } catch { return fallback; } };
  const faqs = jsonOr(f.get("faqs"), "[]");
  const tldr = jsonOr(f.get("tldr"), "[]");
  const publishDate = String(f.get("publish_date") ?? "").trim() || null;
  const shortTitle = String(f.get("short_title") ?? "").trim() || title;
  const noindex = f.get("noindex") != null;
  const SCHEMA_OK = new Set(["Article", "BlogPosting", "NewsArticle", "TechArticle", "ScholarlyArticle", "Report"]);
  const schemaRaw = String(f.get("schema_type") ?? "").trim();
  const schemaType = SCHEMA_OK.has(schemaRaw) ? schemaRaw : "BlogPosting";
  const pool = cmsDb();

  const vals = [title, slug, body, excerpt, categoryId, authorId, factCheckerId, status, featured, featuredAlt,
    metaTitle, metaDesc, keyword, readTime, authorBio, factCheckerBio, faqs, tldr, publishDate, shortTitle, noindex, schemaType];

  if (id) {
    await pool.query(
      `UPDATE cms_content SET title=$1, slug=$2, body=$3, excerpt=$4, category_id=$5, author_id=$6, fact_checker_id=$7,
              status=$8, featured_image=$9, featured_image_alt=$10, meta_title=$11, meta_description=$12, focus_keyword=$13,
              read_time_min=$14, author_bio=$15, fact_checker_bio=$16, faqs=$17::jsonb, tldr=$18::jsonb, short_title=$20, noindex=$21, schema_type=$23, updated_at=now(),
              published_at = COALESCE($19::timestamptz, CASE WHEN $8='published' AND published_at IS NULL THEN now() ELSE published_at END)
        WHERE id=$24 AND kind='insight'`,
      [...vals, id]);
    await syncToKnowledgeBase({ kind: "insight", slug, title, status, excerpt, metaDescription: metaDesc, body });
    await notifyPublished({ path: `/insights/${slug}`, kind: "insight", published: status === "published" && !noindex });
    return NextResponse.redirect(new URL(`/cms/insights/${id}`, request.url), { status: 303 });
  }
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO cms_content (kind, title, slug, body, excerpt, category_id, author_id, fact_checker_id, status,
            featured_image, featured_image_alt, meta_title, meta_description, focus_keyword, read_time_min,
            author_bio, fact_checker_bio, faqs, tldr, published_at, short_title, noindex, schema_type)
     VALUES ('insight',$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::jsonb,$18::jsonb,
            COALESCE($19::timestamptz, CASE WHEN $8='published' THEN now() ELSE NULL END), $20, $21, $22)
     RETURNING id`,
    vals);
  await syncToKnowledgeBase({ kind: "insight", slug, title, status, excerpt, metaDescription: metaDesc, body });
    await notifyPublished({ path: `/insights/${slug}`, kind: "insight", published: status === "published" && !noindex });
  return NextResponse.redirect(new URL(`/cms/insights/${rows[0]?.id ?? ""}`, request.url), { status: 303 });
}
