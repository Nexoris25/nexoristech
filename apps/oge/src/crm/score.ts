/**
 * The deterministic rules-based lead score (PRD 11, 3.1). It runs instantly so a lead is never
 * unscored, and it is the fallback when generative scoring cannot run. It scores the four signals
 * the justification must name: fit against the ideal customer profile, intent, completeness, and
 * the source and page. The weights are a transparent, tunable baseline (DECISIONS D-015), not a
 * fabricated rubric: each maps to a factor the PRD names. The result is clamped to 1 to 100.
 */
import { isIndustrySlug } from "@nexoris/recommend";
import { bandForScore, type LeadInput, type LeadScore } from "./lead.js";

const ROLE_WORDS =
  /\b(founder|ceo|cto|coo|director|owner|head of|manager|executive|principal|partner)\b/i;

/** Compute the immediate rules-based score and a plain-language justification. */
export function rulesBaselineScore(lead: LeadInput): LeadScore {
  const reasons: string[] = [];
  let score = 0;

  // Completeness (up to 35): the more context shared, the more actionable the lead.
  const hasContact = Boolean(lead.email) || Boolean(lead.phone);
  if (hasContact) {
    score += 15;
  }
  if (lead.company) score += 5;
  const messageLength = lead.message?.trim().length ?? 0;
  if (messageLength >= 80) {
    score += 10;
    reasons.push("a detailed brief");
  } else if (messageLength > 0) {
    score += 5;
  }
  if (lead.finder && Object.keys(lead.finder).length > 0) score += 5;
  if (hasContact && lead.company) reasons.push("complete contact details");

  // Intent (up to 40): urgency, a budget signal, and the path used.
  const urgency = lead.finder?.urgency;
  if (urgency === "asap") {
    score += 20;
    reasons.push("wants to start as soon as possible");
  } else if (urgency === "month") {
    score += 14;
    reasons.push("wants to start within a month");
  } else if (urgency === "quarter") {
    score += 8;
  } else if (urgency === "exploring") {
    score += 3;
  }
  if (lead.finder?.budget === "rough") {
    score += 8;
    reasons.push("has a budget in mind");
  }
  if (lead.source === "solution-finder") score += 7;
  else if (lead.source === "contact-form" || lead.source === "oge-chat")
    score += 5;
  const onDeepPage =
    typeof lead.page === "string" &&
    lead.page !== "/" &&
    lead.page !== "/contact" &&
    lead.page !== "/contact/";
  if (onDeepPage) score += 5;

  // Ideal customer profile fit (up to 25): a known industry, a company, and a senior role.
  const industry = lead.finder?.industry;
  if (typeof industry === "string" && isIndustrySlug(industry)) {
    score += 15;
    reasons.push("a strong fit for an industry we serve");
  }
  if (lead.company) score += 5;
  if (lead.message && ROLE_WORDS.test(lead.message)) {
    score += 5;
    reasons.push("a senior decision maker");
  }

  const clamped = Math.max(1, Math.min(100, score));
  const band = bandForScore(clamped);
  const detail =
    reasons.length > 0
      ? ` Signals: ${reasons.join(", ")}.`
      : " Limited signals so far, but still a person who reached out.";

  return {
    score: clamped,
    band,
    justification: `${band} lead, scored ${clamped} out of 100.${detail}`,
    scoredBy: "rules",
  };
}
