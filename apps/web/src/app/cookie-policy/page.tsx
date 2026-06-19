import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildMetadata } from "@nexoris/seo";
import { LegalPageView } from "../../components/LegalPageView.js";

export const revalidate = 300;

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: "Cookie Policy | Nexoris Technologies",
    description:
      "How Nexoris Technologies uses cookies and similar technologies, and the choices you have.",
    path: "/cookie-policy",
    ogType: "website",
    noindex: false,
  });
}

export default function CookiePolicyPage(): ReactNode {
  return <LegalPageView type="cookie-policy" heading="Cookie Policy" />;
}
