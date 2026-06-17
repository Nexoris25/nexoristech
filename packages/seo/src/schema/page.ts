/**
 * Per-page JSON-LD nodes for the Nexoris Technologies platform: WebPage and its subtypes,
 * BreadcrumbList, and ImageObject (PRD 9.2).
 */
import { LOCALE } from "../constants.js";
import { absoluteUrl } from "../url.js";
import type { RouteClass } from "../types.js";
import { SITE_NODE_IDS } from "./site.js";
import type { JsonLdNode } from "./jsonld.js";

/** A breadcrumb trail item. */
export interface Breadcrumb {
  name: string;
  /** The site path, for example "/insights". The home crumb is implied at position 1. */
  path: string;
}

/** A meaningful image, with alt text used as the schema caption. */
export interface ImageInput {
  url: string;
  alt: string;
  width?: number;
  height?: number;
}

/** Map a route class to its WebPage subtype, where schema.org defines one (PRD 9.2). */
function webPageType(routeClass: RouteClass): string {
  switch (routeClass) {
    case "about":
      return "AboutPage";
    case "contact":
      return "ContactPage";
    case "collection":
      return "CollectionPage";
    default:
      return "WebPage";
  }
}

/** The ImageObject node for a page's primary image, caption from its alt text (PRD 9.2). */
export function imageObjectNode(image: ImageInput): JsonLdNode {
  return {
    "@type": "ImageObject",
    url: image.url,
    caption: image.alt,
    width: image.width,
    height: image.height,
  };
}

/** The BreadcrumbList node. Home is always position 1; each crumb follows in order. */
export function breadcrumbNode(crumbs: Breadcrumb[]): JsonLdNode {
  const items = [{ name: "Home", path: "/" }, ...crumbs].map(
    (crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    }),
  );
  return {
    "@type": "BreadcrumbList",
    itemListElement: items,
  };
}

/** Input to the WebPage node builder. */
export interface WebPageInput {
  routeClass: RouteClass;
  path: string;
  name: string;
  description: string;
  primaryImage?: ImageInput;
  breadcrumbs?: Breadcrumb[];
  datePublished?: string;
  dateModified?: string;
}

/** The WebPage node, subtyped per route class (PRD 9.2). */
export function webPageNode(input: WebPageInput): JsonLdNode {
  const url = absoluteUrl(input.path);
  const hasBreadcrumb =
    input.breadcrumbs !== undefined && input.breadcrumbs.length > 0;
  return {
    "@type": webPageType(input.routeClass),
    "@id": `${url}#webpage`,
    url,
    name: input.name,
    description: input.description,
    isPartOf: { "@id": SITE_NODE_IDS.website },
    inLanguage: LOCALE,
    primaryImageOfPage: input.primaryImage
      ? imageObjectNode(input.primaryImage)
      : undefined,
    breadcrumb: hasBreadcrumb
      ? breadcrumbNode(input.breadcrumbs as Breadcrumb[])
      : undefined,
    datePublished: input.datePublished,
    dateModified: input.dateModified,
  };
}
