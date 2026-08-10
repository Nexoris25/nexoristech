/**
 * A single case study.
 *
 * This route did not exist. ProofBand has been linking to `/case-studies/{slug}` from the homepage all
 * along, and every one of those links returned a 404 — the case studies index was a hand-built page and
 * there was nothing behind it.
 *
 * The page is the CMS record: the cover, the write-up, the gallery of project images, the highlights and
 * the stack, and links to the services the work proves.
 *
 * CMS-driven with ISR; notFound for an unknown slug.
 */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildMetadata, buildGraph, caseStudyNode, breadcrumbNode, absoluteUrl } from "@nexoris/seo";
import { getCaseStudy, getCaseStudySlugs } from "../../../lib/cms.js";
import { withHeadingIds, headingsOf } from "../../../lib/render-html.js";
import { FloatingToc } from "../../../components/FloatingToc.js";
import { JsonLd } from "../../../components/JsonLd.js";
import { ScrollFx } from "../../../components/home/ScrollFx.js";
import { SERVICE_LABELS } from "../../../content/service-labels.js";
import "../../../styles/case-study.css";

export const revalidate = 300;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return (await getCaseStudySlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const study = await getCaseStudy(slug);
  if (!study) return buildMetadata({ title: "Case study | Nexoris Technologies", description: "", path: `/case-studies/${slug}` });
  return buildMetadata({
    title: study.metaTitle ?? `${study.title} | Nexoris Technologies`,
    description: study.metaDescription ?? study.summary ?? "",
    path: `/case-studies/${study.slug}`,
    // Deliberately kept out of the index. A case study is proof shown to someone already reading a
    // service page, not a page meant to rank on its own, and the owner does not want these counted
    // as part of the site's indexable surface. They stay reachable and their links still pass value;
    // they are simply not listed in the sitemap and not indexed.
    noindex: true,
    ...(study.coverUrl ? { image: study.coverUrl } : {}),
  });
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }): Promise<ReactNode> {
  const { slug } = await params;
  const study = await getCaseStudy(slug);
  if (!study) notFound();

  const path = `/case-studies/${study.slug}`;
  const toc = headingsOf(study.body);

  const graph = buildGraph([
    caseStudyNode({
      path,
      headline: study.title,
      description: study.summary ?? "",
      ...(study.coverUrl ? { image: { url: absoluteUrl(study.coverUrl), alt: study.coverAlt ?? study.title } } : {}),
      ...(study.servicePaths.length > 0 ? { aboutPaths: study.servicePaths } : {}),
      ...(study.publishedAt ? { datePublished: study.publishedAt } : {}),
      ...(study.updatedAt ? { dateModified: study.updatedAt } : {}),
    }),
    breadcrumbNode([
      { name: "Case studies", path: "/case-studies" },
      { name: study.title, path },
    ]),
  ]);

  return (
    <div className="svc-page case-study-page">
      <ScrollFx />
      <JsonLd graph={graph} />

      <section className="cs-hero" aria-label={study.title}>
        <div className="glow" />
        <div className="wrap">
          <nav className="crumb" aria-label="Breadcrumb">
            <Link href="/case-studies">Case studies</Link>
            <span className="sep">/</span>
            <span className="here">{study.title}</span>
          </nav>
          <div className="cs-head">
            {study.industry ? <span className="cat-pill">{study.industry}</span> : null}
            <h1>{study.title}</h1>
            {study.summary ? <p className="sub">{study.summary}</p> : null}
          </div>
        </div>
      </section>

      <section className="band" aria-label="The work">
        <div className="wrap cs-wrap">
          {study.coverUrl ? (
            <figure className="cs-cover">
              <img src={study.coverUrl} alt={study.coverAlt ?? study.title} loading="eager" />
            </figure>
          ) : null}

          {study.highlights.length > 0 || study.technologies.length > 0 ? (
            <div className="cs-facts reveal">
              {study.highlights.length > 0 ? (
                <div>
                  <h2>What it delivers</h2>
                  <ul className="cs-chips">
                    {study.highlights.map((h) => <li key={h}>{h}</li>)}
                  </ul>
                </div>
              ) : null}
              {study.technologies.length > 0 ? (
                <div>
                  <h2>Built with</h2>
                  <ul className="cs-chips tech">
                    {study.technologies.map((t) => <li key={t}>{t}</li>)}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}

          {study.body ? (
            <div className="prose reveal" dangerouslySetInnerHTML={{ __html: withHeadingIds(study.body) }} />
          ) : null}

          {/* The gallery. A single cover is enough for a card and not enough to show the work. */}
          {study.gallery.length > 0 ? (
            <section className="cs-gallery reveal" aria-label="Project images">
              {study.gallery.map((img) => (
                <figure key={img.url}>
                  <img src={img.url} alt={img.alt} loading="lazy" />
                  {img.alt ? <figcaption>{img.alt}</figcaption> : null}
                </figure>
              ))}
            </section>
          ) : null}

          {study.servicePaths.length > 0 ? (
            <section className="cs-services reveal" aria-label="Services this proves">
              <h2>Services behind this work</h2>
              <ul>
                {study.servicePaths.map((p) => (
                  <li key={p}><Link href={p}>{SERVICE_LABELS[p] ?? p}</Link></li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </section>

      <FloatingToc entries={toc} />
    </div>
  );
}
