/**
 * An author profile (PRD Stage 8): a ProfilePage with Person schema, the author's bio and role,
 * and the articles they have written. CMS-driven via ISR; notFound for an unknown slug.
 */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Container, Section } from "@nexoris/ui";
import { buildMetadata, buildGraph, profilePageNode } from "@nexoris/seo";
import type { ProfileInput } from "@nexoris/seo";
import { JsonLd } from "../../../components/JsonLd.js";
import {
  getAuthor,
  getAuthorSlugs,
  getArticlesByAuthor,
} from "../../../lib/cms.js";
import { formatLagosDate } from "../../../lib/date.js";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const slugs = await getAuthorSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const author = await getAuthor(slug);
  if (!author) return { title: "Author not found | Nexoris Technologies" };
  return buildMetadata({
    title: `${author.name} | Nexoris Technologies`,
    description:
      author.bio ??
      `${author.name} writes for Nexoris Technologies on software, automation, and AI.`,
    path: `/authors/${slug}`,
    ogType: "website",
    noindex: false,
  });
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<ReactNode> {
  const { slug } = await params;
  const author = await getAuthor(slug);
  if (!author) notFound();

  const articles = await getArticlesByAuthor(slug);

  const profileInput: ProfileInput = {
    slug,
    name: author.name,
    ...(author.role ? { jobTitle: author.role } : {}),
    ...(author.linkedin ? { linkedinUrl: author.linkedin } : {}),
    ...(author.photoUrl
      ? { image: { url: author.photoUrl, alt: author.name } }
      : {}),
  };

  return (
    <>
      <JsonLd graph={buildGraph([profilePageNode(profileInput)])} />
      <Section>
        <Container className="max-w-article">
          {author.role ? (
            <p className="text-eyebrow uppercase text-purple-600">
              {author.role}
            </p>
          ) : null}
          <h1 className="mt-2 font-jakarta text-hero font-700 text-ink-950">
            {author.name}
          </h1>
          {author.bio ? (
            <p className="mt-4 text-body text-neutral-700">{author.bio}</p>
          ) : null}
          {author.linkedin ? (
            <p className="mt-4">
              <a
                href={author.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer font-600 text-purple-700 hover:text-purple-600"
              >
                Connect on LinkedIn &rarr;
              </a>
            </p>
          ) : null}

          {articles.length > 0 ? (
            <section className="mt-12" aria-labelledby="by-author">
              <h2
                id="by-author"
                className="font-jakarta text-section font-700 text-ink-950"
              >
                Articles by {author.name}
              </h2>
              <ul className="mt-6 flex flex-col gap-4">
                {articles.map((article) => (
                  <li key={article.slug}>
                    <Link
                      href={`/insights/${article.slug}`}
                      className="group cursor-pointer"
                    >
                      <span className="font-jakarta text-subhead font-600 text-ink-950 group-hover:text-purple-700">
                        {article.title}
                      </span>
                      {article.publishedAt ? (
                        <span className="ml-2 text-label text-neutral-600">
                          {formatLagosDate(article.publishedAt)}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </Container>
      </Section>
    </>
  );
}
