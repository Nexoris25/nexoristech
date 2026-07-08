/**
 * An Insights article (PRD Stage 8): EEAT structure with author and fact-checker, an optional
 * TL;DR, the body, and an FAQ, plus an Article (BlogPosting) and FAQPage JSON-LD graph with
 * breadcrumbs. CMS-driven via ISR; new articles render on demand. notFound for an unknown slug.
 */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  buildMetadata,
  buildGraph,
  articleNode,
  faqPageNode,
  breadcrumbNode,
} from "@nexoris/seo";
import type { ArticleInput, JsonLdNode, PersonRef } from "@nexoris/seo";
import { JsonLd } from "../../../components/JsonLd.js";
import { formatLagosDate } from "../../../lib/date.js";
import { getInsight, getInsightSlugs, type Author } from "../../../lib/cms.js";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const slugs = await getInsightSlugs();
  return slugs.map((slug) => ({ slug }));
}

function descriptionFor(excerpt?: string, tldr?: string): string {
  return (
    excerpt ??
    tldr ??
    "An article from the team at Nexoris Technologies."
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getInsight(slug);
  if (!article) return { title: "Article not found | Nexoris Technologies" };
  return buildMetadata({
    title: `${article.title} | Nexoris Technologies`,
    description: descriptionFor(article.excerpt, article.tldr),
    path: `/insights/${slug}`,
    ogType: "article",
    noindex: false,
  });
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
function nodeText(node: ReactNode): string {
  if (node == null || node === false) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join("");
  if (typeof node === "object" && "props" in node) {
    return nodeText((node as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Section headings (## lines) from the markdown body, for the table of contents. */
function headingsFrom(body: string): { text: string; id: string }[] {
  return body
    .split("\n")
    .map((line) => /^## +(.+)$/.exec(line.trim()))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => {
      const text = (m[1] ?? "").trim();
      return { text, id: slugify(text) };
    });
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

const markdownComponents = {
  h2: ({ children }: { children?: ReactNode }) => (
    <h2 id={slugify(nodeText(children))}>{children}</h2>
  ),
};

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
    type: "BlogPosting",
    path,
    headline: article.title,
    description: descriptionFor(article.excerpt, article.tldr),
    author: article.author
      ? personRef(article.author)
      : { name: "Nexoris Technologies" },
    ...(article.factChecker ? { reviewer: personRef(article.factChecker) } : {}),
    ...(article.category ? { articleSection: article.category } : {}),
    ...(article.coverUrl
      ? { image: { url: article.coverUrl, alt: article.title } }
      : {}),
    ...(article.publishedAt ? { datePublished: article.publishedAt } : {}),
    ...(article.updatedAt ? { dateModified: article.updatedAt } : {}),
  };

  const nodes: JsonLdNode[] = [articleNode(articleInput)];
  const faqNode = article.faq.length > 0 ? faqPageNode(article.faq) : undefined;
  if (faqNode) nodes.push(faqNode);
  nodes.push(
    breadcrumbNode([
      { name: "Insights", path: "/insights" },
      { name: article.title, path },
    ]),
  );

  const toc = headingsFrom(article.body);
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

      <div className="prose">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
          {article.body}
        </ReactMarkdown>
      </div>

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
            <span className="here">{article.title}</span>
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={article.coverUrl} alt="" />
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
    </div>
  );
}
