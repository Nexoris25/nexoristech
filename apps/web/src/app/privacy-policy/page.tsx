import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildMetadata } from "@nexoris/seo";
import { LegalPageView } from "../../components/LegalPageView.js";

export const revalidate = 300;

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: "Privacy Policy | Nexoris Technologies",
    description:
      "How Nexoris Technologies collects, uses, and protects the information you share with us.",
    path: "/privacy-policy",
    ogType: "website",
    noindex: false,
  });
}

export default function PrivacyPolicyPage(): ReactNode {
  return <LegalPageView type="privacy-policy" heading="Privacy Policy" />;
}
