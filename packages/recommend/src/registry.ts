/**
 * The canonical registry of the 11 services and 20 industries: stable slug plus the approved
 * navigation label. Slugs equal the page paths, so a href is just the slug. This is the single
 * source of truth for the recommender; apps/web's nav catalogue uses the same slugs and labels,
 * and a web-side test asserts they stay aligned. Keeping the recommender label-aware here avoids a
 * package depending on an app.
 */

export interface ServiceEntry {
  readonly slug: string;
  readonly label: string;
}

export interface IndustryEntry {
  readonly slug: string;
  readonly label: string;
}

/** The 11 services, in the flyout order of importance (PRD 7.2). */
export const SERVICES = [
  { slug: "ai-product-development", label: "AI Product Development" },
  {
    slug: "ai-chatbots-virtual-assistants",
    label: "AI Chatbots and Virtual Assistants",
  },
  { slug: "business-process-automation", label: "Business Process Automation" },
  { slug: "ai-ecommerce-development", label: "AI E-Commerce" },
  {
    slug: "data-dashboards-predictive-analytics",
    label: "Data Dashboards and Analytics",
  },
  { slug: "ai-systems-integration", label: "AI and Systems Integration" },
  {
    slug: "data-infrastructure-ai-readiness",
    label: "Data Infrastructure and AI Readiness",
  },
  { slug: "iot-development", label: "IoT Development" },
  { slug: "govtech-platforms", label: "GovTech Platforms" },
  { slug: "ai-seo-geo", label: "AI Content, SEO and GEO" },
  {
    slug: "managed-technology-operations",
    label: "Managed Technology Operations",
  },
] as const satisfies readonly ServiceEntry[];

/** The 20 industries (PRD 7.3). */
export const INDUSTRIES = [
  { slug: "retail-ecommerce-software", label: "Retail and E-Commerce" },
  { slug: "restaurant-software", label: "Restaurants and QSR" },
  { slug: "hospitality-software", label: "Hospitality and Short-Lets" },
  { slug: "real-estate-software", label: "Real Estate" },
  { slug: "automotive-software", label: "Automotive" },
  { slug: "events-software", label: "Events and Weddings" },
  { slug: "media-entertainment-software", label: "Media and Entertainment" },
  { slug: "healthcare-software", label: "Healthcare and Clinics" },
  { slug: "education-software", label: "Education and EdTech" },
  { slug: "fitness-wellness-software", label: "Fitness, Beauty and Wellness" },
  { slug: "professional-services-software", label: "Professional Services" },
  { slug: "insurance-software", label: "Insurance" },
  { slug: "logistics-software", label: "Logistics and Supply Chain" },
  { slug: "manufacturing-software", label: "Manufacturing" },
  { slug: "construction-software", label: "Construction and Engineering" },
  { slug: "agritech-software", label: "Agriculture and Agritech" },
  { slug: "fintech-software", label: "Financial Services and Fintech" },
  { slug: "government-digital-solutions", label: "Government and Public Sector" },
  { slug: "ngo-software", label: "NGOs and Non-Profits" },
  { slug: "church-management-software", label: "Faith Organisations" },
] as const satisfies readonly IndustryEntry[];

export type ServiceSlug = (typeof SERVICES)[number]["slug"];
export type IndustrySlug = (typeof INDUSTRIES)[number]["slug"];

const serviceBySlug = new Map<string, ServiceEntry>(
  SERVICES.map((s) => [s.slug, s]),
);
const industryBySlug = new Map<string, IndustryEntry>(
  INDUSTRIES.map((i) => [i.slug, i]),
);

export function isServiceSlug(slug: string): slug is ServiceSlug {
  return serviceBySlug.has(slug);
}
export function isIndustrySlug(slug: string): slug is IndustrySlug {
  return industryBySlug.has(slug);
}

export function serviceLabel(slug: ServiceSlug): string {
  return serviceBySlug.get(slug)?.label ?? slug;
}
export function industryLabel(slug: IndustrySlug): string {
  return industryBySlug.get(slug)?.label ?? slug;
}

/** The page path for a slug. The server appends the trailing slash (DECISIONS D-002). */
export function pageHref(slug: string): string {
  return `/${slug}`;
}
