/**
 * Derives the metadata and the JSON-LD @graph for a hardcoded marketing page from its
 * content module, using packages/seo. Keeps the route files thin and the SEO logic in one place.
 */
import {
  buildMetadata,
  buildPageGraph,
  OG_IMAGE,
  SITE_ORIGIN,
} from "@nexoris/seo";
import type {
  BuiltMetadata,
  FaqItem,
  JsonLdNode,
  ServiceInput,
} from "@nexoris/seo";
import type { MarketingPage } from "../content/types.js";

/** The page name without the brand suffix, used for breadcrumbs and the Service node name. */
export function pageName(page: MarketingPage): string {
  return page.meta.title.split(" | ")[0] ?? page.meta.title;
}

const ROUTE_LABEL: Record<string, string> = {
  service: "Service",
  industry: "Industry",
  "case-study": "Case study",
};

/** The branded Open Graph card URL for a page, served by the /api/og endpoint. */
export function ogImageUrl(page: MarketingPage): string {
  const eyebrow = ROUTE_LABEL[page.meta.routeClass] ?? "Nexoris Technologies";
  const params = new URLSearchParams({ title: pageName(page), eyebrow });
  return `${SITE_ORIGIN}/api/og/?${params.toString()}`;
}

/** The FAQ items on a page, if it has an FAQ section. */
function faqItems(page: MarketingPage): FaqItem[] | undefined {
  const section = page.sections.find((s) => s.kind === "faq");
  return section && section.kind === "faq" ? section.items : undefined;
}

/** Build the Next.js metadata object for a page. */
export function metadataForPage(page: MarketingPage): BuiltMetadata {
  const meta = buildMetadata({
    title: page.meta.title,
    description: page.meta.description,
    path: page.meta.slug,
    ogType: "website",
    noindex: false,
  });
  // Point the social cards at the branded /api/og endpoint for this page.
  const url = ogImageUrl(page);
  const image = {
    url,
    width: OG_IMAGE.width,
    height: OG_IMAGE.height,
    alt: pageName(page),
  };
  return {
    ...meta,
    openGraph: { ...meta.openGraph, images: [image] },
    twitter: { ...meta.twitter, images: [url] },
  };
}

/** Derive the Service node input for service, industry, and programmatic pages. */
function serviceInput(page: MarketingPage): ServiceInput | undefined {
  if (page.meta.routeClass === "service") {
    return { name: pageName(page), path: page.meta.slug };
  }
  if (page.meta.routeClass === "industry") {
    // Derive a serviceType and audience from the slug, for example
    // /fintech-software -> "fintech software development" for "Fintech businesses".
    const base = page.meta.slug
      .replace(/^\//, "")
      .replace(/-software$/, "")
      .replace(/-/g, " ");
    return {
      name: pageName(page),
      path: page.meta.slug,
      serviceType: `${base} software development`,
      audience: `${base} businesses`,
    };
  }
  return undefined;
}

/** Build the JSON-LD @graph for a page. */
export function graphForPage(page: MarketingPage): JsonLdNode {
  const isHome = page.meta.slug === "/";
  const service = serviceInput(page);
  const faq = faqItems(page);
  return buildPageGraph({
    page: {
      routeClass: page.meta.routeClass,
      path: page.meta.slug,
      name: page.meta.title,
      description: page.meta.description,
      ...(isHome
        ? {}
        : { breadcrumbs: [{ name: pageName(page), path: page.meta.slug }] }),
    },
    ...(service ? { service } : {}),
    ...(faq ? { faq } : {}),
  });
}
