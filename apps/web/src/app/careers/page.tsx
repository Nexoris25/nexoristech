/**
 * The careers hub (PRD Stage 8): the open roles from the CMS. ISR-driven, with a warm empty state
 * when there are no current openings.
 */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildMetadata, buildPageGraph } from "@nexoris/seo";
import { getJobs } from "../../lib/cms.js";
import { CareersView } from "../../components/company/CareersView.js";
import { JsonLd } from "../../components/JsonLd.js";

const PAGE_TITLE = "Careers | Nexoris Technologies";
const PAGE_DESCRIPTION = "Join the Lagos team building software that real businesses use every day. Real ownership, honest feedback, and products you can point to. See the open roles.";


/**
 * The page graph. This route used to emit no JSON-LD at all, so search engines and AI retrievers saw
 * none of the site-wide entity nodes here that every other page carries.
 */
function graph() {
  return buildPageGraph({
    page: {
      routeClass: "collection",
      path: "/careers",
      name: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      breadcrumbs: [{ name: "Careers", path: "/careers" }],
    },
  });
}

export const revalidate = 300;

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: "/careers",
    ogType: "website",
    noindex: false,
  });
}

export default async function CareersPage(): Promise<ReactNode> {
  const jobs = await getJobs();
  return (
    <>
      <JsonLd graph={graph()} />
      <CareersView jobs={jobs} />
    </>
  );
}
