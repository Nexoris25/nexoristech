import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildMetadata, buildPageGraph } from "@nexoris/seo";
import { LegalPageView } from "../../components/LegalPageView.js";
import { JsonLd } from "../../components/JsonLd.js";

const PAGE_TITLE = "Cookie Policy | Nexoris Technologies";
const PAGE_DESCRIPTION =
  "How Nexoris Technologies uses cookies: which are essential, which optional, what each one does, how long it lasts, and how to change your choice at any time.";


/**
 * The page graph. This route used to emit no JSON-LD at all, so search engines and AI retrievers saw
 * none of the site-wide entity nodes here that every other page carries.
 */
function graph() {
  return buildPageGraph({
    page: {
      routeClass: "legal",
      path: "/cookie-policy",
      name: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      breadcrumbs: [{ name: "Cookie Policy", path: "/cookie-policy" }],
    },
  });
}

export const revalidate = 300;

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: "/cookie-policy",
    ogType: "website",
    // Kept out of the index by choice: a utility page, discoverable but not a search result.
    noindex: true,
  });
}

export default function CookiePolicyPage(): ReactNode {
  return (
    <>
      <JsonLd graph={graph()} />
      <LegalPageView type="cookie-policy" heading="Cookie Policy" />
    </>
  );
}
