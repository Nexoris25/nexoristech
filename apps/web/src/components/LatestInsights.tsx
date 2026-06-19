/**
 * The home "latest Insights" section (PRD 12): the three most recent published articles from the
 * content API. Renders nothing until the CMS has published articles.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { getLatestInsights } from "../lib/cms.js";
import { formatLagosDate } from "../lib/date.js";

export async function LatestInsights(): Promise<ReactNode> {
  const insights = await getLatestInsights(3);
  if (insights.length === 0) return null;

  return (
    <ul className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
      {insights.map((insight) => (
        <li key={insight.slug}>
          <Link
            href={`/insights/${insight.slug}`}
            className="group flex h-full cursor-pointer flex-col rounded-card border border-purple-200 p-6 transition hover:border-purple-600"
          >
            <h3 className="font-jakarta text-subhead font-700 text-ink-950 group-hover:text-purple-700">
              {insight.title}
            </h3>
            {insight.excerpt ? (
              <p className="mt-2 flex-1 text-body text-neutral-600">
                {insight.excerpt}
              </p>
            ) : null}
            {insight.publishedAt ? (
              <span className="mt-4 text-label text-neutral-600">
                {formatLagosDate(insight.publishedAt)}
              </span>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}
