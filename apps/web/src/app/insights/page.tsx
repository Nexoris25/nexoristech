/**
 * The Insights hub (PRD Stage 8): a grid of published articles, newest first, with excerpt and
 * date. CMS-driven via ISR; an empty, helpful state shows until the first article is published.
 * This route is more specific than the catch-all, so it takes precedence.
 */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildMetadata } from "@nexoris/seo";
import { getAllInsightCards } from "../../lib/cms.js";
import { InsightsView } from "../../components/company/InsightsView.js";

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
  return <InsightsView cards={articles} />;
}
