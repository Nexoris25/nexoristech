/**
 * The hardcoded marketing pages. One optional catch-all route statically generates all 36
 * pages (5 core, 11 services, 20 industries) from their content modules, each with its
 * metadata and a single JSON-LD @graph (PRD 6, 9, 12). More specific routes added later
 * (Insights, careers, authors, legal, programmatic) take precedence over this catch-all.
 */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { buildMetadata } from "@nexoris/seo";
import { resolveDateTokens } from "../../lib/date.js";
import { allHardcodedPages, pagesBySlug } from "../../content/index.js";
import { PageRenderer } from "../../components/PageRenderer.js";
import { HomeView } from "../../components/home/HomeView.js";
import { ServiceView } from "../../components/service/ServiceView.js";
import { servicePages } from "../../content/service-pages/index.js";
import { HowWeWorkView } from "../../components/company/HowWeWorkView.js";
import { JsonLd } from "../../components/JsonLd.js";
import { ContactForm } from "../../components/ContactForm.js";
import { PseoPageView } from "../../components/PseoPageView.js";
import { getPseoPage, getPseoSlugs } from "../../lib/cms.js";
import { graphForPage, metadataForPage } from "../../seo/page-seo.js";

interface RouteParams {
  slug?: string[];
}

// New published programmatic pages render on demand; the gate keeps the rest unpublished.
export const dynamicParams = true;

/** Resolve the optional catch-all segments to a content-module slug ("/", "/about", ...). */
function toSlug(segments: string[] | undefined): string {
  if (!segments || segments.length === 0) {
    return "/";
  }
  return `/${segments.join("/")}`;
}

export async function generateStaticParams(): Promise<RouteParams[]> {
  const hardcoded: RouteParams[] = allHardcodedPages.map((page) =>
    page.meta.slug === "/"
      ? { slug: [] }
      : { slug: page.meta.slug.replace(/^\//, "").split("/") },
  );
  const pseo: RouteParams[] = (await getPseoSlugs()).map((s) => ({
    slug: [s],
  }));
  return [...hardcoded, ...pseo];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const key = toSlug(slug);
  const page = pagesBySlug[key];
  if (page) {
    return metadataForPage(page) as Metadata;
  }
  const pseo = await getPseoPage(key.replace(/^\//, ""));
  if (pseo) {
    return buildMetadata({
      title: resolveDateTokens(
        pseo.metaTitle ?? `${pseo.h1} | Nexoris Technologies`,
      ),
      description: resolveDateTokens(
        pseo.metaDescription ??
          pseo.summary ??
          `${pseo.h1} from Nexoris Technologies.`,
      ),
      path: key,
      ogType: "website",
      noindex: pseo.noIndex,
    }) as Metadata;
  }
  return {};
}

export default async function MarketingRoute({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<ReactNode> {
  const { slug } = await params;
  const key = toSlug(slug);
  const page = pagesBySlug[key];
  if (!page) {
    // Not a hardcoded page: try a published programmatic page before giving up.
    const pseo = await getPseoPage(key.replace(/^\//, ""));
    if (pseo) return <PseoPageView page={pseo} />;
    notFound();
  }
  // The home page now renders the fully ported design-handoff homepage (its own section set),
  // keeping the page's JSON-LD graph for SEO.
  if (page.meta.slug === "/") {
    return (
      <>
        <JsonLd graph={graphForPage(page)} />
        <HomeView />
      </>
    );
  }
  // Fully ported service pages render from the design-handoff template; metadata and JSON-LD
  // still come from the content module above.
  const service = servicePages[page.meta.slug];
  if (service) {
    return (
      <>
        <JsonLd graph={graphForPage(page)} />
        <ServiceView content={service} />
      </>
    );
  }
  // The How We Work page renders from its design-handoff view; metadata and JSON-LD still come
  // from the content module above.
  if (page.meta.slug === "/how-we-work") {
    return (
      <>
        <JsonLd graph={graphForPage(page)} />
        <HowWeWorkView />
      </>
    );
  }
  // The contact page injects the interactive lead-capture form into its form section.
  let sectionSlots: Record<string, ReactNode> | undefined;
  if (page.meta.slug === "/contact") {
    const formSection = page.sections.find((s) => s.kind === "form");
    if (formSection?.kind === "form") {
      sectionSlots = { [formSection.id]: <ContactForm section={formSection} /> };
    }
  }
  return (
    <>
      <JsonLd graph={graphForPage(page)} />
      <PageRenderer page={page} {...(sectionSlots ? { sectionSlots } : {})} />
    </>
  );
}
