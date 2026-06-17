/**
 * Branded Open Graph card model for the Nexoris Technologies platform (PRD 9.3, 16).
 *
 * The card is the one PNG that reaches a visitor (the documented WebP exception), generated
 * server-side at 1200x630. This module defines the framework-agnostic content model and the
 * brand spec for the card, derived from the design tokens. The actual PNG rendering is wired
 * in apps/web's opengraph-image route once the brand fonts and logo are in place (Stage 2),
 * since the rendered card depends on those assets. Keeping the model here lets every surface
 * and any future property reuse one consistent card.
 */
import { OG_IMAGE, ORGANISATION } from "./constants.js";

/** The brand colours the card uses, matching the design tokens (PRD 14.5, 14.6). */
export const OG_CARD_SPEC = {
  width: OG_IMAGE.width,
  height: OG_IMAGE.height,
  // Dark hero background with a soft purple glow, per the colour usage principles.
  background: "#0D0A1C",
  glow: { from: "#6A55F2", to: "#543CDA" },
  titleColor: "#FFFFFF",
  eyebrowColor: "#DCD6F9",
  brandColor: "#FFFFFF",
  padding: 96,
} as const;

/** The content model for one card. */
export interface OgCardModel {
  /** A short category or section eyebrow, for example "Insights" or "Service". */
  eyebrow?: string;
  /** The card headline, normally the page H1 or title. */
  title: string;
  /** The brand line shown on the card. Always the full company name. */
  brand: string;
}

/** Build the content model for a card from a title and optional eyebrow. */
export function ogCardModel(input: {
  title: string;
  eyebrow?: string;
}): OgCardModel {
  return {
    ...(input.eyebrow ? { eyebrow: input.eyebrow } : {}),
    title: input.title,
    brand: ORGANISATION.name,
  };
}
