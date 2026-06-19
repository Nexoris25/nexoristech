/**
 * The deterministic Solution Finder matcher (PRD 10.5). Given the five answers, it returns one to
 * three services and the industry page, with no model call: the headache selects the candidate
 * services, the industry ranks them (a service that covers the chosen industry comes first) and
 * selects the industry page. Company size, urgency, and budget are lead context and do not change
 * the match. The result references only real pages, so the AI rationale (written separately) can
 * never invent one.
 */
import {
  industryLabel,
  pageHref,
  serviceLabel,
  type IndustrySlug,
  type ServiceSlug,
} from "./registry.js";
import { serviceCoversIndustry } from "./matrix.js";
import {
  HEADACHE_SERVICES,
  type Budget,
  type CompanySize,
  type HeadacheId,
  type Urgency,
} from "./questions.js";

export interface FinderAnswers {
  readonly industry: IndustrySlug;
  readonly headache: HeadacheId;
  readonly companySize?: CompanySize;
  readonly urgency?: Urgency;
  readonly budget?: Budget;
}

export interface PageRef {
  readonly slug: string;
  readonly label: string;
  readonly href: string;
}

export interface Recommendation {
  readonly services: PageRef[];
  readonly industry: PageRef;
}

const MAX_SERVICES = 3;

function serviceRef(slug: ServiceSlug): PageRef {
  return { slug, label: serviceLabel(slug), href: pageHref(slug) };
}

function industryRef(slug: IndustrySlug): PageRef {
  return { slug, label: industryLabel(slug), href: pageHref(slug) };
}

/** Map the five answers to a concrete, real-page recommendation. */
export function matchRecommendation(answers: FinderAnswers): Recommendation {
  const candidates = HEADACHE_SERVICES[answers.headache] ?? [];

  // Stable sort: services that cover the chosen industry first, original order otherwise.
  const ranked = candidates
    .map((slug, index) => ({ slug, index }))
    .sort((a, b) => {
      const coversA = serviceCoversIndustry(a.slug, answers.industry) ? 1 : 0;
      const coversB = serviceCoversIndustry(b.slug, answers.industry) ? 1 : 0;
      return coversB - coversA || a.index - b.index;
    })
    .slice(0, MAX_SERVICES)
    .map((c) => serviceRef(c.slug));

  return { services: ranked, industry: industryRef(answers.industry) };
}
