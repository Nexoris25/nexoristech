/**
 * The Insights hub (PRD Stage 8): a grid of published articles, newest first, with excerpt and
 * date. CMS-driven via ISR; an empty, helpful state shows until the first article is published.
 * This route is more specific than the catch-all, so it takes precedence.
 */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Container, Section } from "@nexoris/ui";
import { buildMetadata } from "@nexoris/seo";
import { getAllInsightCards } from "../../lib/cms.js";
import { formatLagosDate } from "../../lib/date.js";

export const revalidate = 300;

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: "Insights | Nexoris Technologies",
    description:
      "Practical articles on software, automation, and AI for businesses in Nigeria and beyond, from the team at Nexoris Technologies.",
    path: "/insights",
    ogType: "website",
    noindex: false,
  });
}

export default async function InsightsHubPage(): Promise<ReactNode> {
  const articles = await getAllInsightCards();

  return (
    <Section>
      <Container>
        <p className="text-eyebrow uppercase text-purple-600">Insights</p>
        <h1 className="mt-2 max-w-[24ch] font-roboto text-hero font-700 text-ink-950">
          Ideas worth your time.
        </h1>
        <p className="mt-4 max-w-[60ch] text-body text-neutral-600">
          Practical writing on software, automation, and AI for businesses in
          Nigeria and beyond.
        </p>

        {articles.length === 0 ? (
          <p className="mt-10 text-body text-neutral-600">
            Our first articles are on the way. In the meantime, tell us what you
            are working on and we will point you in the right direction.
          </p>
        ) : (
          <ul className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <li key={article.slug}>
                <Link
                  href={`/insights/${article.slug}`}
                  className="group flex h-full cursor-pointer flex-col rounded-card border border-purple-200 p-6 transition hover:border-purple-600"
                >
                  <h2 className="font-roboto text-subhead font-700 text-ink-950 group-hover:text-purple-700">
                    {article.title}
                  </h2>
                  {article.excerpt ? (
                    <p className="mt-2 flex-1 text-body text-neutral-600">
                      {article.excerpt}
                    </p>
                  ) : null}
                  {article.publishedAt ? (
                    <span className="mt-4 text-label text-neutral-600">
                      {formatLagosDate(article.publishedAt)}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </Section>
  );
}
