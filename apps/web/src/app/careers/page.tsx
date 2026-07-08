/**
 * The careers hub (PRD Stage 8): the open roles from the CMS. ISR-driven, with a warm empty state
 * when there are no current openings.
 */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildMetadata } from "@nexoris/seo";
import { getJobs } from "../../lib/cms.js";
import { CareersView } from "../../components/company/CareersView.js";

export const revalidate = 300;

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: "Careers | Nexoris Technologies",
    description:
      "Join the Lagos team building software that real businesses use every day. Real ownership, honest feedback, and products you can point to. See the open roles.",
    path: "/careers",
    ogType: "website",
    noindex: false,
  });
}

export default async function CareersPage(): Promise<ReactNode> {
  const jobs = await getJobs();
  return <CareersView jobs={jobs} />;
}
