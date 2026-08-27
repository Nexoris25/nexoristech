/**
 * The programmatic SEO quality gate (PRD §9.7, non-negotiable).
 *
 * Programmatic pages at scale are exactly what Google's spam and helpful-content systems penalise when
 * they are thin, templated or duplicative, so a page that fails any rule here must not reach the index.
 * The PRD is explicit that the system holds pages back rather than relying on anyone to be careful: a
 * page that fails is forced to noindex, which also removes it from the sitemap and llms.txt.
 *
 * This is deliberately mechanical. It cannot judge whether copy is genuinely insightful, so it enforces
 * the checkable floor and leaves editorial judgement to the reviewer.
 */

import { computeReadiness } from "./pseo-readiness.js";

/**
 * Minimum body length for a page to count as substantive rather than thin.
 *
 * This was 1500 characters, which is roughly 250 words: half of what a programmatic page needs and a
 * unit nobody writing the page can see. The editor's counter shows words, the requirement is stated in
 * words, so the gate measures words.
 */
export const MIN_BODY_WORDS = 500;
/** Minimum data-readiness score before a page may publish (PRD §9.7 data-readiness gate). */
export const MIN_READINESS = 100;

// Imported below the constants because pseo-readiness imports MIN_BODY_WORDS from here.

export interface GateInput {
  body: string | null | undefined;
  /** A named author is required for EEAT on every programmatic page. */
  authorId: string | null | undefined;
  metaDescription: string | null | undefined;
  /** The place a location page is for, so local specificity can be judged. */
  targetLocation?: string | null | undefined;
}

export interface GateResult {
  /** True when the page may be published and indexed. */
  passes: boolean;
  /** Plain-language reasons it cannot, for the editor to act on. */
  failures: string[];
  /** The measured readiness, so the caller can store it without recomputing. */
  readinessScore: number;
}

const wordCount = (html: string | null | undefined): number =>
  (html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().split(" ").filter(Boolean).length;

/** Evaluate a programmatic page against the gate. */
export function evaluatePseoGate(input: GateInput): GateResult {
  const failures: string[] = [];
  const words = wordCount(input.body);

  if (words === 0) failures.push("The page has no body content.");
  else if (words < MIN_BODY_WORDS) failures.push(`The body is thin (${words} words; at least ${MIN_BODY_WORDS} are needed).`);

  if (!input.authorId) failures.push("No named author is assigned, which EEAT requires.");
  if (!input.metaDescription) failures.push("No meta description is set.");

  // Readiness is measured from the page, never supplied. It used to come from a form field that did
  // not exist, so it was always null and every publish was refused with "Data readiness is 0%".
  const readiness = computeReadiness({
    body: input.body,
    authorId: input.authorId,
    metaDescription: input.metaDescription,
    targetLocation: input.targetLocation,
  });
  if (readiness.score < MIN_READINESS) {
    failures.push(`Data readiness is ${readiness.score}%, below the ${MIN_READINESS}% gate.`);
    // The specific unmet conditions, so the editor knows what to change rather than only the number.
    for (const reason of readiness.unmet) if (!failures.includes(reason)) failures.push(reason);
  }

  return { passes: failures.length === 0, failures, readinessScore: readiness.score };
}

/**
 * The status and noindex a page may actually be saved with. A page that fails the gate is never left
 * published-and-indexable: it is held at draft and forced to noindex so Google never sees it.
 */
export function applyPseoGate(
  requestedStatus: string,
  requestedNoindex: boolean,
  gate: GateResult,
): { status: string; noindex: boolean; heldBack: boolean } {
  if (requestedStatus === "published" && !gate.passes) {
    return { status: "draft", noindex: true, heldBack: true };
  }
  return { status: requestedStatus, noindex: requestedNoindex, heldBack: false };
}
