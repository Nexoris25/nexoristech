/**
 * Site-wide SEO constants for the Nexoris Technologies platform.
 *
 * These encode the locale facts and entity details that every schema node and metadata
 * object reuses (Product Requirements Document, Part One, Section 9). Locale facts are
 * Nigerian everywhere: inLanguage en-NG, og:locale en_NG, addressCountry NG,
 * currenciesAccepted NGN.
 */

/** The site origin. No trailing slash on the origin itself. */
export const SITE_ORIGIN = "https://nexoristech.com";

/** The HTML lang and schema inLanguage value used on every page. */
export const LOCALE = "en-NG";

/** The Open Graph locale value (underscore form). */
export const OG_LOCALE = "en_NG";

/** ISO 3166 country code for the business address and areaServed. */
export const COUNTRY_CODE = "NG";

/** ISO 4217 currency code accepted. */
export const CURRENCY = "NGN";

/** Every page title ends with this brand suffix so Google can form the brand association. */
export const BRAND_SUFFIX = "Nexoris Technologies";

/** The separator placed between a page title and the brand suffix. */
export const TITLE_SEPARATOR = " | ";

/** Meta copy limits enforced in the CMS and by the check:seo gate (PRD 1.3). */
export const META_LIMITS = {
  /** Meta title maximum length in characters. */
  titleMax: 60,
  /** Meta description target minimum length in characters. */
  descriptionMin: 155,
  /** Meta description hard maximum length in characters. */
  descriptionMax: 160,
} as const;

/** Open Graph card dimensions. The card is the one PNG that reaches a visitor (PRD 9.3). */
export const OG_IMAGE = {
  width: 1200,
  height: 630,
} as const;

/**
 * The Nexoris Technologies organisation facts used by the Organization and
 * ProfessionalService schema nodes (PRD 9.2). Values that do not yet exist (such as the geo
 * coordinates from the global single type) are intentionally absent so builders omit them
 * rather than fabricate.
 */
export const ORGANISATION = {
  legalName: "Nexoris Technologies Ltd",
  name: "Nexoris Technologies",
  email: "hello@nexoristech.com",
  businessEmail: "business@nexoristech.com",
  careersEmail: "careers@nexoristech.com",
  telephone: "+2349138133224",
  /**
   * The registered office. `formatted` is the one line every surface should print, so the website,
   * invoices, proposals and the MSA cannot drift from each other the way they had: the same office
   * was appearing as "Badore, Ajah, Lagos State" in six places and something else in the PRD.
   */
  address: {
    formatted: "No. 5, Mojisola Dokpesi Street, Ajah, Lekki Lagos",
    streetAddress: "No. 5, Mojisola Dokpesi Street",
    addressLocality: "Ajah, Lekki",
    addressRegion: "Lagos",
    addressCountry: COUNTRY_CODE,
  },
  /** Monday to Friday 09:00 to 18:00 (PRD 9.2). */
  openingHours: {
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: "09:00",
    closes: "18:00",
  },
  priceRange: "$$",
  /** Verified public profiles, used for the Organization sameAs (PRD 9.2). */
  sameAs: [
    "https://www.linkedin.com/company/nexoris-technologies",
    "https://x.com/Nexoristech",
    "https://www.instagram.com/nexoristechnologies/",
    "https://web.facebook.com/people/Nexoris-Technologies/61575547172687/",
    "https://www.tiktok.com/@nexoristechnologies",
    "https://www.threads.com/@nexoristechnologies",
  ],
} as const;

/**
 * The X account, as the @handle the card tags require.
 *
 * Card validators report the whole X card as "incomplete" when twitter:site is absent, even with a
 * valid twitter:card, which is what made the card look broken while summary_large_image was in fact
 * being emitted on every page. Derived from the profile in sameAs above so the two cannot drift.
 */
export const X_HANDLE = `@${
  ORGANISATION.sameAs.find((u) => u.startsWith("https://x.com/"))?.split("/").pop() ?? ""
}` as const;

/** The founder, used for the Organization founder reference and the Person node (PRD 9.2). */
export const FOUNDER = {
  name: "Chinedu Nwogu",
  sameAs: ["https://www.linkedin.com/in/chinedu-nwogu/"],
} as const;

/** Stable schema @id fragments, resolved against the site origin. */
export const SCHEMA_IDS = {
  organization: "#organization",
  professionalService: "#professional-service",
  website: "#website",
  founder: "#founder",
} as const;
