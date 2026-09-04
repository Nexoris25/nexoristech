/**
 * Every page Oge may suggest linking to.
 *
 * The Insights editor offered other insights and nothing else, so an article about automation could
 * never be linked to the Business Process Automation service page it is actually about — the page a
 * reader wants next, and the one an internal link is most worth passing authority to. The programmatic
 * editor was a little better and still saw no service, industry, contact or legal page.
 *
 * The marketing site's own pages are not CMS rows, so they cannot come out of a query. They come from
 * site-pages.ts, which exists to mirror apps/web/src/content and is what every SEO screen already
 * reads, so there is one list to keep in step rather than two.
 *
 * Titles matter here: they are all the model gets to judge relevance by, and all the fallback has to
 * find an anchor phrase in. "Fintech Software Development" can be matched against an article about
 * fintech; "/fintech-software" cannot.
 */
import type { Pool } from "pg";
import {
  CORE_PAGES,
  SERVICE_PAGES,
  INDUSTRY_PAGES,
  LEGAL_ROUTES,
  SERVICE_LABELS,
} from "./site-pages.js";

export interface LinkCandidate {
  title: string;
  url: string;
}

/** Readable names for the pages that are not services, so every candidate reads like a page. */
const PAGE_LABELS: Record<string, string> = {
  "/": "Nexoris Technologies Home",
  "/about": "About Nexoris Technologies",
  "/how-we-work": "How We Work: Our Delivery Process",
  "/case-studies": "Case Studies and Client Projects",
  "/contact": "Contact Nexoris Technologies",
  "/privacy-policy": "Privacy Policy",
  "/terms-of-service": "Terms of Service",
  "/cookie-policy": "Cookie Policy",
};

/**
 * An industry page's name, from its path.
 *
 * Every industry route ends in "-software" or names its sector directly, so the path carries the
 * whole of the title: "/fintech-software" is "Fintech Software". Written out rather than guessed
 * only where the path would read wrongly.
 */
const INDUSTRY_LABELS: Record<string, string> = {
  "/government-digital-solutions": "Government Digital Solutions",
  "/professional-services-software": "Software for Law and Accounting Firms",
  "/fitness-wellness-software": "Salon, Spa and Gym Software",
  "/media-entertainment-software": "Media and Entertainment Software",
  "/ngo-software": "NGO and Non-Profit Software",
  "/church-management-software": "Church Management Software",
  "/retail-ecommerce-software": "Retail and E-commerce Software",
};

const titleCase = (path: string): string =>
  path
    .split("/")
    .filter(Boolean)
    .pop()!
    .split("-")
    .map((w) => (/^(ai|seo|geo|iot|hr|ngo|pos)$/i.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");

/** The marketing site's fixed pages: core, services, industries and legal. */
export function staticLinkCandidates(): LinkCandidate[] {
  return [
    ...CORE_PAGES.map((p) => ({ title: PAGE_LABELS[p] ?? titleCase(p), url: p })),
    ...SERVICE_PAGES.map((p) => ({ title: SERVICE_LABELS[p] ?? titleCase(p), url: p })),
    ...INDUSTRY_PAGES.map((p) => ({ title: INDUSTRY_LABELS[p] ?? titleCase(p), url: p })),
    ...LEGAL_ROUTES.map((p) => ({ title: PAGE_LABELS[p] ?? titleCase(p), url: p })),
  ];
}

/** Where a published CMS item lives on the site. */
function cmsPath(kind: string, slug: string): string {
  if (kind === "insight") return `/insights/${slug}`;
  if (kind === "case_study") return `/case-studies/${slug}`;
  return `/${slug}`;
}

/**
 * Everything Oge may link to from the piece being edited: published CMS content, then the marketing
 * site's own pages. `excludeId` keeps a page from being offered a link to itself.
 *
 * The CMS content comes first because it is the part that changes; the fixed pages are always there
 * and the model sees the whole list either way.
 */
export async function linkCandidates(pool: Pool, excludeId?: string): Promise<LinkCandidate[]> {
  let published: LinkCandidate[] = [];
  try {
    const { rows } = await pool.query<{ title: string; slug: string; kind: string }>(
      `SELECT title, slug, kind FROM cms_content
        WHERE status='published' AND slug IS NOT NULL
          AND kind IN ('insight','case_study','generated_page')
          AND ($1::uuid IS NULL OR id <> $1::uuid)
        ORDER BY published_at DESC NULLS LAST LIMIT 60`,
      [excludeId ?? null],
    );
    published = rows.map((r) => ({ title: r.title, url: cmsPath(r.kind, r.slug) }));
  } catch {
    // The fixed pages are still worth offering when the query fails.
    published = [];
  }

  const seen = new Set(published.map((c) => c.url));
  return [...published, ...staticLinkCandidates().filter((c) => !seen.has(c.url))];
}
