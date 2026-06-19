/**
 * The cached content-API client for the Strapi CMS (PRD 6.3). It fetches published proof and
 * Insights content for the website, with ISR caching and graceful degradation: any failure or
 * absence returns an empty result so a page never breaks when the CMS is unavailable or has no
 * content yet ("absent proof renders nothing"). The CMS origin stays server-side.
 */
const CMS_API = process.env.CMS_CONTENT_API_URL ?? "http://localhost:1337/api";
const MEDIA_BASE = CMS_API.replace(/\/api\/?$/, "");
const REVALIDATE_SECONDS = 300;

export interface Metric {
  label: string;
  value: string;
}
export interface Testimonial {
  quote: string;
  authorName: string;
  authorRole?: string;
  company?: string;
  avatarUrl?: string;
}
export interface CaseStudyCard {
  title: string;
  slug: string;
  summary?: string;
  coverUrl?: string;
  metrics: Metric[];
}
export interface InsightCard {
  title: string;
  slug: string;
  excerpt?: string;
  publishedAt?: string;
  coverUrl?: string;
}
export interface Author {
  name: string;
  slug?: string;
  role?: string;
  linkedin?: string;
  bio?: string;
}
export interface FaqItem {
  question: string;
  answer: string;
}
export interface Insight {
  title: string;
  slug: string;
  body: string;
  excerpt?: string;
  tldr?: string;
  publishedAt?: string;
  updatedAt?: string;
  coverUrl?: string;
  category?: string;
  author?: Author;
  factChecker?: Author;
  faq: FaqItem[];
}

/** Resolve a Strapi media URL to an absolute one. */
function mediaUrl(media: unknown): string | undefined {
  const url = (media as { url?: unknown } | null)?.url;
  if (typeof url !== "string" || url.length === 0) return undefined;
  return url.startsWith("http") ? url : `${MEDIA_BASE}${url}`;
}

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/** Fetch a CMS collection, returning [] on any error or absence (graceful degradation). */
async function fetchCollection(
  path: string,
): Promise<Record<string, unknown>[]> {
  try {
    const response = await fetch(`${CMS_API}${path}`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!response.ok) return [];
    const json = (await response.json()) as { data?: unknown };
    return Array.isArray(json.data)
      ? (json.data as Record<string, unknown>[])
      : [];
  } catch {
    return [];
  }
}

/** Fetch a CMS single type, returning null on any error or absence. */
async function fetchSingle(
  path: string,
): Promise<Record<string, unknown> | null> {
  try {
    const response = await fetch(`${CMS_API}${path}`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!response.ok) return null;
    const json = (await response.json()) as { data?: unknown };
    return json.data && typeof json.data === "object"
      ? (json.data as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/** Spread helper for exactOptionalPropertyTypes: include the key only when defined. */
function opt<K extends string>(
  key: K,
  value: string | undefined,
): Record<K, string> | Record<string, never> {
  return value === undefined ? {} : ({ [key]: value } as Record<K, string>);
}

export async function getTestimonials(limit = 6): Promise<Testimonial[]> {
  const rows = await fetchCollection(
    `/testimonials?populate=avatar&sort=createdAt:desc&pagination[limit]=${limit}`,
  );
  return rows
    .map((r) => ({
      quote: str(r.quote) ?? "",
      authorName: str(r.authorName) ?? "",
      ...opt("authorRole", str(r.authorRole)),
      ...opt("company", str(r.company)),
      ...opt("avatarUrl", mediaUrl(r.avatar)),
    }))
    .filter((t) => t.quote && t.authorName);
}

export async function getFeaturedCaseStudies(limit = 2): Promise<CaseStudyCard[]> {
  const rows = await fetchCollection(
    `/case-studies?populate=cover&populate=metrics&sort=createdAt:desc&pagination[limit]=${limit}`,
  );
  return rows
    .map((r) => ({
      title: str(r.title) ?? "",
      slug: str(r.slug) ?? "",
      ...opt("summary", str(r.summary)),
      ...opt("coverUrl", mediaUrl(r.cover)),
      metrics: Array.isArray(r.metrics)
        ? (r.metrics as Record<string, unknown>[])
            .map((m) => ({ label: str(m.label) ?? "", value: str(m.value) ?? "" }))
            .filter((m) => m.label && m.value)
        : [],
    }))
    .filter((c) => c.title && c.slug);
}

function toInsightCard(r: Record<string, unknown>): InsightCard {
  return {
    title: str(r.title) ?? "",
    slug: str(r.slug) ?? "",
    ...opt("excerpt", str(r.excerpt)),
    ...opt("publishedAt", str(r.publishedAt)),
    ...opt("coverUrl", mediaUrl(r.cover)),
  };
}

export async function getLatestInsights(limit = 3): Promise<InsightCard[]> {
  const rows = await fetchCollection(
    `/insights?populate=cover&sort=publishedAt:desc&pagination[limit]=${limit}`,
  );
  return rows.map(toInsightCard).filter((i) => i.title && i.slug);
}

/** Every published article, newest first, for the Insights hub. */
export async function getAllInsightCards(limit = 100): Promise<InsightCard[]> {
  const rows = await fetchCollection(
    `/insights?populate=cover&sort=publishedAt:desc&pagination[limit]=${limit}`,
  );
  return rows.map(toInsightCard).filter((i) => i.title && i.slug);
}

/** Published article slugs, for static generation of the article routes. */
export async function getInsightSlugs(): Promise<string[]> {
  const rows = await fetchCollection(
    `/insights?fields[0]=slug&pagination[limit]=200`,
  );
  return rows.map((r) => str(r.slug)).filter((s): s is string => Boolean(s));
}

function toAuthor(value: unknown): Author | undefined {
  if (!value || typeof value !== "object") return undefined;
  const a = value as Record<string, unknown>;
  const name = str(a.name);
  if (!name) return undefined;
  return {
    name,
    ...opt("slug", str(a.slug)),
    ...opt("role", str(a.role)),
    ...opt("linkedin", str(a.linkedin)),
    ...opt("bio", str(a.bio)),
  };
}

/** A single published article by slug, with author, fact-checker, category, and FAQ. */
export async function getInsight(slug: string): Promise<Insight | null> {
  const rows = await fetchCollection(
    `/insights?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=*`,
  );
  const r = rows[0];
  if (!r) return null;
  const title = str(r.title);
  if (!title) return null;

  const author = toAuthor(r.author);
  const factChecker = toAuthor(r.factChecker);
  const category =
    typeof r.category === "object" && r.category !== null
      ? str((r.category as Record<string, unknown>).name)
      : undefined;
  const faq = Array.isArray(r.faq)
    ? (r.faq as Record<string, unknown>[])
        .map((f) => ({ question: str(f.question) ?? "", answer: str(f.answer) ?? "" }))
        .filter((f) => f.question && f.answer)
    : [];

  return {
    title,
    slug,
    body: str(r.body) ?? "",
    faq,
    ...opt("excerpt", str(r.excerpt)),
    ...opt("tldr", str(r.tldr)),
    ...opt("publishedAt", str(r.publishedAt)),
    ...opt("updatedAt", str(r.updatedAt)),
    ...opt("coverUrl", mediaUrl(r.cover)),
    ...opt("category", category),
    ...(author ? { author } : {}),
    ...(factChecker ? { factChecker } : {}),
  };
}

// ----------------------------------------------------------------------------------------------------
// Authors, careers, and legal pages.
// ----------------------------------------------------------------------------------------------------

export interface AuthorProfile extends Author {
  photoUrl?: string;
}
export interface JobCard {
  title: string;
  slug: string;
  location?: string;
  department?: string;
  employmentType?: string;
  remote?: boolean;
  summary?: string;
}
export interface Job extends JobCard {
  description: string;
  applyEmail?: string;
  applyUrl?: string;
  publishedAt?: string;
}
export interface LegalSection {
  heading: string;
  body: string;
  plainSummary?: string;
}
export interface LegalPage {
  title: string;
  intro?: string;
  effectiveDate?: string;
  sections: LegalSection[];
}

export type LegalType =
  | "privacy-policy"
  | "terms-of-service"
  | "cookie-policy";

export async function getAuthorSlugs(): Promise<string[]> {
  const rows = await fetchCollection(
    `/authors?fields[0]=slug&pagination[limit]=200`,
  );
  return rows.map((r) => str(r.slug)).filter((s): s is string => Boolean(s));
}

export async function getAuthor(slug: string): Promise<AuthorProfile | null> {
  const rows = await fetchCollection(
    `/authors?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=photo`,
  );
  const r = rows[0];
  if (!r) return null;
  const author = toAuthor(r);
  if (!author) return null;
  const photoUrl = mediaUrl(r.photo);
  return { ...author, ...opt("photoUrl", photoUrl) };
}

export async function getArticlesByAuthor(slug: string): Promise<InsightCard[]> {
  const rows = await fetchCollection(
    `/insights?filters[author][slug][$eq]=${encodeURIComponent(slug)}&populate=cover&sort=publishedAt:desc&pagination[limit]=50`,
  );
  return rows.map(toInsightCard).filter((i) => i.title && i.slug);
}

function toJobCard(r: Record<string, unknown>): JobCard {
  return {
    title: str(r.title) ?? "",
    slug: str(r.slug) ?? "",
    ...opt("location", str(r.location)),
    ...opt("department", str(r.department)),
    ...opt("employmentType", str(r.employmentType)),
    ...(typeof r.remote === "boolean" ? { remote: r.remote } : {}),
    ...opt("summary", str(r.summary)),
  };
}

export async function getJobs(): Promise<JobCard[]> {
  const rows = await fetchCollection(
    `/jobs?sort=createdAt:desc&pagination[limit]=100`,
  );
  return rows.map(toJobCard).filter((j) => j.title && j.slug);
}

export async function getJobSlugs(): Promise<string[]> {
  const rows = await fetchCollection(
    `/jobs?fields[0]=slug&pagination[limit]=200`,
  );
  return rows.map((r) => str(r.slug)).filter((s): s is string => Boolean(s));
}

export async function getJob(slug: string): Promise<Job | null> {
  const rows = await fetchCollection(
    `/jobs?filters[slug][$eq]=${encodeURIComponent(slug)}`,
  );
  const r = rows[0];
  if (!r) return null;
  const card = toJobCard(r);
  if (!card.title) return null;
  return {
    ...card,
    description: str(r.description) ?? "",
    ...opt("applyEmail", str(r.applyEmail)),
    ...opt("applyUrl", str(r.applyUrl)),
    ...opt("publishedAt", str(r.publishedAt)),
  };
}

export async function getLegalPage(type: LegalType): Promise<LegalPage | null> {
  const r = await fetchSingle(`/${type}?populate=sections`);
  if (!r) return null;
  const title = str(r.title);
  if (!title) return null;
  const sections = Array.isArray(r.sections)
    ? (r.sections as Record<string, unknown>[])
        .map((s) => ({
          heading: str(s.heading) ?? "",
          body: str(s.body) ?? "",
          ...opt("plainSummary", str(s.plainSummary)),
        }))
        .filter((s) => s.heading && s.body)
    : [];
  return {
    title,
    sections,
    ...opt("intro", str(r.intro)),
    ...opt("effectiveDate", str(r.effectiveDate)),
  };
}
