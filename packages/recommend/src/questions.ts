/**
 * The five Solution Finder questions (PRD 10.5). Industry, the biggest current headache, company
 * size, urgency, and an optional budget. The headache options and their service mapping were
 * approved by the product owner on 2026-06-19, grounded in the home pain copy and the 11 services.
 * Budget uses neutral options with no figures (no amounts are specified in the approved docs).
 * Company size and urgency are conventional ranges. Industry options derive from the registry.
 */
import { INDUSTRIES } from "./registry.js";
import type { ServiceSlug } from "./registry.js";

export type HeadacheId =
  | "duplicate-data"
  | "slow-reports"
  | "missed-messages"
  | "new-build"
  | "sell-online"
  | "hard-to-find"
  | "track-assets"
  | "public-sector"
  | "unreliable-software";

export type CompanySize = "solo" | "2-10" | "11-50" | "51-200" | "200-plus";
export type Urgency = "asap" | "month" | "quarter" | "exploring";
export type Budget = "not-sure" | "rough" | "prefer-not";

export interface Option<T extends string> {
  readonly value: T;
  readonly label: string;
}

/** The headache options shown to the visitor, in order. */
export const HEADACHE_OPTIONS: readonly Option<HeadacheId>[] = [
  {
    value: "duplicate-data",
    label: "We keep re-entering the same data across different tools",
  },
  { value: "slow-reports", label: "Reports arrive too late to act on" },
  {
    value: "missed-messages",
    label: "We miss customer messages, especially after hours",
  },
  { value: "new-build", label: "We need a new website, app, or custom system" },
  { value: "sell-online", label: "We want to sell more online" },
  {
    value: "hard-to-find",
    label: "Customers cannot find us on Google or AI tools",
  },
  {
    value: "track-assets",
    label: "We need to track vehicles, machines, or stock live",
  },
  {
    value: "public-sector",
    label: "We are a government or public agency needing digital services",
  },
  {
    value: "unreliable-software",
    label: "Our software keeps breaking or has no support",
  },
];

export const COMPANY_SIZE_OPTIONS: readonly Option<CompanySize>[] = [
  { value: "solo", label: "Just me" },
  { value: "2-10", label: "2 to 10" },
  { value: "11-50", label: "11 to 50" },
  { value: "51-200", label: "51 to 200" },
  { value: "200-plus", label: "More than 200" },
];

export const URGENCY_OPTIONS: readonly Option<Urgency>[] = [
  { value: "asap", label: "As soon as possible" },
  { value: "month", label: "Within a month" },
  { value: "quarter", label: "This quarter" },
  { value: "exploring", label: "Just exploring" },
];

export const BUDGET_OPTIONS: readonly Option<Budget>[] = [
  { value: "not-sure", label: "Not sure yet" },
  { value: "rough", label: "I have a rough budget" },
  { value: "prefer-not", label: "Prefer not to say" },
];

/** Industry options for the first question, derived from the registry. */
export const INDUSTRY_OPTIONS = INDUSTRIES.map((i) => ({
  value: i.slug,
  label: i.label,
}));

/**
 * The approved headache-to-service mapping. Each headache yields the service or services that
 * solve it; the matcher then ranks them by the chosen industry. The match is pure, so the
 * recommendation can never name a service that does not exist.
 */
export const HEADACHE_SERVICES: Record<HeadacheId, readonly ServiceSlug[]> = {
  "duplicate-data": [
    "business-process-automation",
    "ai-systems-integration",
  ],
  "slow-reports": [
    "data-dashboards-predictive-analytics",
    "data-infrastructure-ai-readiness",
  ],
  "missed-messages": ["ai-chatbots-virtual-assistants"],
  "new-build": ["ai-product-development"],
  "sell-online": ["ai-ecommerce-development"],
  "hard-to-find": ["ai-seo-geo"],
  "track-assets": ["iot-development"],
  "public-sector": ["govtech-platforms"],
  "unreliable-software": ["managed-technology-operations"],
};
