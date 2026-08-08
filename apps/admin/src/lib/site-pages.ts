/**
 * The hardcoded marketing site structure, mirrored from apps/web/src/content (the upstream source of
 * truth) and apps/web/src/app/sitemap.ts. The Nexoris Technologies website serves 36 hardcoded pages
 * (5 core + 11 services + 20 industries) plus the Insights and Careers hubs and 3 legal pages; the CMS
 * layers its published content (insights, authors, jobs, programmatic pages) on top. Every SEO Operations
 * screen (sitemaps, indexing, SEO health, crawl, search console context) uses THIS module so the reports
 * cover the whole crawlable surface — the real static site AND the CMS content — with no duplication and
 * no half-report. Keep in sync with apps/web/src/content when marketing pages are added or removed.
 */
export const SITE_ORIGIN = "https://nexoristech.com";

export const CORE_PAGES = ["/", "/about", "/how-we-work", "/case-studies", "/contact"] as const;

export const SERVICE_PAGES = [
  "/ai-product-development", "/ai-ecommerce-development", "/ai-chatbots-virtual-assistants",
  "/ai-systems-integration", "/ai-seo-geo", "/business-process-automation",
  "/data-dashboards-predictive-analytics", "/data-infrastructure-ai-readiness", "/iot-development",
  "/managed-technology-operations", "/govtech-platforms",
] as const;

export const INDUSTRY_PAGES = [
  "/agritech-software", "/automotive-software", "/church-management-software", "/construction-software",
  "/education-software", "/events-software", "/fintech-software", "/fitness-wellness-software",
  "/government-digital-solutions", "/healthcare-software", "/hospitality-software", "/insurance-software",
  "/logistics-software", "/manufacturing-software", "/media-entertainment-software", "/ngo-software",
  "/professional-services-software", "/real-estate-software", "/restaurant-software", "/retail-ecommerce-software",
] as const;

/** The Insights and Careers listing hubs (their detail pages come from the CMS). */
export const HUB_PAGES = ["/insights", "/careers"] as const;
/** The three legal pages (their content is CMS-managed, but the routes are fixed). */
export const LEGAL_ROUTES = ["/privacy-policy", "/terms-of-service", "/cookie-policy"] as const;

/** The 36 hardcoded marketing pages. */
export const HARDCODED_PAGES: readonly string[] = [...CORE_PAGES, ...SERVICE_PAGES, ...INDUSTRY_PAGES];

/** Every fixed (non-CMS-detail) public route: the 36 hardcoded pages + the 2 hubs + the 3 legal routes = 41. */
export const STATIC_ROUTES: readonly string[] = [...HARDCODED_PAGES, ...HUB_PAGES, ...LEGAL_ROUTES];

export const STATIC_COUNTS = {
  core: CORE_PAGES.length,
  services: SERVICE_PAGES.length,
  industries: INDUSTRY_PAGES.length,
  hubs: HUB_PAGES.length,
  legal: LEGAL_ROUTES.length,
  hardcoded: HARDCODED_PAGES.length, // 36
  total: STATIC_ROUTES.length,       // 41
} as const;

/**
 * Readable names for the service pages, so a picker can show "AI Product Development" rather than
 * "/ai-product-development". Derived from the path where the plain title matches, and stated
 * explicitly where it does not.
 */
export const SERVICE_LABELS: Record<string, string> = {
  "/ai-product-development": "AI Product Development",
  "/ai-ecommerce-development": "AI E-commerce Development",
  "/ai-chatbots-virtual-assistants": "AI Chatbots and Virtual Assistants",
  "/ai-systems-integration": "AI Systems Integration",
  "/ai-seo-geo": "AI SEO and GEO",
  "/business-process-automation": "Business Process Automation",
  "/data-dashboards-predictive-analytics": "Data Dashboards and Predictive Analytics",
  "/data-infrastructure-ai-readiness": "Data Infrastructure and AI Readiness",
  "/iot-development": "IoT Development",
  "/managed-technology-operations": "Managed Technology Operations",
  "/govtech-platforms": "GovTech Platforms",
};
