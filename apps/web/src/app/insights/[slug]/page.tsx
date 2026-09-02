/**
 * An Insights article (PRD Stage 8): EEAT structure with author and fact-checker, an optional
 * TL;DR, the body, and an FAQ, plus an Article (BlogPosting) and FAQPage JSON-LD graph with
 * breadcrumbs. CMS-driven via ISR; new articles render on demand. notFound for an unknown slug.
 */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { stripDuplicateBlocks } from "../../../lib/article-body.js";
import { CountView } from "../../../components/CountView.js";
import Link from "next/link";
import {
  buildMetadata,
  buildPageGraph,
  howToNode,
  absoluteUrl,
  fitMetaDescription,
} from "@nexoris/seo";
import type { ArticleInput, PersonRef } from "@nexoris/seo";
import { isArticleType } from "@nexoris/seo";
import { JsonLd } from "../../../components/JsonLd.js";
import { formatLagosDate } from "../../../lib/date.js";
import { getInsight, getInsightSlugs, type Author } from "../../../lib/cms.js";
import { headingsOf, withHeadingIds, wrapTables, stepsOf } from "../../../lib/render-html.js";
import { FloatingToc } from "../../../components/FloatingToc.js";
import { TocSpy } from "../../../components/TocSpy.js";
import "../../../styles/article.css";
import { authorPath } from "../../../lib/routes.js";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const slugs = await getInsightSlugs();
  return slugs.map((slug) => ({ slug }));
}

const BRAND_SUFFIX = " | Nexoris Technologies";
/** Absolute URL for a media file — like absoluteUrl but without the trailing slash it adds to pages. */
function mediaAbsolute(url: string): string {
  return absoluteUrl(url).replace(/\/+$/, "");
}
/** A page title that always ends with the brand once and respects buildMetadata's 60-char hard limit. */
function safeTitle(raw: string): string {
  const base0 = raw.endsWith(BRAND_SUFFIX) ? raw.slice(0, -BRAND_SUFFIX.length) : raw;
  const budget = 60 - BRAND_SUFFIX.length;
  const base = base0.length > budget ? `${base0.slice(0, budget - 1).trimEnd()}…` : base0;
  return `${base}${BRAND_SUFFIX}`;
}
/**
 * A meta description within the hard limit, ending on a finished sentence.
 *
 * It used to cut at 157 characters and append "...", which tells a reader nothing except that the
 * sentence was severed. Whole sentences are kept instead, and a short description is better than a
 * long one that trails off. The TL;DR arrives as bullets, so it is joined only here, where a single
 * string is what the tag needs.
 */
function descriptionFor(excerpt?: string, tldr?: string[], metaDescription?: string): string {
  const raw = metaDescription ?? excerpt ?? (tldr && tldr.length > 0 ? tldr.join(" ") : undefined)
    ?? "An article from the team at Nexoris Technologies.";
  if (raw.length <= 160) return raw;
  const fitted = fitMetaDescription(raw);
  // A single sentence longer than the limit leaves nothing whole; fall back to a word boundary
  // rather than to a severed word, and still without an ellipsis.
  if (fitted.text) return fitted.text;
  const cut = raw.slice(0, 160);
  return cut.slice(0, cut.lastIndexOf(" ")).trimEnd();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getInsight(slug);
  if (!article) return { title: "Article not found | Nexoris Technologies" };
  const built = buildMetadata({
    title: safeTitle(article.metaTitle ?? article.title),
    description: descriptionFor(article.excerpt, article.tldr, article.metaDescription),
    path: `/insights/${slug}`,
    ogType: "article",
    noindex: article.noIndex,
    // The article's featured image is its Open Graph card (falls back to the branded card if absent).
    ...(article.coverUrl
      ? { ogImage: { url: mediaAbsolute(article.coverUrl), width: 1200, height: 630, alt: article.coverAlt ?? article.title } }
      : {}),
  });

  // Open Graph article properties, which the generic builder does not know about: publication and
  // modification times, the author, and the section. These are what a share card and a crawler read.
  return {
    ...built,
    openGraph: {
      ...built.openGraph,
      type: "article",
      ...(article.publishedAt ? { publishedTime: article.publishedAt } : {}),
      ...(article.updatedAt ? { modifiedTime: article.updatedAt } : {}),
      ...(article.author ? { authors: [article.author.name] } : {}),
      ...(article.category ? { section: article.category } : {}),
    },
  };
}

function personRef(author: Author): PersonRef {
  return {
    name: author.name,
    ...(author.slug ? { slug: author.slug } : {}),
    ...(author.linkedin ? { linkedinUrl: author.linkedin } : {}),
    ...(author.role ? { jobTitle: author.role } : {}),
  };
}

/** Flatten a React node tree to its text, so an h2's slug id matches the TOC entry. */

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<ReactNode> {
  const { slug } = await params;
  const article = await getInsight(slug);
  if (!article) notFound();

  const path = `/insights/${slug}`;
  const articleInput: ArticleInput = {
    // The schema type the editor chose for this piece; anything unrecognised falls back safely.
    type: isArticleType(article.schemaType) ? article.schemaType : "BlogPosting",
    path,
    headline: article.title,
    description: descriptionFor(article.excerpt, article.tldr, article.metaDescription),
    author: article.author
      ? personRef(article.author)
      : { name: "Nexoris Technologies" },
    ...(article.factChecker ? { reviewer: personRef(article.factChecker) } : {}),
    ...(article.category ? { articleSection: article.category } : {}),
    ...(article.coverUrl
      ? { image: { url: mediaAbsolute(article.coverUrl), alt: article.coverAlt ?? article.title } }
      : {}),
    ...(article.publishedAt ? { datePublished: article.publishedAt } : {}),
    ...(article.updatedAt ? { dateModified: article.updatedAt } : {}),
  };

  // A guide marked HowTo emits a HowTo node instead of an Article one. HowTo is not an Article subtype:
  // it carries a required list of steps, so putting "@type": "HowTo" on an article node would produce
  // markup that validates as neither. The steps are this article's own H2 sections, so the structured
  // data says exactly what the page says.
  const howToSteps = article.schemaType === "HowTo" ? stepsOf(article.body) : [];
  const isHowTo = article.schemaType === "HowTo" && howToSteps.length > 0;
  const image = article.coverUrl
    ? { image: { url: mediaAbsolute(article.coverUrl), alt: article.coverAlt ?? article.title } }
    : {};
  const dates = {
    ...(article.publishedAt ? { datePublished: article.publishedAt } : {}),
    ...(article.updatedAt ? { dateModified: article.updatedAt } : {}),
  };

  // Built through buildPageGraph, which is what carries the site-wide nodes: Organization,
  // ProfessionalService, WebSite and the WebPage itself. This page used to assemble its own graph
  // from bare nodes, so every published article shipped without any of them while every hardcoded
  // page had them. Nothing caught it, because the SEO gate only ever saw the hardcoded routes.
  const graph = buildPageGraph({
    page: {
      routeClass: "insight",
      path,
      name: article.title,
      description: descriptionFor(article.excerpt, article.tldr, article.metaDescription),
      breadcrumbs: [
        { name: "Insights", path: "/insights" },
        { name: article.title, path },
      ],
    },
    ...(isHowTo
      ? {
          extraNodes: [
            howToNode({
              path,
              name: article.title,
              description: descriptionFor(article.excerpt, article.tldr, article.metaDescription),
              steps: howToSteps,
              ...image,
              ...dates,
            }),
          ],
        }
      : { article: articleInput }),
    ...(article.faq.length > 0 ? { faq: article.faq } : {}),
  });

  // From the body as it will actually be rendered, not as it is stored.
  // stripDuplicateBlocks removes a TL;DR that was inserted into the body when one is also stored as
  // its own field, so building the contents from the stored body listed a "TL;DR" entry whose anchor
  // had been stripped off the page: the first link in the contents of every such article went nowhere.
  const readableBody = stripDuplicateBlocks(article.body, { tldr: article.tldr, faq: article.faq });
  /*
   * The contents, plus the FAQ section.
   *
   * headingsOf only sees the body, and the FAQ accordion is a separate section rendered after it, so
   * the last thing on the page was the one thing the contents did not list. It is a real H2 with a
   * real anchor and readers go looking for it, so it belongs in the list like any other section.
   */
  const toc = [
    ...headingsOf(readableBody),
    ...(article.faq.length > 0 ? [{ id: "faq-heading", text: "Common questions" }] : []),
  ];
  const people = [
    article.author ? { kind: "Written by", person: article.author } : null,
    article.factChecker ? { kind: "Fact-checked by", person: article.factChecker } : null,
  ].filter((p): p is { kind: string; person: Author } => p !== null);

  // Anything the assistant inserted into the body that the page also renders from its own fields is
  // removed here, so an article saved before those buttons went away stops publishing twice.
  const reading = (
    <div className="reading">
      {article.tldr && article.tldr.length > 0 ? (
        <div className="tldr">
          <h2>
            <svg viewBox="0 0 24 24">
              <path d="M9 11l3 3 8-8M5 13l3 3 1-1" />
            </svg>
            The short version
          </h2>
          {/* The list as written. Joining it into a paragraph lost the scannability that is the
              whole point of a TL;DR. */}
          <ul>
            {article.tldr.map((point) => <li key={point}>{point}</li>)}
          </ul>
        </div>
      ) : null}

      {/* The CMS stores HTML. Passing it to ReactMarkdown escaped every tag, so an article with a
          heading, a list or a table published its own markup as visible text — it only ever looked
          right because the content that had been through here was unformatted prose. Sanitised on the
          way out as well as in the editor, so a row written before the editor normalised anything
          cannot put a script on a public page. */}
      <div className="prose" dangerouslySetInnerHTML={{ __html: wrapTables(withHeadingIds(readableBody)) }} />

      {article.faq.length > 0 ? (
        <section className="faq-block" aria-labelledby="faq-heading">
          <h2 id="faq-heading">Common questions</h2>
          <div className="faq-wrap">
            {article.faq.map((item) => (
              <details className="faq" key={item.question}>
                <summary>
                  {item.question} <span className="fq-pm">+</span>
                </summary>
                <div className="faq-a">{item.answer}</div>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      {people.length > 0 ? (
        <section className="people" aria-label="About the people behind this article">
          {people.map(({ kind, person }) => (
            <div className="pcard" key={kind}>
              <div className="pc-head">
                <span className="avatar" aria-hidden="true">
                  {initials(person.name)}
                </span>
                <div className="pc-id">
                  <div className="pk">{kind}</div>
                  <h3>{person.name}</h3>
                </div>
              </div>
              {person.bio ? <p>{person.bio}</p> : person.role ? <p>{person.role}</p> : null}
              {person.slug ? (
                <Link className="pmore" href={authorPath(person.slug)}>
                  Read full profile &rarr;
                </Link>
              ) : null}
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );

  return (
    <div className="svc-page article-page">
      <JsonLd graph={graph} />
      {/* Counts one view per session. The page is statically generated, so there is no per-reader
          server render to count from; this reports from the browser instead. */}
      <CountView slug={slug} />

      <section className="art-hero" aria-label={article.title}>
        <div className="glow" />
        <div className="wrap">
          <nav className="crumb" aria-label="Breadcrumb">
            <Link href="/insights">Insights</Link>
            <span className="sep">/</span>
            {/* The short title is what the design uses where the full one would wrap. The H1 keeps
                the full title, because that is the page's actual name. */}
            <span className="here">{article.shortTitle ?? article.title}</span>
          </nav>
          <div className="art-head">
            {article.category ? <span className="cat-pill">{article.category}</span> : null}
            <h1>{article.title}</h1>
            {article.excerpt ? <p className="sub">{article.excerpt}</p> : null}

            {people.length > 0 ? (
              <div className="byline">
                {people.map(({ kind, person }) => (
                  <div className="bperson" key={kind}>
                    <span className="avatar" aria-hidden="true">
                      {initials(person.name)}
                    </span>
                    <div>
                      <div className="role">{kind}</div>
                      <div className="nm">{person.name}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="art-facts">
              {article.publishedAt ? (
                <span className="f">
                  <svg viewBox="0 0 24 24">
                    <rect x="4" y="5" width="16" height="16" rx="2" />
                    <path d="M16 3v4M8 3v4M4 11h16" />
                  </svg>
                  Published {formatLagosDate(article.publishedAt)}
                </span>
              ) : null}
              {article.updatedAt && article.updatedAt !== article.publishedAt ? (
                <span className="f">
                  <svg viewBox="0 0 24 24">
                    <path d="M21 12a9 9 0 1 1-3-6.7M21 4v4h-4" />
                  </svg>
                  Updated {formatLagosDate(article.updatedAt)}
                </span>
              ) : null}
            </div>
          </div>

          {article.coverUrl ? (
            <div className="art-figure">
              {/* Remote CMS cover; host isn't configured for next/image, so a plain img. */}
              <img src={article.coverUrl} alt={article.coverAlt ?? `Cover image for ${article.title}`} />
            </div>
          ) : null}
        </div>
      </section>

      <div className="wrap">
        {toc.length > 0 ? (
          <div className="art-layout">
            {/* data-toc is how TocSpy finds this list. The markup stays on the server so the
                contents are in the HTML and work without JavaScript; only the "you are here"
                marker needs a browser. */}
            <aside className="toc-aside" data-toc aria-label="On this page">
              <p className="toc-title">On this page</p>
              <ol>
                {toc.map((h) => (
                  <li key={h.id}>
                    <a href={`#${h.id}`}>{h.text}</a>
                  </li>
                ))}
              </ol>
            </aside>
            {reading}
          </div>
        ) : (
          <div className="art-layout" style={{ gridTemplateColumns: "1fr", maxWidth: "760px" }}>
            {reading}
          </div>
        )}
      </div>

      {/* The sticky column above is hidden below 1024px, which left a phone — where a long article is
          hardest to navigate — with no contents at all. Same entries, shown as a sheet. */}
      <FloatingToc entries={toc} />
      {/* Lights up the sticky column above as the reader moves through the article. */}
      <TocSpy ids={toc.map((h) => h.id)} />
    </div>
  );
}
