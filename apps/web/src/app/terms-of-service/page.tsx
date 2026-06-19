import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildMetadata } from "@nexoris/seo";
import { LegalPageView } from "../../components/LegalPageView.js";

export const revalidate = 300;

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: "Terms of Service | Nexoris Technologies",
    description:
      "The terms that govern your use of the Nexoris Technologies website and services.",
    path: "/terms-of-service",
    ogType: "website",
    noindex: false,
  });
}

export default function TermsOfServicePage(): ReactNode {
  return <LegalPageView type="terms-of-service" heading="Terms of Service" />;
}
