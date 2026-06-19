/**
 * The cross-linking matrix (PRD 8), verbatim: each service maps to its highest-relevance
 * industries (rotated by traffic at render). Used to render service-to-industry links, to rank the
 * Solution Finder's matched services by the chosen industry, and to tag leads. Managed Technology
 * Operations is referenced from every service page footer rather than tied to specific industries,
 * so its list is empty here and it is treated as universal.
 */
import type { IndustrySlug, ServiceSlug } from "./registry.js";

export const SERVICE_INDUSTRIES: Record<ServiceSlug, readonly IndustrySlug[]> = {
  "ai-product-development": [
    "fintech-software",
    "healthcare-software",
    "education-software",
    "retail-ecommerce-software",
    "logistics-software",
  ],
  "ai-chatbots-virtual-assistants": [
    "healthcare-software",
    "fintech-software",
    "government-digital-solutions",
    "hospitality-software",
    "retail-ecommerce-software",
    "church-management-software",
  ],
  "business-process-automation": [
    "professional-services-software",
    "fintech-software",
    "insurance-software",
    "manufacturing-software",
    "ngo-software",
  ],
  "ai-ecommerce-development": [
    "retail-ecommerce-software",
    "restaurant-software",
    "automotive-software",
    "media-entertainment-software",
    "fitness-wellness-software",
  ],
  "data-dashboards-predictive-analytics": [
    "manufacturing-software",
    "logistics-software",
    "retail-ecommerce-software",
    "ngo-software",
    "construction-software",
  ],
  "ai-systems-integration": [
    "retail-ecommerce-software",
    "manufacturing-software",
    "fintech-software",
    "logistics-software",
    "professional-services-software",
  ],
  "data-infrastructure-ai-readiness": [
    "fintech-software",
    "insurance-software",
    "government-digital-solutions",
    "manufacturing-software",
    "healthcare-software",
  ],
  "iot-development": [
    "logistics-software",
    "manufacturing-software",
    "agritech-software",
    "construction-software",
    "healthcare-software",
  ],
  "govtech-platforms": [
    "government-digital-solutions",
    "ngo-software",
    "education-software",
    "healthcare-software",
  ],
  "ai-seo-geo": [
    "real-estate-software",
    "hospitality-software",
    "professional-services-software",
    "media-entertainment-software",
    "events-software",
  ],
  "managed-technology-operations": [],
};

/** The reverse view: the services most relevant to a given industry, in matrix order. */
export function servicesForIndustry(
  industry: IndustrySlug,
): readonly ServiceSlug[] {
  return (Object.keys(SERVICE_INDUSTRIES) as ServiceSlug[]).filter((service) =>
    SERVICE_INDUSTRIES[service].includes(industry),
  );
}

/** Whether a service lists an industry among its highest-relevance industries. */
export function serviceCoversIndustry(
  service: ServiceSlug,
  industry: IndustrySlug,
): boolean {
  return SERVICE_INDUSTRIES[service].includes(industry);
}
