/**
 * Shared SEO types for the Nexoris Technologies platform.
 */

/**
 * The route classes the SEO engine knows about. Each class drives which schema nodes are
 * emitted (PRD 9.2) and how the check:seo gate validates the route.
 */
export type RouteClass =
  | "home"
  | "about"
  | "contact"
  | "how-we-work"
  | "collection" // hubs: case studies, insights, careers
  | "service"
  | "industry"
  | "case-study"
  | "insight"
  | "author"
  | "job"
  | "legal"
  | "pseo";

/** Open Graph object type. Articles use "article"; everything else uses "website". */
export type OgType = "website" | "article";

/** An image used for the Open Graph and Twitter cards. */
export interface OgImage {
  url: string;
  width: number;
  height: number;
  alt: string;
}

/** Input to the buildMetadata helper. */
export interface BuildMetadataInput {
  /** The page-specific meta title. The brand suffix is ensured if absent. */
  title: string;
  /** The meta description, targeting 155 to 160 characters with 160 the hard maximum. */
  description: string;
  /** The canonical path, for example "/about" or "/". */
  path: string;
  /** The Open Graph object type. Defaults to "website". */
  ogType?: OgType;
  /** The Open Graph image. Defaults to the branded card for this path. */
  ogImage?: OgImage;
  /** When true, the page is excluded from search engines and dropped from sitemaps. */
  noindex?: boolean;
}

/**
 * The metadata object returned by buildMetadata. Structurally compatible with the subset of
 * the Next.js Metadata type the platform uses, so an App Router generateMetadata function
 * can return it directly without coupling this package to Next.js.
 */
export interface BuiltMetadata {
  metadataBase: URL;
  title: string;
  description: string;
  alternates: { canonical: string };
  openGraph: {
    title: string;
    description: string;
    url: string;
    siteName: string;
    locale: string;
    type: OgType;
    images: OgImage[];
  };
  twitter: {
    card: "summary_large_image";
    title: string;
    description: string;
    images: string[];
  };
  robots: {
    index: boolean;
    follow: boolean;
    googleBot: { index: boolean; follow: boolean };
  };
}

/** A single problem found while validating meta copy. */
export interface MetaIssue {
  field: "title" | "description";
  rule: string;
  message: string;
}
