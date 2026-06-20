/**
 * The non-negotiable programmatic quality gate and data-readiness gate (PRD 9.7). The permutation
 * layer is unpublished by default; a page becomes eligible only when its readiness record is
 * complete. This is the pure decision used both by the Strapi publish guard and the render route,
 * so a thin, templated, or duplicative page can never go live.
 */
export type PageIntent = "capability" | "cost" | "comparison";

export interface ReadinessRecord {
  /** A named author with a real profile (EEAT). Required. */
  authorSlug?: string;
  /** A fact-checker, required where the page makes claims or cites statistics. */
  factCheckerSlug?: string;
  /** Distinct data sources cited on the page. */
  dataSources: string[];
  /** Proprietary Nexoris Technologies insight (project data, anonymised outcomes, observations). */
  hasProprietaryInsight: boolean;
  /** Honest per-page feature matrix rows. */
  featureMatrixRows: number;
  /** The searcher intent the page must satisfy in depth. */
  intent: PageIntent;
  /** A real pricing table is present (required when intent is cost). */
  hasPricingTable: boolean;
  /** A real comparison matrix is present (required when intent is comparison). */
  hasComparisonMatrix: boolean;
  /** Whether the page is tied to a place (location pages need distinct local data). */
  isLocationPage: boolean;
  /** Local data points specific to this place. */
  localDataPoints: string[];
  /** Words of content unique to this page (the more-than-half-unique rule, proxied by a floor). */
  uniqueWordCount: number;
}

/** Minimum unique words for a page to deserve its own slot rather than its parent answering it. */
export const MIN_UNIQUE_WORDS = 300;
/** Minimum distinct data sources unless proprietary insight is combined with public data. */
export const MIN_DATA_SOURCES = 3;
/** Minimum honest feature-matrix rows. */
export const MIN_MATRIX_ROWS = 3;

export interface GateResult {
  publishable: boolean;
  /** Every unmet rule, so an editor knows exactly what the page still needs. */
  reasons: string[];
}

/** Evaluate whether a programmatic page may publish. Returns the unmet rules when it may not. */
export function evaluatePublishable(record: ReadinessRecord): GateResult {
  const reasons: string[] = [];

  if (!record.authorSlug) {
    reasons.push("A named author with a real profile is required.");
  }
  if (record.factCheckerSlug === undefined && record.intent !== "capability") {
    reasons.push("A fact-checker is required for a page that makes claims.");
  }

  const enoughSources =
    record.dataSources.length >= MIN_DATA_SOURCES ||
    (record.hasProprietaryInsight && record.dataSources.length >= 1);
  if (!enoughSources) {
    reasons.push(
      "At least three distinct data sources, or proprietary insight combined with public data, are required.",
    );
  }

  if (record.featureMatrixRows < MIN_MATRIX_ROWS) {
    reasons.push("The feature matrix needs honest per-page values.");
  }

  if (record.intent === "cost" && !record.hasPricingTable) {
    reasons.push("A cost page needs a real pricing table.");
  }
  if (record.intent === "comparison" && !record.hasComparisonMatrix) {
    reasons.push("A comparison page needs a real comparison matrix.");
  }

  if (record.isLocationPage && record.localDataPoints.length === 0) {
    reasons.push(
      "A location page needs data points specific to that place, not a template with the city swapped.",
    );
  }

  if (record.uniqueWordCount < MIN_UNIQUE_WORDS) {
    reasons.push(
      "More than half the page must be unique substance; it is too thin to deserve its own page.",
    );
  }

  return { publishable: reasons.length === 0, reasons };
}
