/**
 * The Insights hub (PRD Stage 8): a grid of published articles, newest first, with excerpt and
 * date. CMS-driven via ISR; an empty, helpful state shows until the first article is published.
 * This route is more specific than the catch-all, so it takes precedence.
 */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildMetadata, buildPageGraph } from "@nexoris/seo";
import { getAllInsightCards, getCategoryTabs } from "../../lib/cms.js";
import { InsightsView } from "../../components/company/InsightsView.js";
import { JsonLd } from "../../components/JsonLd.js";

const PAGE_TITLE = "Insights | Nexoris Technologies";
const PAGE_DESCRIPTION =
  "Practical articles on custom software, automation and applied AI for businesses in Nigeria and beyond, from the engineers who build these systems every day.";


/**
 * The page graph. This route used to emit no JSON-LD at all, so search engines and AI retrievers saw
 * none of the site-wide entity nodes here that every other page carries.
 */
function graph() {
  return buildPageGraph({
    page: {
      routeClass: "collection",
      path: "/insights",
      name: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      breadcrumbs: [{ name: "Insights", path: "/insights" }],
    },
  });
}

export const revalidate = 300;

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: "/insights",
    ogType: "website",
    noindex: false,
  });
}

export default async function InsightsHubPage(): Promise<ReactNode> {
  const [articles, categories] = await Promise.all([getAllInsightCards(), getCategoryTabs()]);
  return (
    <>
      <JsonLd graph={graph()} />
      <InsightsView cards={articles} categories={categories} />
    </>
  );
}
