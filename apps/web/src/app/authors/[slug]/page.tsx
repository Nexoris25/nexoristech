/**
 * An author profile (PRD Stage 8): a ProfilePage with Person schema, the author's bio and role,
 * and the articles they have written. CMS-driven via ISR; notFound for an unknown slug.
 */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
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

  const av = author.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="svc-page insights-page author-page">
      <JsonLd graph={buildGraph([profilePageNode(profileInput)])} />

      <section className="hero" aria-label={`${author.name}, author profile`}>
        <div className="glow" />
        <div className="wrap">
          <nav className="crumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="sep">/</span>
            <Link href="/insights">Insights</Link>
            <span className="sep">/</span>
            <span className="here">{author.name}</span>
          </nav>
          <div className="prof">
            <div className="prof-av" aria-hidden={author.photoUrl ? undefined : "true"}>
              {author.photoUrl ? (
                // Remote CMS photo; host isn't configured for next/image, so a plain img.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={author.photoUrl} alt={author.name} />
              ) : (
                av
              )}
            </div>
            <div>
              <h1>{author.name}</h1>
              {author.role ? (
                <div className="roles">
                  <span className="role">{author.role}</span>
                </div>
              ) : null}
              {author.bio ? <p className="bio">{author.bio}</p> : null}
              {author.linkedin ? (
                <div className="prof-links">
                  <a
                    className="plink"
                    href={author.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.65h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.4c0-1.3-.03-2.95-1.8-2.95-1.8 0-2.08 1.4-2.08 2.85V21H9z" />
                    </svg>
                    Connect on LinkedIn
                  </a>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="band" aria-label={`Articles by ${author.name}`}>
        <div className="wrap">
          <h2 className="by-head">Articles by {author.name}</h2>
          {articles.length === 0 ? (
            <div className="ins-empty">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 5h16v14H4z" />
                <path d="M8 9h8M8 13h5" />
              </svg>
              <h3>No published articles yet.</h3>
              <p>When {author.name} publishes, the articles will appear here.</p>
            </div>
          ) : (
            <div className="ins-grid">
              {articles.map((article) => (
                <article className="card" key={article.slug}>
                  <span className="thumb">
                    {article.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={article.coverUrl} alt={`Cover image for the article ${article.title}`} loading="lazy" />
                    ) : null}
                  </span>
                  <div className="card-body">
                    <h3>
                      <Link href={`/insights/${article.slug}`}>{article.title}</Link>
                    </h3>
                    {article.excerpt ? <p className="card-ex">{article.excerpt}</p> : null}
                    {article.publishedAt ? (
                      <span className="card-cta">{formatLagosDate(article.publishedAt)}</span>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
