/**
 * Metadata for an author profile.
 *
 * Separate from the view because the root catch-all needs the head before it needs the body, and
 * because the canonical path moved: an author is `/<slug>` now, and this is the one place that
 * decides what the page declares itself to be.
 *
 * The title and description are fitted to their limits before they get near `buildMetadata`, which
 * throws on anything over. That guard is right for copy written in this repository, where a build
 * failure is the correct answer to a title nobody trimmed. It is wrong for a field somebody types
 * into the CMS: a 77-character meta title on one author profile took down the entire site build,
 * which is how this page came to 404 in production while working perfectly in development. Text an
 * editor can type must never be able to stop a deployment.
 */
import type { Metadata } from "next";
import {
  buildMetadata,
  deriveMetaTitle,
  fitMetaDescription,
  BRAND_SUFFIX,
  TITLE_SEPARATOR,
  META_LIMITS,
} from "@nexoris/seo";
import { authorPath } from "../lib/routes.js";
import type { AuthorProfile } from "../lib/cms.js";

/**
 * The room a title has before the brand suffix is appended.
 *
 * buildMetadata adds " | Nexoris Technologies" and then measures the whole thing, so fitting to the
 * 60-character limit here and handing it over produced a title 23 characters too long: the fit and
 * the check were measuring two different strings. An already-branded title is stripped first so it
 * is not suffixed twice.
 */
const LEAD_BUDGET = META_LIMITS.titleMax - (TITLE_SEPARATOR.length + BRAND_SUFFIX.length);

function fitTitle(raw: string): string {
  const suffix = `${TITLE_SEPARATOR}${BRAND_SUFFIX}`;
  const lead = raw.endsWith(suffix) ? raw.slice(0, -suffix.length) : raw;
  return deriveMetaTitle(lead, LEAD_BUDGET);
}

export function authorMetadata(slug: string, author: AuthorProfile | null): Metadata {
  // Even the not-found head goes through buildMetadata, so the page still declares a canonical of
  // itself rather than none at all.
  if (!author) {
    return buildMetadata({
      title: "Author not found | Nexoris Technologies",
      description: "",
      path: authorPath(slug),
      noindex: true,
    });
  }
  const description =
    author.metaDescription ??
    author.bio ??
    `${author.name} writes for Nexoris Technologies on software, automation, and AI.`;

  return buildMetadata({
    title: fitTitle(author.metaTitle ?? author.name),
    description: fitMetaDescription(description).text,
    path: authorPath(slug),
    ogType: "website",
    noindex: false,
    ...(author.photoUrl ? { image: author.photoUrl } : {}),
  });
}
