/**
 * What makes a meta title and description good, in one place.
 *
 * Six editors each carried their own inline checklist, and they disagreed: the description window
 * was 120 to 165 on authors and case studies, 120 to 160 on insights, jobs and generated pages, and
 * three of them spent checks on whether a "focus keyword" appeared in the title, the description and
 * the body. That last group measured keyword repetition, which no search engine has rewarded for
 * years and which pushed writers to say the same phrase three times.
 *
 * What replaces them is what actually shows in a result: a title that fits, and a description that
 * fills the window without being cut off. `endsComplete` is the one worth stating twice, because a
 * snippet that stops mid-sentence is the single most visible way for a listing to look broken.
 */
import { META_LIMITS, fitMetaDescription, splitSentences } from "@nexoris/seo";

export const DESCRIPTION_MIN = META_LIMITS.descriptionMin;
export const DESCRIPTION_MAX = META_LIMITS.descriptionMax;
export const TITLE_MAX = META_LIMITS.titleMax;

export interface MetaState {
  /** Length sits inside the 155 to 160 window. */
  inRange: boolean;
  /** Ends on a finished sentence rather than mid-thought. */
  endsComplete: boolean;
  /** Plain guidance for the editor, or null when there is nothing to say. */
  hint: string | null;
}

/** Assess a meta description as written, not as generated. */
export function describeMetaDescription(metaDesc: string): MetaState {
  const text = metaDesc.trim();
  if (!text) return { inRange: false, endsComplete: false, hint: "No meta description yet." };

  const inRange = text.length >= DESCRIPTION_MIN && text.length <= DESCRIPTION_MAX;
  // Complete when the whole text survives the fitter unchanged: every sentence in it is finished
  // and the total is within the maximum.
  const endsComplete = /[.!?]["'”]?$/.test(text) && splitSentences(text).length > 0;

  let hint: string | null = null;
  if (!endsComplete) hint = "Finish the last sentence. A snippet cut mid-thought reads as broken.";
  else if (text.length < DESCRIPTION_MIN) hint = `${DESCRIPTION_MIN - text.length} characters short of the window.`;
  else if (text.length > DESCRIPTION_MAX) hint = `${text.length - DESCRIPTION_MAX} characters over; it will be cut in results.`;

  return { inRange, endsComplete, hint };
}

/**
 * The shared checks behind the SEO score.
 *
 * Deliberately about the page rather than about a keyword: does the title fit, does the description
 * fill its window and finish its sentence, is there enough copy, is it structured, does it link out
 * to somewhere else on the site.
 */
export function metaChecks(input: {
  title: string;
  metaTitle: string;
  metaDesc: string;
  body?: string;
  words?: number;
  minWords?: number;
  requireStructure?: boolean;
  requireLinks?: boolean;
}): boolean[] {
  const { title, metaTitle, metaDesc, body = "", words = 0, minWords = 0 } = input;
  const desc = describeMetaDescription(metaDesc);
  const effectiveTitle = (metaTitle || title).trim();

  const checks = [
    title.trim().length >= 15,
    effectiveTitle.length > 0 && effectiveTitle.length <= TITLE_MAX,
    desc.inRange,
    desc.endsComplete,
  ];
  if (minWords > 0) checks.push(words >= minWords);
  if (input.requireStructure) checks.push(/<(ul|ol|h[23])/i.test(body));
  if (input.requireLinks) checks.push(/<a\s/i.test(body));
  return checks;
}

/** The score the editors show, 0 to 100. */
export function metaScore(checks: boolean[]): number {
  if (checks.length === 0) return 0;
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

/**
 * Trim a description to whole sentences within the window.
 *
 * Offered to the editor as a fix rather than applied silently: it is their copy, and a description
 * that loses its last sentence should be a choice they make.
 */
export function trimToCompleteSentences(metaDesc: string): string {
  return fitMetaDescription(metaDesc).text;
}
