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

export interface GateInput {
  body: string | null | undefined;
  /** A named author is required for EEAT on every programmatic page. */
  authorId: string | null | undefined;
  readinessScore: number | null | undefined;
  metaDescription: string | null | undefined;
}

export interface GateResult {
  /** True when the page may be published and indexed. */
  passes: boolean;
  /** Plain-language reasons it cannot, for the editor to act on. */
  failures: string[];
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
  if ((input.readinessScore ?? 0) < MIN_READINESS) failures.push(`Data readiness is ${input.readinessScore ?? 0}%, below the ${MIN_READINESS}% gate.`);
  if (!input.metaDescription) failures.push("No meta description is set.");

  return { passes: failures.length === 0, failures };
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
