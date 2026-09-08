import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildMetadata, buildPageGraph } from "@nexoris/seo";
import { LegalPageView } from "../../components/LegalPageView.js";
import { JsonLd } from "../../components/JsonLd.js";

const PAGE_TITLE = "Terms of Service | Nexoris Technologies";
const PAGE_DESCRIPTION =
  "The terms for using the Nexoris Technologies website and services: what we provide, what we expect, how liability and intellectual property work between us.";


/**
 * The page graph. This route used to emit no JSON-LD at all, so search engines and AI retrievers saw
 * none of the site-wide entity nodes here that every other page carries.
 */
function graph() {
  return buildPageGraph({
    page: {
      routeClass: "legal",
      path: "/terms-of-service",
      name: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      breadcrumbs: [{ name: "Terms of Service", path: "/terms-of-service" }],
    },
  });
}

export const revalidate = 300;

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: "/terms-of-service",
    ogType: "website",
    // Kept out of the index by choice: a utility page, discoverable but not a search result.
    noindex: true,
  });
}

export default function TermsOfServicePage(): ReactNode {
  return (
    <>
      <JsonLd graph={graph()} />
      <LegalPageView type="terms-of-service" heading="Terms of Service" />
    </>
  );
}
