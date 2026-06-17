/**
 * Service and FAQPage JSON-LD nodes for the Nexoris Technologies platform (PRD 9.2).
 *
 * Service pages emit a Service node with the Organization as provider, areaServed Nigeria,
 * and the contact page as the available channel. Industry pages set serviceType to
 * "{industry} software development" and add an audience. Programmatic pages set serviceType
 * to the specific combination. FAQPage is emitted only when an FAQ section exists, never
 * empty.
 */
import { absoluteUrl } from "../url.js";
import { SITE_NODE_IDS } from "./site.js";
import type { JsonLdNode } from "./jsonld.js";

/** A single FAQ question and its self-contained answer. */
export interface FaqItem {
  question: string;
  answer: string;
}

/** Input to the Service node builder. */
export interface ServiceInput {
  /** The service or page name. */
  name: string;
  /** The page path the service is described on. */
  path: string;
  /** The schema serviceType, for example "fintech software development". */
  serviceType?: string;
  /** The audience name for industry pages, for example "Fintech businesses". */
  audience?: string;
}

/** The Service node (PRD 9.2). */
export function serviceNode(input: ServiceInput): JsonLdNode {
  return {
    "@type": "Service",
    name: input.name,
    serviceType: input.serviceType,
    provider: { "@id": SITE_NODE_IDS.organization },
    areaServed: "Nigeria",
    audience: input.audience
      ? { "@type": "Audience", audienceType: input.audience }
      : undefined,
    // The contact page is the channel to engage the service (PRD 9.2).
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: absoluteUrl("/contact"),
    },
    url: absoluteUrl(input.path),
  };
}

/**
 * The FAQPage node. Returns undefined when there are no FAQ items, so the gate's rule that
 * FAQPage is present only where an FAQ section exists holds (PRD 9.11).
 */
export function faqPageNode(items: FaqItem[]): JsonLdNode | undefined {
  if (items.length === 0) {
    return undefined;
  }
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
