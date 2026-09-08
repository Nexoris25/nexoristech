import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildMetadata, buildPageGraph } from "@nexoris/seo";
import { LegalPageView } from "../../components/LegalPageView.js";
import { JsonLd } from "../../components/JsonLd.js";

const PAGE_TITLE = "Privacy Policy | Nexoris Technologies";
const PAGE_DESCRIPTION =
  "How Nexoris Technologies collects, uses and protects your personal data, the legal basis for each use, who we share it with, and the rights you can exercise.";


/**
 * The page graph. This route used to emit no JSON-LD at all, so search engines and AI retrievers saw
 * none of the site-wide entity nodes here that every other page carries.
 */
function graph() {
  return buildPageGraph({
    page: {
      routeClass: "legal",
      path: "/privacy-policy",
      name: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      breadcrumbs: [{ name: "Privacy Policy", path: "/privacy-policy" }],
    },
  });
}

export const revalidate = 300;

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: "/privacy-policy",
    ogType: "website",
    // Kept out of the index by choice: a utility page, discoverable but not a search result.
    noindex: true,
  });
}

export default function PrivacyPolicyPage(): ReactNode {
  return (
    <>
      <JsonLd graph={graph()} />
      <LegalPageView type="privacy-policy" heading="Privacy Policy" />
    </>
  );
}
