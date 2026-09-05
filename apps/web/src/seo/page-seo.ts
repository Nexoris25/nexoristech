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
import { industryImages, productTeamImage } from "../content/contextual-images.js";

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

/**
 * The first real photograph a page shows, used as its share card.
 *
 * A share card carrying the page's own picture says more about the page than its title set on a
 * purple rectangle, so where a page opens with an image, that image is the card.
 *
 * The images are not in the content model — they live in the view components — so metadata, which
 * runs before any of that renders, cannot read them. This map is the link between the two and has to
 * be kept in step with the views by hand; the test beside it checks every entry still points at a
 * file that exists, so a renamed image fails the build rather than quietly shipping a broken card.
 *
 * Pages absent from this map show no photograph at all: the industry template, contact, how we work,
 * and the legal pages are type from top to bottom. They keep the branded card, which is the honest
 * answer for a page with no image rather than borrowing an unrelated one.
 */
const PAGE_IMAGE: Record<string, { src: string; alt: string }> = {
  /*
   * Only two of the eleven ported service pages carry a photograph; the rest open with an
   * interactive widget, so they have no image to share and keep the branded card.
   *
   * These are written out rather than read from the service content modules. Those modules hold
   * their hero widget as JSX, so importing the registry here pulled React components — and the
   * stylesheets they import — into the SEO manifest script, which runs under tsx and cannot load a
   * .css file. It failed the whole web build.
   */
  "/ai-ecommerce-development": {
    src: "/services/ecommerce-hero.webp",
    alt: "A shopper comparing products and paying by card on an online store",
  },
  "/ai-product-development": {
    src: "/services/ai-product-development-cta.webp",
    alt: "A product designer pinning interface wireframes on a planning wall",
  },
  "/": {
    src: "/home-hero.webp",
    alt: "Application source code on a screen, representing the software Nexoris Technologies builds",
  },
  "/about": {
    src: "/about/team-meeting.webp",
    alt: "Members of the Nexoris Technologies team discussing a project together over laptops in the office",
  },
  "/case-studies": {
    src: "/case-studies/covyvo-dashboard.webp",
    alt: "The Covyvo dashboard showing revenue, expenses, payroll cost, and compliance alerts for a Nigerian small business",
  },
};

/** The page's own image, if it has one. */
export function pageImage(page: MarketingPage): { src: string; alt: string } | undefined {
  return page.meta.slug === "/about" ? productTeamImage : industryImages[page.meta.slug.slice(1)] ?? PAGE_IMAGE[page.meta.slug];
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
  // The page's own photograph where it has one, and the branded card where it does not.
  const own = pageImage(page);
  const url = own ? `${SITE_ORIGIN}${own.src}` : ogImageUrl(page);
  const image = {
    url,
    width: OG_IMAGE.width,
    height: OG_IMAGE.height,
    alt: own?.alt ?? pageName(page),
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
export function graphForPage(page: MarketingPage, renderedFaq?: FaqItem[]): JsonLdNode {
  const isHome = page.meta.slug === "/";
  const service = serviceInput(page);
  const faq = renderedFaq ?? faqItems(page);
  return buildPageGraph({
    page: {
      routeClass: page.meta.routeClass,
      path: page.meta.slug,
      name: page.meta.title,
      description: page.meta.description,
      ...(pageImage(page) ? { primaryImage: { url: `${SITE_ORIGIN}${pageImage(page)!.src}`, alt: pageImage(page)!.alt } } : {}),
      ...(isHome
        ? {}
        : { breadcrumbs: [{ name: pageName(page), path: page.meta.slug }] }),
    },
    ...(service ? { service } : {}),
    ...(faq ? { faq } : {}),
  });
}
