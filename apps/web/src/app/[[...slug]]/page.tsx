/**
 * The hardcoded marketing pages. One optional catch-all route statically generates all 36
 * pages (5 core, 11 services, 20 industries) from their content modules, each with its
 * metadata and a single JSON-LD @graph (PRD 6, 9, 12). More specific routes added later
 * (Insights, careers, legal) take precedence over this catch-all.
 *
 * Author profiles resolve here too. They live at the site root now - `/chinedu-nwogu` rather than
 * `/authors/chinedu-nwogu` - because a person's page is a top-level thing on this site and the
 * shorter URL is the one people share. Next allows only one dynamic route per segment, so the root
 * catch-all is where a one-segment author slug has to be answered. Order matters: a hardcoded page
 * and a programmatic page are both checked first, so an author can never shadow `/about` or a
 * service page however they are named.
 */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { buildMetadata } from "@nexoris/seo";
import { resolveDateTokens } from "../../lib/date.js";
import { allHardcodedPages, pagesBySlug } from "../../content/index.js";
import { PageRenderer } from "../../components/PageRenderer.js";
import { HomeView, HOME_FAQ } from "../../components/home/HomeView.js";
import { ServiceView } from "../../components/service/ServiceView.js";
import { servicePages } from "../../content/service-pages/index.js";
import { HowWeWorkView, HOW_WE_WORK_FAQ } from "../../components/company/HowWeWorkView.js";
import { AboutView } from "../../components/company/AboutView.js";
import { ContactView } from "../../components/company/ContactView.js";
import { CaseStudiesView } from "../../components/company/CaseStudiesView.js";
import { IndustryView } from "../../components/company/IndustryView.js";
import { JsonLd } from "../../components/JsonLd.js";
import { PseoPageView } from "../../components/PseoPageView.js";
import { getPseoPage, getPseoSlugs, getLatestInsights, getTestimonials, getCaseStudiesForService, getAllCaseStudies, getAuthor, getAuthorSlugs } from "../../lib/cms.js";
import { AuthorProfileView } from "../../components/author/AuthorProfileView.js";
import { authorMetadata } from "../../seo/author-seo.js";
import { graphForPage, metadataForPage } from "../../seo/page-seo.js";
import { serviceImages } from "../../content/contextual-images.js";
import { caseStudiesForIndustry } from "../../lib/case-study-industry.js";

interface RouteParams {
  slug?: string[];
}

// New published programmatic pages render on demand; the gate keeps the rest unpublished.
export const dynamicParams = true;
export const revalidate = 300;

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
  const authors: RouteParams[] = (await getAuthorSlugs()).map((s) => ({ slug: [s] }));
  return [...hardcoded, ...pseo, ...authors];
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
  const authorSlug = slug?.length === 1 ? slug[0]! : null;
  if (authorSlug) {
    const author = await getAuthor(authorSlug);
    if (author) return authorMetadata(authorSlug, author) as Metadata;
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
    // A single segment may be an author. Checked last, so it cannot shadow anything above it.
    if (slug?.length === 1) {
      const author = await getAuthor(slug[0]!);
      if (author) return <AuthorProfileView slug={slug[0]!} author={author} />;
    }
    notFound();
  }
  // The home page now renders the fully ported design-handoff homepage (its own section set),
  // keeping the page's JSON-LD graph for SEO.
  if (page.meta.slug === "/") {
    // Approved testimonials come from the CMS. The carousel previously shipped five placeholders
    // reading "Client name / Role, Company", which the live homepage was showing to visitors.
    const [insights, testimonials, studies] = await Promise.all([getLatestInsights(3), getTestimonials(6), getAllCaseStudies()]);
    return (
      <>
        <JsonLd graph={graphForPage(page, HOME_FAQ.map(f => ({ question: f.q, answer: f.a })))} />
        <HomeView
          insights={insights}
          studies={studies.slice(0, 3)}
          testimonials={testimonials.map((t) => ({
            text: t.quote,
            name: t.authorName,
            role: [t.authorRole, t.company].filter(Boolean).join(", "),
            ...(t.avatarUrl ? { photoUrl: t.avatarUrl } : {}),
            ...(t.avatarAlt ? { photoAlt: t.avatarAlt } : {}),
          }))}
        />
      </>
    );
  }
  // Fully ported service pages render from the design-handoff template; metadata and JSON-LD
  // still come from the content module above.
  const service = servicePages[page.meta.slug];
  if (service) {
    // The proof section showed fixed cards reading "Verified project card · loaded from case studies",
    // which described what it was meant to do rather than doing it. A case study now names the services
    // it proves, so the section can ask for the real work.
    const proof = await getCaseStudiesForService(page.meta.slug, 3);
    return (
      <>
        <JsonLd graph={graphForPage(page, service.faq.items.map(f => ({ question: f.q, answer: f.a })))} />
        <ServiceView content={service} caseStudies={proof} contextImage={serviceImages[page.meta.slug]} />
      </>
    );
  }
  // The How We Work page renders from its design-handoff view; metadata and JSON-LD still come
  // from the content module above.
  if (page.meta.slug === "/how-we-work") {
    return (
      <>
        <JsonLd graph={graphForPage(page, HOW_WE_WORK_FAQ.map(f => ({ question: f.q, answer: f.a })))} />
        <HowWeWorkView />
      </>
    );
  }
  if (page.meta.slug === "/about") {
    return (
      <>
        <JsonLd graph={graphForPage(page)} />
        <AboutView />
      </>
    );
  }
  // The contact page renders from its design-handoff view (interactive brief form inside).
  if (page.meta.slug === "/contact") {
    return (
      <>
        <JsonLd graph={graphForPage(page)} />
        <ContactView />
      </>
    );
  }
  // The case studies hub renders from its design-handoff view (in-house products, plus the honest empty
  // grid when nothing is published yet). The grid itself is now whatever the CMS holds.
  if (page.meta.slug === "/case-studies") {
    return (
      <>
        <JsonLd graph={graphForPage(page)} />
        <CaseStudiesView studies={await getAllCaseStudies()} />
      </>
    );
  }
  // All 20 industry pages render from one brand-consistent editorial template.
  if (page.meta.routeClass === "industry") {
    return (
      <>
        <JsonLd graph={graphForPage(page)} />
        <IndustryView page={page} caseStudies={caseStudiesForIndustry(await getAllCaseStudies(), key.slice(1))} />
      </>
    );
  }
  return (
    <>
      <JsonLd graph={graphForPage(page)} />
      <PageRenderer page={page} />
    </>
  );
}
