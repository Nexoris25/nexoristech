/**
 * Derives the metadata and the JSON-LD @graph for a hardcoded marketing page from its
 * content module, using packages/seo. Keeps the route files thin and the SEO logic in one place.
 */
import { buildMetadata, buildPageGraph } from "@nexoris/seo";
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

/** The FAQ items on a page, if it has an FAQ section. */
function faqItems(page: MarketingPage): FaqItem[] | undefined {
  const section = page.sections.find((s) => s.kind === "faq");
  return section && section.kind === "faq" ? section.items : undefined;
}

/** Build the Next.js metadata object for a page. */
export function metadataForPage(page: MarketingPage): BuiltMetadata {
  return buildMetadata({
    title: page.meta.title,
    description: page.meta.description,
    path: page.meta.slug,
    ogType: "website",
    noindex: false,
  });
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
