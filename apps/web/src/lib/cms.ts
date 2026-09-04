/**
 * The website's content layer, reading published content directly from the custom CMS database
 * (nexoris_cms) the admin writes to. Every function degrades gracefully: any error or absence returns an
 * empty result so a page never breaks when the database is unavailable or a type has no content yet
 * ("absent proof renders nothing"). Only published items are ever returned. Return shapes are stable so
 * the pages and their schema/metadata never need to know where the data comes from.
 */
import { cmsDb, nameSlug } from "./cms-db.js";
import { splitSections, wrapTables } from "./render-html.js";

// Media paths are stored relative to the CMS upload origin; set CMS_MEDIA_BASE to an absolute origin
// (CDN or the admin host) in production so images and OG tags resolve. Empty keeps paths as stored.
const MEDIA_BASE = (process.env.CMS_MEDIA_BASE ?? "").replace(/\/+$/, "");

export interface Metric { label: string; value: string }
export interface Testimonial { quote: string; authorName: string; authorRole?: string; company?: string; avatarUrl?: string; avatarAlt?: string }
export interface CaseStudyCard { title: string; slug: string; summary?: string; coverUrl?: string; coverAlt?: string; industry?: string; metrics: Metric[] }
/** One image in a case study's gallery. */
export interface CaseStudyImage { url: string; alt: string }
export interface CaseStudy {
  title: string; slug: string; body: string; summary?: string;
  coverUrl?: string; coverAlt?: string; gallery: CaseStudyImage[];
  industry?: string; highlights: string[]; technologies: string[];
  servicePaths: string[]; publishedAt?: string; updatedAt?: string;
  metaTitle?: string; metaDescription?: string;
}
/**
 * A card in a listing.
 *
 * It carried a cover, a title and an author's name. The design has always had a category chip and
 * the author's face on these cards, and both were left out with a note saying the type did not
 * carry them - so the note described the gap rather than closing it. A card with no category cannot
 * be scanned by subject, and a byline with no face is the weakest form an author credit takes.
 */
export interface InsightCard {
  title: string; slug: string; excerpt?: string; publishedAt?: string;
  coverUrl?: string; coverAlt?: string; readMinutes?: number;
  author?: string;
  /** The author's headshot and their page, so a byline on a card is a face and a link. */
  authorPhotoUrl?: string;
  authorSlug?: string;
  category?: string;
  categorySlug?: string;
}
/** A credited person. The photo travels with the name so a byline is a face, not two letters. */
export interface Author {
  name: string; slug?: string; role?: string; linkedin?: string; bio?: string;
  photoUrl?: string; photoAlt?: string;
}
export interface FaqItem { question: string; answer: string }
export interface Insight {
  title: string; shortTitle?: string; slug: string; body: string; excerpt?: string;
  /** The TL;DR as written: one entry per bullet. Joined only where a plain string is needed. */
  tldr?: string[];
  publishedAt?: string; updatedAt?: string; coverUrl?: string; coverAlt?: string;
  category?: string; author?: Author; factChecker?: Author; faq: FaqItem[]; noIndex: boolean;
  metaTitle?: string; metaDescription?: string; schemaType?: string;
}

/**
 * Date tokens an editor can type in the CMS: [day], [month], [year], and the [month year] and
 * [monthyear] pairs, resolve when the page renders. So "Best CRM software in [month] [year]" stays
 * current on its own as the calendar turns over, and nobody has to remember to edit every evergreen
 * article each January. Pages revalidate on a timer, so the change lands without a re-edit.
 *
 * Resolved at render, never at save: substituting on save would freeze the value at the date someone
 * pressed publish, which is the problem rather than the fix.
 *
 * Case-insensitive, and Lagos time so a render on a UK-hosted box never shows yesterday's date.
 * Anything else in brackets is left alone, so an aside like [sic] survives untouched.
 *
 * One honest limit: a statically generated page shows the date it was last built. The revalidate
 * windows and revalidation on publish close that on their own; a page nobody touches for a year is
 * the case to know about.
 */
export function expandDateTokens(text: string): string {
  if (!text || !text.includes("[")) return text;
  const now = new Date();
  const part = (options: Intl.DateTimeFormatOptions): string =>
    new Intl.DateTimeFormat("en-NG", { timeZone: "Africa/Lagos", ...options }).format(now);
  const month = part({ month: "long" });
  const year = part({ year: "numeric" });
  const day = part({ day: "numeric" });
  return text
    // Longest patterns first, so "[day month year]" is not eaten by "[day]".
    .replace(/\[day\s+month\s+year\]/gi, `${day} ${month} ${year}`)
    .replace(/\[month\s+year\]/gi, `${month} ${year}`)
    .replace(/\[monthyear\]/gi, `${month} ${year}`)
    .replace(/\[day\]/gi, day)
    .replace(/\[month\]/gi, month)
    .replace(/\[year\]/gi, year);
}

function str(value: unknown): string | undefined {
  const v = typeof value === "string" && value.length > 0 ? value : undefined;
  return v === undefined ? undefined : expandDateTokens(v);
}
/**
 * Cover images that were seeded but never uploaded. 145 of 156 published insights pointed at
 * /uploads/cover-placeholder.webp, which does not exist, so every one of those pages rendered a broken
 * image AND advertised a 404 as its og:image to every crawler and social platform that fetched it.
 *
 * Treating them as absent is the honest answer: the page then renders no figure, emits no og:image and
 * no ImageObject, rather than pointing the world at a file that was never there.
 */
const MISSING_MEDIA = new Set(["/uploads/cover-placeholder.webp"]);

function mediaUrl(value: unknown): string | undefined {
  const url = str(value);
  if (!url) return undefined;
  if (MISSING_MEDIA.has(url)) return undefined;
  if (url.startsWith("http")) return url;
  return MEDIA_BASE ? `${MEDIA_BASE}${url.startsWith("/") ? "" : "/"}${url}` : url;
}

/**
 * Resolve upload paths inside a block of body HTML.
 *
 * Every image on a page except the ones inside the body went through mediaUrl: the cover, the
 * author's headshot, the gallery. An image placed in the rich text editor is written into the body
 * as `src="/uploads/….webp"`, and the body was passed through untouched — so the browser resolved
 * that path against the website's own origin, where nothing is served, and every picture an editor
 * put inside an article was broken. The cover on the same article worked, which is what made it look
 * like the upload had succeeded.
 *
 * Applied to src and srcset. An absolute URL is left alone, exactly as mediaUrl leaves one alone.
 */
export function resolveBodyMedia(html: string, base: string): string {
  if (!base || !html) return html;
  const one = (path: string): string =>
    path.startsWith("http") || path.startsWith("data:")
      ? path
      : `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  return html
    .replace(/(<img\b[^>]*?\ssrc=")([^"]+)(")/gi, (_m, a: string, url: string, b: string) =>
      `${a}${one(url)}${b}`)
    .replace(/(<img\b[^>]*?\ssrcset=")([^"]+)(")/gi, (_m, a: string, set: string, b: string) => {
      const rewritten = set
        .split(",")
        .map((part) => {
          const trimmed = part.trim();
          const [url = "", ...rest] = trimmed.split(/\s+/);
          if (!url) return trimmed;
          return [one(url), ...rest].join(" ");
        })
        .join(", ");
      return `${a}${rewritten}${b}`;
    });
}

/** Everything a stored block of body HTML needs before it is rendered. */
function bodyMedia(html: string): string {
  return resolveBodyMedia(html, MEDIA_BASE);
}
/**
 * Postgres hands back timestamps as "2026-07-18 15:40:06.679264+01", which is not valid ISO 8601. Schema
 * dates and Open Graph article times must be ISO, so normalise every timestamp on the way out.
 */
function isoDate(value: unknown): string | undefined {
  const raw = typeof value === "string" && value.length > 0 ? value : undefined;
  if (!raw) return undefined;
  // Postgres writes the offset as "+01"; ECMAScript needs "+01:00", so pad it before parsing.
  const normalised = raw
    .replace(" ", "T")
    .replace(/([+-]\d{2})$/, "$1:00");
  const d = new Date(normalised);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

/** Spread helper for exactOptionalPropertyTypes: include the key only when defined. */
function opt<K extends string>(key: K, value: string | undefined): Record<K, string> | Record<string, never> {
  return value === undefined ? {} : ({ [key]: value } as Record<K, string>);
}
type Row = Record<string, unknown>;
/**
 * Run a CMS query, returning no rows rather than throwing.
 *
 * Returning `[]` is deliberate: a section with nothing in it beats a 500 for the whole page when the
 * CMS is briefly unreachable. But swallowing the error silently made a missing column, a dropped
 * connection and a typo in the SQL all look identical to "there is no content yet" — the site degraded
 * to empty pages with nothing anywhere saying why. The failure is logged so it is diagnosable; the page
 * still renders.
 */
async function query(sql: string, params: unknown[] = []): Promise<Row[]> {
  try {
    const { rows } = await cmsDb().query<Row>(sql, params);
    return rows;
  } catch (e) {
    // First line of the statement only: enough to identify which read failed, without putting the
    // whole query (and its parameters) into the logs.
    const which = sql.trim().split("\n")[0]?.trim() ?? "";
    const message = e instanceof Error ? e.message : String(e);
    console.error(`[cms] query failed: ${message} — ${which}`);
    if (failClosedAtBuild()) {
      throw new Error(
        `[cms] the CMS database was unreachable during the production build, so this build would ship ` +
        `a site with no insights, case studies, authors or legal copy, and an incomplete sitemap. ` +
        `Refusing to build. Fix the connection, or set CMS_ALLOW_EMPTY_BUILD=1 to build without content ` +
        `on purpose. Underlying error: ${message}`,
      );
    }
    return [];
  }
}

/**
 * Whether a failed read should stop a production build instead of quietly returning nothing.
 *
 * At runtime, empty is the right answer: one section missing beats a 500 for the whole page while the
 * CMS is briefly unreachable. At build time it is the wrong answer entirely. `generateStaticParams`
 * returning [] because the database timed out does not fail the build — it produces a site with no
 * articles, no case studies, no author pages and a sitemap that omits them, and it exits 0, so nothing
 * downstream notices until the live site is missing its content.
 *
 * NEXT_PHASE is set by Next only while building, so runtime behaviour is untouched.
 */
function failClosedAtBuild(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build"
    && process.env.CMS_ALLOW_EMPTY_BUILD !== "1";
}

function toAuthor(r: Row, prefix = ""): Author | undefined {
  const name = str(r[`${prefix}name`]);
  if (!name) return undefined;
  return {
    name,
    slug: nameSlug(name),
    ...opt("role", str(r[`${prefix}role`])),
    ...opt("bio", str(r[`${prefix}bio`])),
    ...opt("photoUrl", mediaUrl(r[`${prefix}photo`])),
    ...opt("photoAlt", str(r[`${prefix}photo_alt`])),
  };
}

// ----------------------------------------------------------------------------------------------------
// Proof: testimonials and case studies.
// ----------------------------------------------------------------------------------------------------

export async function getTestimonials(limit = 6): Promise<Testimonial[]> {
  const rows = await query(
    `SELECT title, body, excerpt, company, customer_title, featured_image, featured_image_alt
       FROM cms_content WHERE kind='testimonial' AND status='published'
      ORDER BY display_order, created_at DESC LIMIT $1`, [limit]);
  return rows
    .map((r) => ({
      quote: (str(r.body) ?? str(r.excerpt) ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
      authorName: str(r.title) ?? "",
      ...opt("authorRole", str(r.customer_title)),
      ...opt("company", str(r.company)),
      ...opt("avatarUrl", mediaUrl(r.featured_image)),
      ...opt("avatarAlt", str(r.featured_image_alt)),
    }))
    .filter((t) => t.quote && t.authorName);
}

/** Comma-separated CMS fields arrive as one string; an empty one is no items, not one empty item. */
function listOf(value: unknown): string[] {
  const raw = typeof value === "string" ? value : "";
  return raw.split(",").map((x) => x.trim()).filter(Boolean);
}

function galleryOf(value: unknown): CaseStudyImage[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((x): x is { url?: unknown; alt?: unknown } => typeof x === "object" && x !== null)
    .map((x) => ({ url: mediaUrl(x.url) ?? "", alt: str(x.alt) ?? "" }))
    .filter((x) => x.url);
}

const CASE_STUDY_COLS = `title, slug, body, excerpt, featured_image, featured_image_alt, gallery,
        service_industry, highlights, technologies, service_paths,
        published_at::text AS published_at, updated_at::text AS updated_at,
        meta_title, meta_description`;

/** One case study by slug, with its gallery. */
export async function getCaseStudy(slug: string): Promise<CaseStudy | null> {
  const rows = await query(
    `SELECT ${CASE_STUDY_COLS} FROM cms_content
      WHERE kind='case_study' AND status='published' AND slug=$1 LIMIT 1`, [slug]);
  const r = rows[0];
  const title = r ? str(r.title) : undefined;
  if (!r || !title) return null;
  return {
    title,
    slug,
    body: bodyMedia(str(r.body) ?? ""),
    ...opt("summary", str(r.excerpt)),
    ...opt("coverUrl", mediaUrl(r.featured_image)),
    ...opt("coverAlt", str(r.featured_image_alt)),
    gallery: galleryOf(r.gallery),
    ...opt("industry", str(r.service_industry)),
    highlights: listOf(r.highlights),
    technologies: listOf(r.technologies),
    servicePaths: Array.isArray(r.service_paths) ? r.service_paths.map(String) : [],
    ...opt("publishedAt", isoDate(r.published_at)),
    ...opt("updatedAt", isoDate(r.updated_at)),
    ...opt("metaTitle", str(r.meta_title)),
    ...opt("metaDescription", str(r.meta_description)),
  };
}

/** Every published case study slug, for static generation and the sitemap. */
export async function getCaseStudySlugs(): Promise<string[]> {
  const rows = await query(
    "SELECT slug FROM cms_content WHERE kind='case_study' AND status='published' AND slug IS NOT NULL LIMIT 200");
  return rows.map((r) => str(r.slug)).filter((s): s is string => Boolean(s));
}

/**
 * The case studies that prove a given service, for that service page's proof section.
 *
 * Those sections rendered fixed placeholder cards reading "Verified project card · loaded from case
 * studies", which is what they said and not what they did. A case study now names the services it is
 * proof for, so the section can ask for the real work.
 */
export async function getCaseStudiesForService(servicePath: string, limit = 3): Promise<CaseStudyCard[]> {
  const rows = await query(
    `SELECT title, slug, excerpt, featured_image, featured_image_alt, service_industry
       FROM cms_content
      WHERE kind='case_study' AND status='published' AND $1 = ANY(service_paths)
      ORDER BY featured DESC, display_order, created_at DESC LIMIT $2`, [servicePath, limit]);
  return rows
    .map((r) => ({
      title: str(r.title) ?? "",
      slug: str(r.slug) ?? "",
      ...opt("summary", str(r.excerpt)),
      ...opt("coverUrl", mediaUrl(r.featured_image)),
      ...opt("coverAlt", str(r.featured_image_alt)),
      ...opt("industry", str(r.service_industry)),
      metrics: [] as Metric[],
    }))
    .filter((c) => c.title && c.slug);
}

/**
 * Every published case study, for the hub.
 *
 * The hub showed three placeholder cards ("Verified case study", "Industry · Service · Outcome") no
 * matter what the CMS held, and the filter tabs above them changed nothing. Real records go in the grid
 * now; the placeholders stay only for the case they were written for, which is having none yet.
 */
export async function getAllCaseStudies(): Promise<CaseStudyCard[]> {
  const rows = await query(
    `SELECT title, slug, excerpt, featured_image, featured_image_alt, service_industry
       FROM cms_content WHERE kind='case_study' AND status='published'
      ORDER BY featured DESC, display_order, created_at DESC`);
  return rows
    .map((r) => ({
      title: str(r.title) ?? "",
      slug: str(r.slug) ?? "",
      ...opt("summary", str(r.excerpt)),
      ...opt("coverUrl", mediaUrl(r.featured_image)),
      ...opt("coverAlt", str(r.featured_image_alt)),
      ...opt("industry", str(r.service_industry)),
      metrics: [] as Metric[],
    }))
    .filter((c) => c.title && c.slug);
}

/*
 * `getFeaturedCaseStudies` stood here, reading published case studies ordered by a `featured` flag.
 * Its only caller was the home ProofBand, which the current home page does not render, so the query
 * ran nowhere. `getCaseStudiesForService` and `getAllCaseStudies` above are the live readers.
 */

// ----------------------------------------------------------------------------------------------------
// Insights.
// ----------------------------------------------------------------------------------------------------

function toInsightCard(r: Row): InsightCard {
  return {
    /*
     * The article's own title, not the short one.
     *
     * The short title exists for places where a title has to fit a small fixed space - a breadcrumb,
     * a related-articles strip - and a card is not one of those: it has two full lines and an
     * excerpt beneath it. Preferring the short form meant a listing advertised a different headline
     * from the page it opened, which reads as a mistake and costs the article the words it was
     * written to be found by.
     */
    title: str(r.title) ?? str(r.short_title) ?? "",
    slug: str(r.slug) ?? "",
    ...opt("excerpt", str(r.excerpt)),
    ...opt("publishedAt", isoDate(r.published_at)),
    ...opt("coverUrl", mediaUrl(r.featured_image)),
    ...opt("coverAlt", str(r.featured_image_alt)),
    ...opt("author", str(r.author_name)),
    ...opt("authorPhotoUrl", mediaUrl(r.author_photo)),
    ...opt("authorSlug", str(r.author_name) ? nameSlug(str(r.author_name)!) : undefined),
    ...opt("category", str(r.category_name)),
    ...opt("categorySlug", str(r.category_slug)),
    ...(typeof r.read_time_min === "number" ? { readMinutes: r.read_time_min } : {}),
  };
}
const INSIGHT_CARD_COLS = `c.title, c.short_title, c.slug, c.excerpt, c.published_at::text AS published_at,
  c.featured_image, c.featured_image_alt, c.read_time_min, a.name AS author_name,
  a.headshot_url AS author_photo, cat.name AS category_name, cat.slug AS category_slug`;
const INSIGHT_CARD_FROM =
  "FROM cms_content c LEFT JOIN cms_author a ON a.id = c.author_id LEFT JOIN cms_category cat ON cat.id = c.category_id";

export async function getLatestInsights(limit = 3): Promise<InsightCard[]> {
  const rows = await query(
    `SELECT ${INSIGHT_CARD_COLS} ${INSIGHT_CARD_FROM} WHERE c.kind='insight' AND c.status='published'
      ORDER BY c.published_at DESC NULLS LAST LIMIT $1`, [limit]);
  return rows.map(toInsightCard).filter((i) => i.title && i.slug);
}

export async function getAllInsightCards(limit = 100): Promise<InsightCard[]> {
  const rows = await query(
    `SELECT ${INSIGHT_CARD_COLS} ${INSIGHT_CARD_FROM} WHERE c.kind='insight' AND c.status='published'
      ORDER BY c.published_at DESC NULLS LAST LIMIT $1`, [limit]);
  return rows.map(toInsightCard).filter((i) => i.title && i.slug);
}

/** Published, indexable article slugs — for static generation and the sitemap. */
export async function getInsightSlugs(): Promise<string[]> {
  const rows = await query(
    "SELECT slug FROM cms_content WHERE kind='insight' AND status='published' AND noindex=false AND slug IS NOT NULL LIMIT 500");
  return rows.map((r) => str(r.slug)).filter((s): s is string => Boolean(s));
}

function faqsOf(value: unknown): FaqItem[] {
  return Array.isArray(value)
    ? (value as Row[]).map((f) => ({ question: str(f.question) ?? "", answer: str(f.answer) ?? "" })).filter((f) => f.question && f.answer)
    : [];
}

export async function getInsight(slug: string): Promise<Insight | null> {
  const rows = await query(
    `SELECT c.title, c.short_title, c.slug, c.body, c.excerpt, c.tldr, c.faqs, c.noindex, c.meta_title, c.meta_description, c.schema_type,
            c.published_at::text AS published_at, c.updated_at::text AS updated_at,
            c.featured_image, c.featured_image_alt, cat.name AS category,
            a.name AS a_name, a.job_title AS a_role, COALESCE(c.author_bio, a.bio) AS a_bio,
            a.headshot_url AS a_photo, a.headshot_alt AS a_photo_alt,
            fc.name AS fc_name, fc.job_title AS fc_role, COALESCE(c.fact_checker_bio, fc.bio) AS fc_bio,
            fc.headshot_url AS fc_photo, fc.headshot_alt AS fc_photo_alt
       FROM cms_content c
       LEFT JOIN cms_category cat ON cat.id = c.category_id
       LEFT JOIN cms_author a ON a.id = c.author_id
       LEFT JOIN cms_author fc ON fc.id = c.fact_checker_id
      WHERE c.kind='insight' AND c.status='published' AND c.slug=$1 LIMIT 1`, [slug]);
  const r = rows[0];
  const title = r ? str(r.title) : undefined;
  if (!r || !title) return null;
  const author = toAuthor(r, "a_");
  const factChecker = toAuthor(r, "fc_");
  // Kept as a list. Joining it here is what turned the short version into a wall of text.
  const tldrRaw = r.tldr;
  const tldr = Array.isArray(tldrRaw)
    // Through str(), like every other prose field, so a date token in a TL;DR bullet resolves too.
    // These were mapped with a bare String() and were the one reader-facing text that did not.
    ? (tldrRaw as unknown[]).map((x) => str(String(x).trim()) ?? "").filter(Boolean)
    : (str(tldrRaw) ? [str(tldrRaw) as string] : []);
  return {
    title,
    // The design uses the short title where the full one would not fit: breadcrumbs and cards.
    ...opt("shortTitle", str(r.short_title)),
    slug,
    body: bodyMedia(str(r.body) ?? ""),
    faq: faqsOf(r.faqs),
    noIndex: Boolean(r.noindex),
    ...opt("excerpt", str(r.excerpt)),
    ...(tldr.length > 0 ? { tldr } : {}),
    ...opt("publishedAt", isoDate(r.published_at)),
    ...opt("updatedAt", isoDate(r.updated_at)),
    ...opt("coverUrl", mediaUrl(r.featured_image)),
    ...opt("coverAlt", str(r.featured_image_alt)),
    ...opt("category", str(r.category)),
    ...opt("metaTitle", str(r.meta_title)),
    ...opt("metaDescription", str(r.meta_description)),
    ...opt("schemaType", str(r.schema_type)),
    ...(author ? { author } : {}),
    ...(factChecker ? { factChecker } : {}),
  };
}

// ----------------------------------------------------------------------------------------------------
// Authors, careers, and legal pages.
// ----------------------------------------------------------------------------------------------------

/**
 * A full author profile. `bio` is the short paragraph that appears under an article; `profileHtml` is
 * the page the author wrote about themselves, which is what the profile page is for. Social handles
 * feed both the visible links and schema.org sameAs.
 */
export interface AuthorProfile extends Author {
  photoUrl?: string; photoAlt?: string; profileHtml?: string;
  metaTitle?: string; metaDescription?: string; x?: string;
  expertise: string[]; location?: string; yearsExperience?: number;
  /** Generated in the CMS and rendered with FAQPage schema, the same as an article's. */
  faq: FaqItem[];
}
export interface JobCard { title: string; slug: string; location?: string; department?: string; employmentType?: string; remote?: boolean; summary?: string }
export interface Job extends JobCard { description: string; applyEmail?: string; applyUrl?: string; publishedAt?: string }
/** One numbered section of a policy. `body` is sanitised HTML, not markdown. */
export interface LegalSection { heading: string; id: string; body: string; plainSummary?: string }
export interface LegalPage { title: string; shortTitle?: string; intro?: string; effectiveDate?: string; sections: LegalSection[] }
export type LegalType = "privacy-policy" | "terms-of-service" | "cookie-policy";

export async function getAuthorSlugs(): Promise<string[]> {
  const rows = await query("SELECT name FROM cms_author WHERE active AND show_on_website AND name IS NOT NULL");
  return rows.map((r) => str(r.name)).filter((s): s is string => Boolean(s)).map(nameSlug);
}

export async function getAuthor(slug: string): Promise<AuthorProfile | null> {
  const rows = await query(
    `SELECT name, job_title AS role, bio, headshot_url, headshot_alt, profile_html, meta_title,
            meta_description, linkedin_url, x_url, expertise, location, years_experience, faqs
       FROM cms_author WHERE active AND show_on_website AND name IS NOT NULL`);
  const r = rows.find((x) => nameSlug(str(x.name) ?? "") === slug);
  const author = r ? toAuthor(r) : undefined;
  if (!author || !r) return null;
  const years = Number(r.years_experience);
  return {
    ...author,
    expertise: Array.isArray(r.expertise) ? r.expertise.map(String).filter(Boolean) : [],
    faq: faqsOf(r.faqs),
    ...opt("photoUrl", mediaUrl(r.headshot_url)),
    ...opt("photoAlt", str(r.headshot_alt)),
    ...opt("profileHtml", bodyMedia(str(r.profile_html) ?? "") || undefined),
    ...opt("metaTitle", str(r.meta_title)),
    ...opt("metaDescription", str(r.meta_description)),
    // toAuthor does not carry links; the profile page renders and cites both.
    ...opt("linkedin", str(r.linkedin_url)),
    ...opt("x", str(r.x_url)),
    ...opt("location", str(r.location)),
    ...(Number.isFinite(years) && years > 0 ? { yearsExperience: years } : {}),
  };
}

export async function getArticlesByAuthor(slug: string): Promise<InsightCard[]> {
  const rows = await query(
    // The same columns a card gets anywhere else, so an article listed on an author's page carries
    // its category and cover exactly as it does on the Insights hub.
    `SELECT ${INSIGHT_CARD_COLS}, a.name AS a_name ${INSIGHT_CARD_FROM}
      WHERE c.kind='insight' AND c.status='published'
      ORDER BY c.published_at DESC NULLS LAST LIMIT 200`);
  return rows
    .filter((r) => nameSlug(str(r.a_name) ?? "") === slug)
    .map(toInsightCard)
    .filter((i) => i.title && i.slug)
    .slice(0, 50);
}

function toJobCard(r: Row): JobCard {
  return {
    title: str(r.title) ?? "",
    slug: str(r.slug) ?? "",
    ...opt("location", str(r.job_location)),
    ...opt("department", str(r.department)),
    ...opt("employmentType", str(r.employment_type)),
    ...(str(r.work_mode) ? { remote: /remote/i.test(String(r.work_mode)) } : {}),
    ...opt("summary", str(r.excerpt)),
  };
}
const JOB_COLS = "title, slug, job_location, department, employment_type, work_mode, excerpt";

export async function getJobs(): Promise<JobCard[]> {
  const rows = await query(
    `SELECT ${JOB_COLS} FROM cms_content WHERE kind='job' AND status='published'
      ORDER BY featured DESC, created_at DESC LIMIT 100`);
  return rows.map(toJobCard).filter((j) => j.title && j.slug);
}

export async function getJobSlugs(): Promise<string[]> {
  const rows = await query("SELECT slug FROM cms_content WHERE kind='job' AND status='published' AND slug IS NOT NULL LIMIT 300");
  return rows.map((r) => str(r.slug)).filter((s): s is string => Boolean(s));
}

export async function getJob(slug: string): Promise<Job | null> {
  const rows = await query(
    `SELECT ${JOB_COLS}, body, published_at::text AS published_at
       FROM cms_content WHERE kind='job' AND status='published' AND slug=$1 LIMIT 1`, [slug]);
  const r = rows[0];
  if (!r) return null;
  const card = toJobCard(r);
  if (!card.title) return null;
  return {
    ...card,
    description: bodyMedia(str(r.body) ?? ""),
    ...opt("publishedAt", isoDate(r.published_at)),
  };
}

export async function getLegalPage(type: LegalType): Promise<LegalPage | null> {
  const rows = await query(
    `SELECT title, short_title, body, excerpt, effective_date::text AS effective_date
       FROM cms_content WHERE kind='legal_page' AND status='published' AND slug=$1 LIMIT 1`, [type]);
  const r = rows[0];
  const title = r ? str(r.title) : undefined;
  if (!r || !title) return null;
  const body = bodyMedia(str(r.body) ?? "") || undefined;
  return {
    title,
    ...opt("shortTitle", str(r.short_title)),
    // Split on the headings the editor wrote, so the contents list has real entries and each section
    // carries its own number. The whole document used to arrive as one section with a blank heading,
    // which is why the table of contents showed a single empty item and the body rendered as one wall.
    /*
     * Tables get the same frame an article's do.
     *
     * A policy table arrived as a bare <table> with nothing around it, so it had no border, no
     * rounded frame, and no way to scroll on a phone: on a narrow screen it simply pushed the page
     * sideways. wrapTables is what the article page has always called; the legal page never did.
     */
    sections: body
      ? splitSections(body).map((x) => ({ heading: x.heading, id: x.id, body: wrapTables(x.html) }))
      : [],
    ...opt("intro", str(r.excerpt)),
    ...opt("effectiveDate", isoDate(r.effective_date)),
  };
}

// ----------------------------------------------------------------------------------------------------
// Programmatic SEO pages (generated_page). Only published, indexable pages are returned.
// ----------------------------------------------------------------------------------------------------

export interface MatrixRow { feature: string; value: string }
export interface PseoSource { label: string; url?: string }
export interface PseoPage {
  slug: string; h1: string; intent: "capability" | "cost" | "comparison";
  industryLabel?: string; techLabel?: string; location?: string; summary?: string; body?: string;
  painPoints?: string; pricing?: string; comparison?: string;
  featureMatrix: MatrixRow[]; dataSources: PseoSource[]; localDataPoints: PseoSource[];
  faq: FaqItem[]; author?: Author; factChecker?: Author;
  metaTitle?: string; metaDescription?: string; noIndex: boolean;
  /** The category the page was filed under in the CMS, shown on the page and used in its breadcrumb. */
  category?: string; categorySlug?: string;
}

function intentOf(searchIntent: string | undefined): PseoPage["intent"] {
  const s = (searchIntent ?? "").toLowerCase();
  if (s.includes("transaction") || s.includes("commercial") || s.includes("cost") || s.includes("price")) return "cost";
  if (s.includes("comparison") || s.includes("navigational")) return "comparison";
  return "capability";
}

export async function getPseoSlugs(): Promise<string[]> {
  const rows = await query("SELECT slug FROM cms_content WHERE kind='generated_page' AND status='published' AND noindex=false AND slug IS NOT NULL LIMIT 2000");
  return rows.map((r) => str(r.slug)).filter((s): s is string => Boolean(s));
}

export async function getPseoPage(slug: string): Promise<PseoPage | null> {
  const rows = await query(
    `SELECT c.title, c.slug, c.body, c.excerpt, c.faqs, c.noindex, c.industry, c.target_keyword,
            c.target_location, c.search_intent, c.meta_title, c.meta_description,
            a.name AS a_name, a.job_title AS a_role, COALESCE(c.author_bio, a.bio) AS a_bio,
            fc.name AS fc_name, fc.job_title AS fc_role, COALESCE(c.fact_checker_bio, fc.bio) AS fc_bio,
            cat.name AS cat_name, cat.slug AS cat_slug
       FROM cms_content c
       LEFT JOIN cms_author a ON a.id = c.author_id
       LEFT JOIN cms_author fc ON fc.id = c.fact_checker_id
       LEFT JOIN cms_category cat ON cat.id = c.category_id
      WHERE c.kind='generated_page' AND c.status='published' AND c.slug=$1 LIMIT 1`, [slug]);
  const r = rows[0];
  const h1 = r ? str(r.title) : undefined;
  if (!r || !h1) return null;
  const author = toAuthor(r, "a_");
  const factChecker = toAuthor(r, "fc_");
  return {
    slug,
    h1,
    intent: intentOf(str(r.search_intent)),
    featureMatrix: [],
    dataSources: [],
    localDataPoints: [],
    faq: faqsOf(r.faqs),
    noIndex: Boolean(r.noindex),
    ...opt("industryLabel", str(r.industry)),
    ...opt("techLabel", str(r.target_keyword)),
    ...opt("location", str(r.target_location)),
    ...opt("summary", str(r.excerpt)),
    ...opt("body", bodyMedia(str(r.body) ?? "") || undefined),
    ...(author ? { author } : {}),
    ...(factChecker ? { factChecker } : {}),
    ...opt("metaTitle", str(r.meta_title)),
    ...opt("metaDescription", str(r.meta_description)),
    ...opt("category", str(r.cat_name)),
    ...opt("categorySlug", str(r.cat_slug)),
  };
}

/** A category as the filter bar needs it: the short label it shows and the slug it filters on. */
export interface CategoryTab { name: string; shortName: string; slug: string }

/**
 * The categories that actually have something published in them.
 *
 * A filter bar offering a tab that returns nothing is worse than one tab fewer: the reader clicks
 * it, gets an empty page, and learns not to trust the bar. The count is done in SQL rather than by
 * filtering the cards afterwards, so the bar is right even when the listing is paginated later.
 */
export async function getCategoryTabs(): Promise<CategoryTab[]> {
  const rows = await query(
    `SELECT cat.name, cat.short_name, cat.slug, count(c.id) AS n
       FROM cms_category cat
       JOIN cms_content c
         ON c.category_id = cat.id AND c.kind = 'insight' AND c.status = 'published'
      WHERE cat.active
      GROUP BY cat.id, cat.name, cat.short_name, cat.slug
      HAVING count(c.id) > 0
      ORDER BY count(c.id) DESC, cat.name`,
  );
  return rows
    .map((r) => ({
      name: str(r.name) ?? "",
      shortName: str(r.short_name) ?? str(r.name) ?? "",
      slug: str(r.slug) ?? "",
    }))
    .filter((c) => c.name && c.slug);
}
