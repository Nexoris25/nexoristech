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
import { Container, Section } from "@nexoris/ui";
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

const markdownComponents = {
  h2: ({ children }: { children?: ReactNode }) => (
    <h2 className="mt-8 font-syne text-section font-700 text-ink-950">
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: ReactNode }) => (
    <h3 className="mt-6 font-syne text-subhead font-600 text-ink-950">
      {children}
    </h3>
  ),
  p: ({ children }: { children?: ReactNode }) => (
    <p className="mt-4 text-body text-neutral-700">{children}</p>
  ),
  ul: ({ children }: { children?: ReactNode }) => (
    <ul className="mt-4 list-disc pl-6 text-body text-neutral-700">{children}</ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol className="mt-4 list-decimal pl-6 text-body text-neutral-700">
      {children}
    </ol>
  ),
  li: ({ children }: { children?: ReactNode }) => (
    <li className="mt-1">{children}</li>
  ),
  a: ({ href, children }: { href?: string; children?: ReactNode }) => (
    <a
      href={href}
      className="cursor-pointer text-purple-700 underline hover:text-purple-600"
    >
      {children}
    </a>
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

  return (
    <>
      <JsonLd graph={buildGraph(nodes)} />
      <Section>
        <Container className="max-w-article">
          <nav className="text-label text-neutral-600" aria-label="Breadcrumb">
            <Link href="/insights" className="cursor-pointer hover:text-purple-700">
              Insights
            </Link>
            <span aria-hidden="true"> / </span>
            <span>{article.title}</span>
          </nav>

          {article.category ? (
            <p className="mt-6 text-eyebrow uppercase text-purple-600">
              {article.category}
            </p>
          ) : null}
          <h1 className="mt-2 font-syne text-hero font-700 text-ink-950">
            {article.title}
          </h1>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-label text-neutral-600">
            {article.author ? <span>By {article.author.name}</span> : null}
            {article.factChecker ? (
              <span>Fact-checked by {article.factChecker.name}</span>
            ) : null}
            {article.publishedAt ? (
              <span>{formatLagosDate(article.publishedAt)}</span>
            ) : null}
          </div>

          {article.tldr ? (
            <div className="mt-8 rounded-card border border-purple-200 bg-purple-100 p-6">
              <h2 className="text-eyebrow uppercase text-purple-700">
                The short version
              </h2>
              <p className="mt-2 text-body text-ink-950">{article.tldr}</p>
            </div>
          ) : null}

          <div className="mt-8">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {article.body}
            </ReactMarkdown>
          </div>

          {article.faq.length > 0 ? (
            <section className="mt-12" aria-labelledby="faq-heading">
              <h2
                id="faq-heading"
                className="font-syne text-section font-700 text-ink-950"
              >
                Common questions
              </h2>
              <dl className="mt-6 flex flex-col gap-6">
                {article.faq.map((item) => (
                  <div key={item.question}>
                    <dt className="font-syne text-subhead font-600 text-ink-950">
                      {item.question}
                    </dt>
                    <dd className="mt-2 text-body text-neutral-700">
                      {item.answer}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          {article.author?.bio ? (
            <aside className="mt-12 rounded-card border border-purple-200 p-6">
              <h2 className="text-eyebrow uppercase text-purple-600">
                About the author
              </h2>
              <p className="mt-2 font-600 text-ink-950">{article.author.name}</p>
              <p className="mt-2 text-body text-neutral-700">
                {article.author.bio}
              </p>
            </aside>
          ) : null}
        </Container>
      </Section>
    </>
  );
}
