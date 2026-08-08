/**
 * Programmatic SEO constants with no server dependencies.
 *
 * These live apart from pseo-generator.ts on purpose. That module imports the Search Console client,
 * which imports the Google auth chain, so a client component pulling one constant from it would drag
 * all of that into the browser bundle. The values are shared between the generator (server) and the
 * page editor (client), so they belong somewhere neither side has to pay for.
 */

/**
 * Nigerian hubs from PRD 9.6, Variable C. "Nigeria" is the national default so the matrix always has a
 * non-local baseline; the city pages must each carry genuinely local data to pass the 9.7 gate.
 */
export const PSEO_LOCATIONS = [
  "Nigeria", "Lagos", "Abuja", "Port Harcourt", "Ibadan", "Enugu", "Kano",
] as const;
export type PseoLocation = (typeof PSEO_LOCATIONS)[number];

/** Minimum Search Console impressions before a combination is worth proposing at all. */
export const MIN_SEARCH_VOLUME = 25;
