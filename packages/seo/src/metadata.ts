/**
 * The buildMetadata helper and meta validation for the Nexoris Technologies platform.
 *
 * Enforces the meta copy constraints (PRD 1.3 and 9.11): the meta title is within 60
 * characters and ends with the Nexoris Technologies brand; the meta description targets 155
 * to 160 characters with 160 the hard maximum. The canonical and Open Graph URLs follow
 * the trailing-slash reconciliation in url.ts so og:url always equals the canonical.
 */
import {
  BRAND_SUFFIX,
  META_LIMITS,
  OG_IMAGE,
  OG_LOCALE,
  ORGANISATION,
  SITE_ORIGIN,
  TITLE_SEPARATOR,
  X_HANDLE,
} from "./constants.js";
import { absoluteUrl } from "./url.js";
import type {
  BuildMetadataInput,
  BuiltMetadata,
  MetaIssue,
  OgImage,
} from "./types.js";

/** Ensure a title ends with the Nexoris Technologies brand, idempotently. */
export function ensureBrandSuffix(title: string): string {
  const trimmed = title.trim();
  if (
    trimmed === BRAND_SUFFIX ||
    trimmed.endsWith(`${TITLE_SEPARATOR}${BRAND_SUFFIX}`)
  ) {
    return trimmed;
  }
  return `${trimmed}${TITLE_SEPARATOR}${BRAND_SUFFIX}`;
}

/**
 * Validate a meta title and description against the copy constraints. Returns every issue
 * found so the check:seo gate can report them all at once. The title is validated after the
 * brand suffix is ensured, since that is what renders.
 */
export function validateMeta(title: string, description: string): MetaIssue[] {
  const issues: MetaIssue[] = [];
  const fullTitle = ensureBrandSuffix(title);

  if (fullTitle.length > META_LIMITS.titleMax) {
    issues.push({
      field: "title",
      rule: "title-max",
      message: `Meta title is ${fullTitle.length} characters; the maximum is ${META_LIMITS.titleMax}.`,
    });
  }
  if (!fullTitle.endsWith(BRAND_SUFFIX)) {
    issues.push({
      field: "title",
      rule: "title-brand-suffix",
      message: `Meta title must end with "${BRAND_SUFFIX}".`,
    });
  }
  const descLength = description.trim().length;
  if (descLength > META_LIMITS.descriptionMax) {
    issues.push({
      field: "description",
      rule: "description-max",
      message: `Meta description is ${descLength} characters; the hard maximum is ${META_LIMITS.descriptionMax}.`,
    });
  }
  if (descLength < META_LIMITS.descriptionMin) {
    issues.push({
      field: "description",
      rule: "description-min",
      message: `Meta description is ${descLength} characters; the target minimum is ${META_LIMITS.descriptionMin}.`,
    });
  }
  return issues;
}

/** The default branded Open Graph card for a given canonical URL. */
function defaultOgImage(canonical: string, title: string): OgImage {
  // The branded card is generated server-side per page using the Next.js opengraph-image
  // file convention, so each page has its own card at <path>opengraph-image. The home page
  // canonical is the bare origin, whose path is "/".
  const pathname =
    canonical === SITE_ORIGIN ? "/" : new URL(canonical).pathname;
  return {
    url: `${SITE_ORIGIN}${pathname}opengraph-image`,
    width: OG_IMAGE.width,
    height: OG_IMAGE.height,
    alt: title,
  };
}

/**
 * Build the metadata object for a page. Throws on a hard violation (a title over 60 characters
 * or a description over 160) so an invalid page cannot build. The 155-character soft minimum
 * is reported by validateMeta and enforced by the check:seo gate rather than thrown here, so
 * a draft can still render in preview.
 */
export function buildMetadata(input: BuildMetadataInput): BuiltMetadata {
  const fullTitle = ensureBrandSuffix(input.title);
  const description = input.description.trim();

  const hardIssues = validateMeta(input.title, description).filter(
    (issue) => issue.rule === "title-max" || issue.rule === "description-max",
  );
  if (hardIssues.length > 0) {
    throw new Error(
      `buildMetadata received copy that breaks a hard limit: ${hardIssues
        .map((issue) => issue.message)
        .join(" ")}`,
    );
  }

  const canonical = absoluteUrl(input.path);
  const ogType = input.ogType ?? "website";
  const ogImage = input.ogImage ?? defaultOgImage(canonical, fullTitle);
  const index = !input.noindex;

  return {
    metadataBase: new URL(SITE_ORIGIN),
    title: fullTitle,
    description,
    alternates: { canonical },
    openGraph: {
      title: fullTitle,
      description,
      url: canonical,
      siteName: ORGANISATION.name,
      locale: OG_LOCALE,
      type: ogType,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      // Both point at the company account: posts come from the brand, not a personal byline.
      site: X_HANDLE,
      creator: X_HANDLE,
      title: fullTitle,
      description,
      images: [ogImage.url],
    },
    /*
     * One robots directive, not two.
     *
     * A separate googleBot entry makes Next emit `<meta name="googlebot">` beside
     * `<meta name="robots">`. It earns its place only when it says something different from the
     * general directive - Google reads the robots tag like every other crawler. Here both said
     * "index, follow", so every page carried the same instruction twice and any tool that lists
     * the head reported it twice: "index, follow, index, follow".
     */
    robots: {
      index,
      follow: true,
    },
  };
}
