/**
 * Derive the deterministic service recommendation for a lead from its Solution Finder answers
 * (PRD 3.3), using the same mapping the website finder uses. Returns null when the lead did not
 * come through the finder or its answers are incomplete, so nothing is fabricated.
 */
import {
  matchRecommendation,
  isIndustrySlug,
  HEADACHE_OPTIONS,
  type Recommendation,
  type IndustrySlug,
  type HeadacheId,
} from "@nexoris/recommend";

const headacheIds = new Set<string>(HEADACHE_OPTIONS.map((o) => o.value));

export function recommendationForLead(
  finder: Record<string, unknown> | null,
): Recommendation | null {
  if (!finder) return null;
  const industry = finder.industry;
  const headache = finder.headache;
  if (typeof industry !== "string" || !isIndustrySlug(industry)) return null;
  if (typeof headache !== "string" || !headacheIds.has(headache)) return null;
  return matchRecommendation({
    industry: industry as IndustrySlug,
    headache: headache as HeadacheId,
  });
}
