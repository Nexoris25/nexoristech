/**
 * The hardcoded marketing pages. One optional catch-all route statically generates all 36
 * pages (5 core, 11 services, 20 industries) from their content modules, each with its
 * metadata and a single JSON-LD @graph (PRD 6, 9, 12). More specific routes added later
 * (Insights, careers, authors, legal, programmatic) take precedence over this catch-all.
 */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { allHardcodedPages, pagesBySlug } from "../../content/index.js";
import { PageRenderer } from "../../components/PageRenderer.js";
import { JsonLd } from "../../components/JsonLd.js";
import { IndustriesGrid } from "../../components/IndustriesGrid.js";
import { graphForPage, metadataForPage } from "../../seo/page-seo.js";

interface RouteParams {
  slug?: string[];
}

/** Resolve the optional catch-all segments to a content-module slug ("/", "/about", ...). */
function toSlug(segments: string[] | undefined): string {
  if (!segments || segments.length === 0) {
    return "/";
  }
  return `/${segments.join("/")}`;
}

export function generateStaticParams(): RouteParams[] {
  return allHardcodedPages.map((page) =>
    page.meta.slug === "/"
      ? { slug: [] }
      : { slug: page.meta.slug.replace(/^\//, "").split("/") },
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = pagesBySlug[toSlug(slug)];
  if (!page) {
    return {};
  }
  return metadataForPage(page) as Metadata;
}

export default async function MarketingRoute({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<ReactNode> {
  const { slug } = await params;
  const page = pagesBySlug[toSlug(slug)];
  if (!page) {
    notFound();
  }
  // The home page injects the filterable industries grid into its industries section.
  const sectionSlots =
    page.meta.slug === "/" ? { industries: <IndustriesGrid /> } : undefined;
  return (
    <>
      <JsonLd graph={graphForPage(page)} />
      <PageRenderer page={page} {...(sectionSlots ? { sectionSlots } : {})} />
    </>
  );
}
