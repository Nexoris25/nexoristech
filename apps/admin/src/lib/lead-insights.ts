/**
 * Lead insights for the detail page (PRD 5.8, 5.9). Turns a lead's stored, real data (its Oge
 * arrival score and justification, its own message, its source, and the deterministic service
 * match) into the AI Insights panel: a plain-language summary, the reasons behind the score, the
 * tone signals detected in the lead's words, and the recommended next step. Everything here is
 * grounded in what the lead actually shared, so nothing is invented. When Oge has scored a lead it
 * supplies the summary directly through its justification; the reasons and signals are read from
 * the lead's own message so they are always defensible.
 */
import { recommendationForLead } from "./lead-recommendation.js";

export interface LeadSignal {
  label: string;
  tone: "urgent" | "growth" | "goal" | "budget" | "detail";
}

export interface NextStep {
  headline: string;
  detail: string;
}

export interface LeadInsights {
  summary: string;
  reasons: string[];
  signals: LeadSignal[];
  nextStep: NextStep;
  services: { label: string; href: string }[];
  industry: string | null;
}

export interface InsightLead {
  name: string | null;
  company: string | null;
  message: string | null;
  source: string;
  score: number | null;
  band: string | null;
  justification: string | null;
  finder: Record<string, unknown> | null;
}

const HIGH_INTENT_SOURCES = new Set(["referral", "contact-form", "solution-finder"]);

function has(text: string, words: string[]): boolean {
  return words.some((w) => text.includes(w));
}

/** Detect tone signals from the lead's own words. Order matters: the strongest first. */
function detectSignals(message: string): LeadSignal[] {
  const t = message.toLowerCase();
  const signals: LeadSignal[] = [];
  if (
    has(t, [
      "this week",
      "asap",
      "urgent",
      "immediately",
      "quickly",
      "right away",
      "deadline",
      "today",
      "as soon as",
      "budget approved",
    ])
  ) {
    signals.push({ label: "Urgent", tone: "urgent" });
  }
  if (has(t, ["grow", "scale", "expand", "nationwide", "more customers", "increase", "revenue"])) {
    signals.push({ label: "Growth focused", tone: "growth" });
  }
  if (has(t, ["want to", "need to", "we need", "looking to", "goal", "improve", "better", "so we can"])) {
    signals.push({ label: "Goal oriented", tone: "goal" });
  }
  if (has(t, ["budget", "approved", "invest", "spend", "afford", "cost"])) {
    signals.push({ label: "Budget aware", tone: "budget" });
  }
  if (message.trim().length > 160) {
    signals.push({ label: "Detail rich", tone: "detail" });
  }
  return signals;
}

/** Derive the reasons behind the score from what is actually present on the lead. */
function deriveReasons(lead: InsightLead, hasRecommendation: boolean): string[] {
  const message = (lead.message ?? "").trim();
  const t = message.toLowerCase();
  const reasons: string[] = [];

  if (message.length > 50) reasons.push("Clear business challenge described");
  if (
    has(t, [
      "struggl",
      "delay",
      "manual",
      "slow",
      "losing",
      "loss",
      "cannot",
      "can't",
      "missed",
      "drowning",
      "paper",
      "spreadsheet",
      "guess",
      "no visibility",
      "bottleneck",
      "off route",
      "backlog",
    ])
  ) {
    reasons.push("Specific pain point named");
  }
  if (has(t, ["we ", "our ", "my team", "approved", "we want", "we need", "we run"])) {
    reasons.push("Decision-making authority implied");
  }
  if (hasRecommendation) reasons.push("Strong fit for a named Nexoris Technologies service");
  if (lead.company) reasons.push("Named company and contact");
  if (HIGH_INTENT_SOURCES.has(lead.source)) {
    reasons.push(
      lead.source === "referral"
        ? "Came from a referral, the highest-converting source"
        : "Came from a high-intent source",
    );
  }
  if ((lead.band ?? "") === "Hot") reasons.push("High likelihood of engagement");

  if (reasons.length === 0) {
    reasons.push("Limited detail shared so far");
    reasons.push("Worth a helpful reply to learn more");
  }
  return reasons.slice(0, 6);
}

/** The next step, keyed to the score band, in the house voice. */
function deriveNextStep(band: string | null, name: string | null): NextStep {
  const who = name ? name.split(/\s+/)[0] : "this prospect";
  if (band === "Hot") {
    return {
      headline: "Book a discovery call within 48 hours.",
      detail: `${who} has named a clear problem and a strong fit. Move fast: send the follow-up, offer two call times, and come to the call ready to scope. Early engagement wins hot leads.`,
    };
  }
  if (band === "Warm") {
    return {
      headline: "Reply today and qualify the priority.",
      detail: `There is real interest but the timeline or budget is not clear yet. Send the follow-up, ask one or two qualifying questions, and offer a short call so you can size the work honestly.`,
    };
  }
  return {
    headline: "Send a helpful reply and set a nurture date.",
    detail: `The interest is early. Answer plainly, point to the most relevant work, and set a revival date so ${who} resurfaces automatically rather than going cold.`,
  };
}

/** A grounded plain-language summary. Uses Oge's justification when present. */
function deriveSummary(lead: InsightLead, hasRecommendation: boolean): string {
  if (lead.justification && lead.justification.trim().length > 0) {
    return lead.justification.trim();
  }
  const parts: string[] = [];
  if (lead.company) parts.push(`${lead.company} reached out`);
  else parts.push("A new prospect reached out");
  if (hasRecommendation) parts.push("with a challenge that matches a Nexoris Technologies service");
  const opener = `${parts.join(" ")}.`;
  const detail = (lead.message ?? "").trim();
  return detail.length > 0
    ? `${opener} In their words: ${detail}`
    : `${opener} No message was shared, so a first reply should invite them to tell us more.`;
}

export function deriveInsights(lead: InsightLead): LeadInsights {
  const recommendation = recommendationForLead(lead.finder);
  const hasRecommendation = recommendation !== null;
  const message = (lead.message ?? "").trim();

  return {
    summary: deriveSummary(lead, hasRecommendation),
    reasons: deriveReasons(lead, hasRecommendation),
    signals: message.length > 0 ? detectSignals(message) : [],
    nextStep: deriveNextStep(lead.band, lead.name),
    services: recommendation ? recommendation.services.map((s) => ({ label: s.label, href: s.href })) : [],
    industry: recommendation ? recommendation.industry.label : null,
  };
}
