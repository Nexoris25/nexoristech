/**
 * Content module types for the Nexoris Technologies marketing site.
 *
 * The 33 hardcoded marketing pages are version-controlled content modules generated once
 * from the approved Website Copy (PRD 6.1). On-screen text matches the copy files verbatim;
 * the content-fidelity test byte-diffs the H1s, sublines, CTAs, and metas against
 * content-source. Items in [square brackets] in the copy are dynamic placeholders sourced
 * from the CMS, modelled here as `dynamic` blocks, never rendered as literal text.
 */
import type { RouteClass } from "@nexoris/seo";

/** A call to action: its label and the path it links to. */
export interface Cta {
  label: string;
  href: string;
}

/** Page metadata, matching the approved meta title and description verbatim. */
export interface PageMeta {
  slug: string;
  routeClass: RouteClass;
  title: string;
  description: string;
}

/** The hero section common to marketing pages. */
export interface Hero {
  h1: string;
  subline?: string;
  primaryCta?: Cta;
  secondaryCta?: Cta;
  trustStrip?: string;
}

/** A card with an optional title, body, and outbound or related links. */
export interface ContentCard {
  title?: string;
  body: string;
  links?: Cta[];
}

/** A numbered process step. */
export interface Step {
  title: string;
  body: string;
}

/** A frequently asked question with its self-contained answer. */
export interface Faq {
  question: string;
  answer: string;
}

/**
 * A section of a page. The discriminated `kind` keeps the model expressive without forcing
 * every page into one shape. `dynamic` marks a block whose content comes from the CMS at
 * render time (the [square bracket] notes in the copy), so it is never rendered as literal text.
 */
export type Section =
  | {
      kind: "rich";
      id: string;
      heading?: string;
      intro?: string;
      body?: string[];
      link?: Cta;
    }
  | {
      kind: "cards";
      id: string;
      heading?: string;
      intro?: string;
      cards: ContentCard[];
      closingLine?: string;
      footerLink?: Cta;
    }
  | {
      kind: "steps";
      id: string;
      heading?: string;
      intro?: string;
      steps: Step[];
      link?: Cta;
    }
  | { kind: "faq"; id: string; heading: string; items: Faq[] }
  | {
      kind: "cta-band";
      id: string;
      heading: string;
      body?: string;
      button: Cta;
    }
  | {
      kind: "dynamic";
      id: string;
      heading?: string;
      intro?: string;
      note: string;
      link?: Cta;
    };

/** A complete hardcoded marketing page. */
export interface MarketingPage {
  meta: PageMeta;
  hero: Hero;
  sections: Section[];
}
