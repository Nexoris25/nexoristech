/**
 * Metadata for an author profile.
 *
 * Separate from the view because the root catch-all needs the head before it needs the body, and
 * because the canonical path moved: an author is `/<slug>` now, and this is the one place that
 * decides what the page declares itself to be.
 */
import type { Metadata } from "next";
import { buildMetadata } from "@nexoris/seo";
import { authorPath } from "../lib/routes.js";
import type { AuthorProfile } from "../lib/cms.js";

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
  return buildMetadata({
    title: author.metaTitle ?? `${author.name} | Nexoris Technologies`,
    description:
      author.metaDescription ??
      author.bio ??
      `${author.name} writes for Nexoris Technologies on software, automation, and AI.`,
    path: authorPath(slug),
    ogType: "website",
    noindex: false,
    ...(author.photoUrl ? { image: author.photoUrl } : {}),
  });
}
