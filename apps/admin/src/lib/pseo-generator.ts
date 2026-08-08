/**
 * The programmatic SEO proposal generator (PRD 9.4, 9.6).
 *
 * The PRD's framework is [Industry] + [Service or Tech] + [Location or Constraint], and the first gate
 * before anything publishes is real search demand, not a guess. So this walks the real catalogue rather
 * than inventing keywords, keeps only combinations that genuinely fit, and scores each one against live
 * Search Console queries: phrasings people already use to reach the site. A combination with no evidence
 * of demand is still proposed, but at the bottom, so the team works the real opportunities first.
 *
 * It proposes; it never publishes. Approving a proposal creates a draft page, which must then clear the
 * non-negotiable quality gate in pseo-gate.ts.
 */
import { SERVICES, INDUSTRIES, SERVICE_INDUSTRIES, type ServiceSlug, type IndustrySlug } from "@nexoris/recommend";
import { fetchGscByDimension, type GscRow } from "./google/gsc.js";
import { PSEO_LOCATIONS, MIN_SEARCH_VOLUME, type PseoLocation } from "./pseo-constants.js";

// Declared in pseo-constants.ts so the page editor can read them without pulling the Search Console
// client, and its Google auth chain, into the browser bundle. Re-exported so existing importers of this
// module keep working.
export { PSEO_LOCATIONS, MIN_SEARCH_VOLUME, type PseoLocation } from "./pseo-constants.js";

export interface ProposalCandidate {
  keyword: string;
  service: ServiceSlug;
  serviceLabel: string;
  industry: IndustrySlug;
  industryLabel: string;
  location: PseoLocation;
  /** Live Search Console impressions for the queries that matched this combination. */
  impressions: number;
  clicks: number;
  /** Best (lowest) average position we already hold for a matching query, if any. */
  position: number | null;
  /** 0-100. Real demand dominates; a national page gets a small edge as the parent of its city pages. */
  priority: number;
  /** Why this was proposed, in plain words, for the editor reviewing the queue. */
  rationale: string;
}

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
/** Meaningful words from a label, so "AI Chatbots and Virtual Assistants" matches a query about chatbots. */
function terms(label: string): string[] {
  const STOP = new Set(["and", "the", "for", "with", "of", "in", "to"]);
  return norm(label).split(" ").filter((w) => w.length > 3 && !STOP.has(w));
}

/** The buyer-facing phrase for a combination, following the PRD's flat slug pattern. */
export function candidateKeyword(serviceLabel: string, industryLabel: string, location: PseoLocation): string {
  const where = location === "Nigeria" ? "in Nigeria" : `in ${location}`;
  return `${serviceLabel} for ${industryLabel} ${where}`;
}

/** Search Console rows whose query mentions this service and this industry. */
function matchingRows(rows: GscRow[], serviceLabel: string, industryLabel: string, location: PseoLocation): GscRow[] {
  const sTerms = terms(serviceLabel);
  const iTerms = terms(industryLabel);
  const loc = location === "Nigeria" ? "nigeria" : norm(location);
  return rows.filter((r) => {
    const q = norm(r.key);
    const hitsService = sTerms.some((t) => q.includes(t));
    const hitsIndustry = iTerms.some((t) => q.includes(t));
    // A query counts when it names the service and either the industry or the place.
    return hitsService && (hitsIndustry || q.includes(loc));
  });
}

/**
 * Build the ranked candidate list. `days` is the Search Console window used for demand.
 * Only combinations that pass the catalogue fit gate (PRD 9.4) are returned.
 */
export async function generateProposals(days = 90, limit = 200): Promise<ProposalCandidate[]> {
  // Live demand. If Google is not connected this is empty, and everything ranks on fit alone.
  const gscRows = (await fetchGscByDimension("query", days, 1000)) ?? [];

  const candidates: ProposalCandidate[] = [];
  for (const service of SERVICES) {
    const fits = SERVICE_INDUSTRIES[service.slug as ServiceSlug] ?? [];
    for (const industrySlug of fits) {
      const industry = INDUSTRIES.find((i) => i.slug === industrySlug);
      if (!industry) continue; // catalogue fit gate: only real, mapped pairs
      for (const location of PSEO_LOCATIONS) {
        const rows = matchingRows(gscRows, service.label, industry.label, location);
        const impressions = rows.reduce((s, r) => s + r.impressions, 0);
        const clicks = rows.reduce((s, r) => s + r.clicks, 0);
        const position = rows.length ? Math.min(...rows.map((r) => r.position)) : null;

        // Demand carries the ranking. The national page gets a small edge because its city pages
        // should link up to it, so it is the sensible first page in any cluster.
        const demandScore = Math.min(80, Math.round(Math.log10(impressions + 1) * 26));
        const nationalEdge = location === "Nigeria" ? 8 : 0;
        const alreadyRanking = position != null && position <= 20 ? 6 : 0;
        const priority = Math.min(100, demandScore + nationalEdge + alreadyRanking);

        // A page needs demand to justify existing. Below this the combination is a guess, and guesses
        // are what produce the thin pages the §9.7 gate exists to hold back. Filtered here rather than
        // at review time so a proposal is never raised that should not be acted on.
        if (impressions < MIN_SEARCH_VOLUME) continue;

        const rationale = impressions > 0
          ? `${impressions.toLocaleString("en-NG")} impressions already for related searches${position != null ? `, best position ${position.toFixed(1)}` : ""}. ${service.label} is a mapped fit for ${industry.label}.`
          : `${service.label} is a mapped fit for ${industry.label}.`;

        candidates.push({
          keyword: candidateKeyword(service.label, industry.label, location),
          service: service.slug as ServiceSlug,
          serviceLabel: service.label,
          industry: industry.slug as IndustrySlug,
          industryLabel: industry.label,
          location,
          impressions, clicks, position, priority, rationale,
        });
      }
    }
  }

  candidates.sort((a, b) => b.priority - a.priority || b.impressions - a.impressions || a.keyword.localeCompare(b.keyword));
  return candidates.slice(0, limit);
}
