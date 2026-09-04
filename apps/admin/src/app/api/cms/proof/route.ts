/**
 * Create or update a Proof Library item (nexoris_cms): case study, testimonial, or legal page. Admin only.
 * One route because the three share the cms_content table; the hidden `kind` field selects which columns
 * apply. Comma lists (highlights, technologies) become text[]. On success it returns to that item's editor.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cmsDb } from "../../../../lib/cms-db.js";
import { getCmsStaff } from "../../../../lib/auth.js";
import { syncToKnowledgeBase } from "../../../../lib/kb-reingest.js";
import { notifyPublished } from "../../../../lib/publish-notify.js";
import { SERVICE_PAGES } from "../../../../lib/site-pages.js";

// Only the kinds that have a public, crawlable page ground the website assistant; testimonials render
// inside other pages and have no standalone URL.
const KB_KINDS = new Set(["case_study", "legal_page"]);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const slugify = (s: string): string => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const KIND_PATH: Record<string, string> = { case_study: "case-studies", testimonial: "testimonials", legal_page: "legal-pages" };
/** The public path each kind is served at. Testimonials have no page of their own. */
const PUBLIC_PATH: Record<string, (slug: string) => string> = {
  case_study: (slug) => `/case-studies/${slug}`,
  legal_page: (slug) => `/${slug}`,
};
const VALID_STATUS = new Set(["draft", "in_review", "scheduled", "published", "archived"]);
const list = (v: FormDataEntryValue | null): string[] => String(v ?? "").split(",").map((s) => s.trim()).filter(Boolean);

/** Rebuild the website routes this save affects, so an edit is visible without waiting for a rebuild. */
async function announce(kind: string, slug: string, status: string): Promise<void> {
  // A testimonial has no page of its own, which is why this used to return here and do nothing at all:
  // publishing a client quote left the homepage carousel showing whatever it showed before. It is
  // announced against the page that renders it instead.
  if (kind === "testimonial") {
    await notifyPublished({ path: "/", kind: "testimonial", published: status === "published" });
    return;
  }
  const path = PUBLIC_PATH[kind]?.(slug);
  if (!path) return;
  await notifyPublished({ path, kind: kind as "case_study" | "legal_page", published: status === "published" });
}

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getCmsStaff();
  const kind = String((await request.clone().formData()).get("kind") ?? "");
  const base = `/cms/${KIND_PATH[kind] ?? "case-studies"}`;
  if (!staff) return NextResponse.redirect(new URL(base, request.url), { status: 303 });

  const f = await request.formData();
  const id = String(f.get("id") ?? "").trim();
  const title = String(f.get("title") ?? "").trim();
  if (!title || !KIND_PATH[kind]) return NextResponse.redirect(new URL(`${id ? `${base}/${id}` : `${base}/new`}?error=title`, request.url), { status: 303 });

  const slug = slugify(String(f.get("slug") ?? "") || title);

  /** The gallery arrives as one JSON field. A malformed one becomes an empty list, never a 500. */
  const gallery = ((): string => {
    try {
      const parsed: unknown = JSON.parse(String(f.get("gallery") ?? "[]"));
      if (!Array.isArray(parsed)) return "[]";
      // Keep only entries that actually name an image, and only the two fields that matter.
      const clean = parsed
        .filter((x): x is { url?: unknown; alt?: unknown } => typeof x === "object" && x !== null)
        .map((x) => ({ url: String(x.url ?? "").trim(), alt: String(x.alt ?? "").trim() }))
        .filter((x) => x.url);
      return JSON.stringify(clean);
    } catch {
      return "[]";
    }
  })();

  // Checkbox group: only paths the site actually has, so a stale value cannot reach the column.
  const servicePaths = f.getAll("service_paths")
    .map((v) => String(v))
    .filter((v) => (SERVICE_PAGES as readonly string[]).includes(v));
  const body = String(f.get("body") ?? "");
  const excerpt = String(f.get("excerpt") ?? "").trim() || null;
  /*
   * The button decides, and "Publish" means publish.
   *
   * Status came only from the dropdown, so a legal page could be created and updated but never put
   * live or taken down without knowing to change a select first. The buttons carry the intent now,
   * the same way the Insights editor does: publish, unpublish and save-as-draft each say plainly
   * what they will do, and an ordinary update keeps whatever the dropdown holds.
   */
  const statusRaw = String(f.get("status") ?? "draft").trim();
  const intent = String(f.get("intent") ?? "save").trim();
  const asked =
    intent === "publish" ? "published" : intent === "draft" || intent === "unpublish" ? "draft" : statusRaw;
  const status = VALID_STATUS.has(asked) ? asked : "draft";
  const order = Number(f.get("display_order")) || 0;
  const featured = f.get("featured") != null;
  const serviceIndustry = String(f.get("service_industry") ?? "").trim() || null;
  const company = String(f.get("company") ?? "").trim() || null;
  const customerTitle = String(f.get("customer_title") ?? "").trim() || null;
  const rating = Number(f.get("rating")) || null;
  const highlights = list(f.get("highlights"));
  const technologies = list(f.get("technologies"));
  const version = String(f.get("version") ?? "").trim() || null;
  const effectiveDate = String(f.get("effective_date") ?? "").trim() || null;
  const visibleInFooter = f.get("visible_in_footer") != null;
  const requireAcceptance = f.get("require_acceptance") != null;
  const featuredImage = String(f.get("featured_image") ?? "").trim() || null;
  const featuredImageAlt = String(f.get("featured_image_alt") ?? "").trim() || null;
  const metaTitle = String(f.get("meta_title") ?? "").trim() || null;
  const metaDesc = String(f.get("meta_description") ?? "").trim() || null;
  const pool = cmsDb();

  const cols = { title, slug, body, excerpt, status, display_order: order, featured, service_industry: serviceIndustry,
    company, customer_title: customerTitle, rating, highlights, technologies, version, effective_date: effectiveDate,
    visible_in_footer: visibleInFooter, require_acceptance: requireAcceptance, featured_image: featuredImage,
    featured_image_alt: featuredImageAlt, meta_title: metaTitle, meta_description: metaDesc,
    // A case study's own gallery, and the service pages it is proof for. Both only apply to case
    // studies; the other proof kinds send neither and get the column defaults.
    gallery, service_paths: servicePaths };
  const keys = Object.keys(cols);
  const vals = Object.values(cols);
  const statusIdx = keys.indexOf("status"); // 0-based position within vals

  if (id) {
    const cast = (k: string): string => (k === "gallery" ? "::jsonb" : k === "service_paths" ? "::text[]" : "");
    const set = keys.map((k, i) => `${k}=$${i + 1}${cast(k)}`).join(", ");
    await pool.query(
      `UPDATE cms_content SET ${set}, updated_at=now(),
              published_at = CASE WHEN $${statusIdx + 1}='published' AND published_at IS NULL THEN now() ELSE published_at END
        WHERE id=$${keys.length + 1} AND kind=$${keys.length + 2}`,
      [...vals, id, kind]);
    if (KB_KINDS.has(kind)) await syncToKnowledgeBase({ kind: kind as "case_study" | "legal_page", slug, title, status, excerpt, metaDescription: metaDesc, body });
    await announce(kind, slug, status);
    return NextResponse.redirect(new URL(`${base}/${id}`, request.url), { status: 303 });
  }
  const cast2 = (k: string): string => (k === "gallery" ? "::jsonb" : k === "service_paths" ? "::text[]" : "");
  const ph = keys.map((k, i) => `$${i + 2}${cast2(k)}`).join(", "); // shifted by kind=$1
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO cms_content (kind, ${keys.join(", ")}, published_at)
     VALUES ($1, ${ph}, CASE WHEN $${statusIdx + 2}='published' THEN now() ELSE NULL END) RETURNING id`,
    [kind, ...vals]);
  if (KB_KINDS.has(kind)) await syncToKnowledgeBase({ kind: kind as "case_study" | "legal_page", slug, title, status, excerpt, metaDescription: metaDesc, body });
  await announce(kind, slug, status);
  return NextResponse.redirect(new URL(`${base}/${rows[0]?.id ?? ""}`, request.url), { status: 303 });
}
