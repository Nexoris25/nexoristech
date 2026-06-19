/**
 * The lead contract (PRD 11): what every lead carries from the website to the CRM, regardless of
 * which of the three paths created it (the Contact form, Oge chat capture, or the Solution Finder).
 * Scoring and storage build on this shape.
 */
import type { FinderAnswers, PageRef } from "@nexoris/recommend";

export type LeadSource =
  | "contact-form"
  | "oge-chat"
  | "solution-finder"
  | "whatsapp"
  | "email"
  | "referral";

export type Band = "Hot" | "Warm" | "Cold";

/** The Solution Finder context attached to a lead, when it came through the finder. */
export interface LeadFinderContext extends Partial<FinderAnswers> {
  /** The pages the finder recommended, for service tagging and the salesperson's context. */
  recommendation?: PageRef[];
}

export interface LeadInput {
  readonly source: LeadSource;
  /** The originating page path, including which programmatic or cost page, so revenue is traceable. */
  readonly page?: string;
  readonly utm?: Record<string, string>;
  readonly name?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly company?: string;
  /** The full message or the chat transcript. */
  readonly message?: string;
  readonly finder?: LeadFinderContext;
}

export interface LeadScore {
  readonly score: number;
  readonly band: Band;
  readonly justification: string;
  /** Whether the score came from the model or the immediate rules-based baseline. */
  readonly scoredBy: "ai" | "rules";
}

/** Map a 1 to 100 score to its band. A low score never auto-rejects; it only orders the queue. */
export function bandForScore(score: number): Band {
  if (score >= 70) return "Hot";
  if (score >= 45) return "Warm";
  return "Cold";
}
