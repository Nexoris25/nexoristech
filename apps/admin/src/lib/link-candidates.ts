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
import { CORE_PAGES, SERVICE_PAGES, INDUSTRY_PAGES, LEGAL_ROUTES } from "./site-pages.js";

export interface LinkCandidate {
  title: string;
  url: string;
}

/**
 * The real name of every fixed page, as the site itself publishes it.
 *
 * These used to be guessed from the path, and the guesses were poor enough to break the ranking.
 * "/healthcare-software" became "Healthcare Software", which offers one matchable word once the
 * generic "software" is discounted — so an article that says "hospital" fifty-four times and
 * "clinic" twenty-nine never scored against it, and the Healthcare page was never suggested. The
 * page's real name is "Hospital & Clinic Software in Nigeria", which matches that article on three
 * words and gives an anchor worth reading.
 *
 * Taken verbatim from the titles the site serves, the same ones llms.txt lists. Keep in step with
 * apps/web/src/content when a marketing page is renamed.
 */
const PAGE_TITLES: Record<string, string> = {
  // Core
  "/": "Nexoris Technologies",
  "/about": "About Nexoris Technologies",
  "/how-we-work": "How We Work",
  "/case-studies": "Case Studies & Projects",
  "/contact": "Contact Nexoris Technologies",

  // Services
  "/ai-product-development": "Custom Software & App Development",
  "/ai-chatbots-virtual-assistants": "AI Chatbots & Virtual Assistants",
  "/business-process-automation": "Business Process Automation Services",
  "/ai-ecommerce-development": "E-Commerce Website Development",
  "/data-dashboards-predictive-analytics": "Business Dashboards & Analytics",
  "/ai-systems-integration": "Systems Integration Services",
  "/data-infrastructure-ai-readiness": "Data Cleaning & AI Readiness",
  "/iot-development": "IoT Development & Monitoring",
  "/govtech-platforms": "GovTech & Public Sector Platforms",
  "/ai-seo-geo": "SEO & AI Search Optimisation",
  "/managed-technology-operations": "Software Maintenance & Support",

  // Industries
  "/education-software": "School Management Software in Nigeria",
  "/healthcare-software": "Hospital & Clinic Software in Nigeria",
  "/hospitality-software": "Hotel & Short-Let Software in Nigeria",
  "/restaurant-software": "Restaurant POS & Ordering Software",
  "/retail-ecommerce-software": "Retail & E-Commerce Software",
  "/real-estate-software": "Real Estate Software in Nigeria",
  "/logistics-software": "Fleet & Logistics Software in Nigeria",
  "/fintech-software": "Fintech Software Development",
  "/insurance-software": "Insurance Software Solutions",
  "/manufacturing-software": "Manufacturing ERP & Software",
  "/agritech-software": "Agritech & Farm Software in Nigeria",
  "/professional-services-software": "Software for Law & Accounting Firms",
  "/church-management-software": "Church Management Software",
  "/ngo-software": "NGO & M&E Software",
  "/government-digital-solutions": "Government Digital Solutions",
  "/construction-software": "Construction Management Software",
  "/media-entertainment-software": "Media & Streaming Platforms",
  "/fitness-wellness-software": "Salon, Spa & Gym Software",
  "/automotive-software": "Dealership & Workshop Software",
  "/events-software": "Event Ticketing & Management Software",

  // Legal
  "/privacy-policy": "Privacy Policy",
  "/terms-of-service": "Terms of Service",
  "/cookie-policy": "Cookie Policy",
};

/** A last-resort name from the path, for a page added to site-pages.ts and not yet named here. */
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
  return [...CORE_PAGES, ...SERVICE_PAGES, ...INDUSTRY_PAGES, ...LEGAL_ROUTES].map((p) => ({
    title: PAGE_TITLES[p] ?? titleCase(p),
    url: p,
  }));
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
