/**
 * Site-wide JSON-LD nodes for the Nexoris Technologies platform.
 *
 * These nodes appear on every page by stable @id (PRD 9.2): Organization,
 * ProfessionalService (the LocalBusiness subtype), WebSite (with the SearchAction), and the
 * founder Person. Locale facts are Nigerian throughout. Fields whose data does not yet exist
 * (for example the geo coordinates) are omitted by prune, never fabricated.
 */
import {
  COUNTRY_CODE,
  CURRENCY,
  FOUNDER,
  LOCALE,
  ORGANISATION,
  SCHEMA_IDS,
  SITE_ORIGIN,
} from "../constants.js";
import type { JsonLdNode } from "./jsonld.js";

const orgId = `${SITE_ORIGIN}/${SCHEMA_IDS.organization}`;
const serviceId = `${SITE_ORIGIN}/${SCHEMA_IDS.professionalService}`;
const websiteId = `${SITE_ORIGIN}/${SCHEMA_IDS.website}`;
const founderId = `${SITE_ORIGIN}/${SCHEMA_IDS.founder}`;

/** Stable @id references other nodes use to point at the site-wide nodes. */
export const SITE_NODE_IDS = {
  organization: orgId,
  professionalService: serviceId,
  website: websiteId,
  founder: founderId,
} as const;

/** The postal address node, shared by the Organization and ProfessionalService. */
function postalAddress(): JsonLdNode {
  return {
    "@type": "PostalAddress",
    streetAddress: ORGANISATION.address.streetAddress,
    addressLocality: ORGANISATION.address.addressLocality,
    addressRegion: ORGANISATION.address.addressRegion,
    addressCountry: COUNTRY_CODE,
  };
}

/** The Organization node (PRD 9.2). */
export function organizationNode(logoUrl?: string): JsonLdNode {
  return {
    "@type": "Organization",
    "@id": orgId,
    name: ORGANISATION.name,
    legalName: ORGANISATION.legalName,
    url: `${SITE_ORIGIN}/`,
    email: ORGANISATION.email,
    telephone: ORGANISATION.telephone,
    address: postalAddress(),
    logo: logoUrl ? { "@type": "ImageObject", url: logoUrl } : undefined,
    founder: { "@id": founderId },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      email: ORGANISATION.businessEmail,
      telephone: ORGANISATION.telephone,
      areaServed: COUNTRY_CODE,
      availableLanguage: "en",
    },
    sameAs: [...ORGANISATION.sameAs],
  };
}

/** The ProfessionalService node, the LocalBusiness subtype (PRD 9.2). */
export function professionalServiceNode(): JsonLdNode {
  return {
    "@type": "ProfessionalService",
    "@id": serviceId,
    name: ORGANISATION.name,
    url: `${SITE_ORIGIN}/`,
    telephone: ORGANISATION.telephone,
    email: ORGANISATION.email,
    address: postalAddress(),
    // geo is omitted until the global single type provides coordinates (PRD 9.2).
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [...ORGANISATION.openingHours.days],
      opens: ORGANISATION.openingHours.opens,
      closes: ORGANISATION.openingHours.closes,
    },
    priceRange: ORGANISATION.priceRange,
    currenciesAccepted: CURRENCY,
    areaServed: "Nigeria",
    parentOrganization: { "@id": orgId },
  };
}

/** The WebSite node with the SearchAction for the sitelinks searchbox (PRD 9.2, 9.9). */
export function websiteNode(): JsonLdNode {
  return {
    "@type": "WebSite",
    "@id": websiteId,
    url: `${SITE_ORIGIN}/`,
    name: ORGANISATION.name,
    inLanguage: LOCALE,
    publisher: { "@id": orgId },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_ORIGIN}/insights/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** The founder Person node (PRD 9.2). */
export function founderNode(): JsonLdNode {
  return {
    "@type": "Person",
    "@id": founderId,
    name: FOUNDER.name,
    worksFor: { "@id": orgId },
    sameAs: [...FOUNDER.sameAs],
  };
}

/** All four site-wide nodes, included on every page. */
export function siteNodes(logoUrl?: string): JsonLdNode[] {
  return [
    organizationNode(logoUrl),
    professionalServiceNode(),
    websiteNode(),
    founderNode(),
  ];
}
