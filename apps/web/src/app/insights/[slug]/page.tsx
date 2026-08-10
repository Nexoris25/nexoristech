/**
 * An Insights article (PRD Stage 8): EEAT structure with author and fact-checker, an optional
 * TL;DR, the body, and an FAQ, plus an Article (BlogPosting) and FAQPage JSON-LD graph with
 * breadcrumbs. CMS-driven via ISR; new articles render on demand. notFound for an unknown slug.
 */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  buildMetadata,
  buildGraph,
  articleNode,
  howToNode,
  faqPageNode,
  breadcrumbNode,
  absoluteUrl,
} from "@nexoris/seo";
import type { ArticleInput, JsonLdNode, PersonRef } from "@nexoris/seo";
import { isArticleType } from "@nexoris/seo";
import { JsonLd } from "../../../components/JsonLd.js";
import { formatLagosDate } from "../../../lib/date.js";
import { getInsight, getInsightSlugs, type Author } from "../../../lib/cms.js";
import { headingsOf, withHeadingIds, stepsOf } from "../../../lib/render-html.js";
import { FloatingToc } from "../../../components/FloatingToc.js";
import "../../../styles/article.css";

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
/** A meta description within the 160-char hard limit. */
function descriptionFor(excerpt?: string, tldr?: string, metaDescription?: string): string {
  const raw = metaDescription ?? excerpt ?? tldr ?? "An article from the team at Nexoris Technologies.";
  return raw.length > 160 ? `${raw.slice(0, 157).trimEnd()}...` : raw;
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
  const nodes: JsonLdNode[] = article.schemaType === "HowTo" && howToSteps.length > 0
    ? [howToNode({
        path,
        name: article.title,
        description: descriptionFor(article.excerpt, article.tldr, article.metaDescription),
        steps: howToSteps,
        ...(article.coverUrl
          ? { image: { url: mediaAbsolute(article.coverUrl), alt: article.coverAlt ?? article.title } }
          : {}),
        ...(article.publishedAt ? { datePublished: article.publishedAt } : {}),
        ...(article.updatedAt ? { dateModified: article.updatedAt } : {}),
      })]
    : [articleNode(articleInput)];
  const faqNode = article.faq.length > 0 ? faqPageNode(article.faq) : undefined;
  if (faqNode) nodes.push(faqNode);
  nodes.push(
    breadcrumbNode([
      { name: "Insights", path: "/insights" },
      { name: article.title, path },
    ]),
  );

  const toc = headingsOf(article.body);
  const people = [
    article.author ? { kind: "Written by", person: article.author } : null,
    article.factChecker ? { kind: "Fact-checked by", person: article.factChecker } : null,
  ].filter((p): p is { kind: string; person: Author } => p !== null);

  const reading = (
    <div className="reading">
      {article.tldr ? (
        <div className="tldr">
          <h2>
            <svg viewBox="0 0 24 24">
              <path d="M9 11l3 3 8-8M5 13l3 3 1-1" />
            </svg>
            The short version
          </h2>
          <p>{article.tldr}</p>
        </div>
      ) : null}

      {/* The CMS stores HTML. Passing it to ReactMarkdown escaped every tag, so an article with a
          heading, a list or a table published its own markup as visible text — it only ever looked
          right because the content that had been through here was unformatted prose. Sanitised on the
          way out as well as in the editor, so a row written before the editor normalised anything
          cannot put a script on a public page. */}
      <div className="prose" dangerouslySetInnerHTML={{ __html: withHeadingIds(article.body) }} />

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
                <Link className="pmore" href={`/authors/${person.slug}`}>
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
      <JsonLd graph={buildGraph(nodes)} />

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
            <aside className="toc-aside" aria-label="On this page">
              <h4>On this page</h4>
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
    </div>
  );
}
