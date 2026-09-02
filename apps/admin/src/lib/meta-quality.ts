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
export interface MetaCheckInput {
  title: string;
  metaTitle: string;
  metaDesc: string;
  body?: string;
  words?: number;
  minWords?: number;
  requireStructure?: boolean;
  requireLinks?: boolean;
}

/** One check, with what it is and what to do when it fails. */
export interface MetaFinding {
  readonly id: string;
  readonly label: string;
  readonly pass: boolean;
  /** What to change. Written as an instruction, not a diagnosis. */
  readonly fix: string;
}

/**
 * The checks behind the score, each one able to say what it is measuring and what would fix it.
 *
 * The score used to be an anonymous number out of a hundred: an editor could see 57 and had no way
 * to learn what the missing 43 was. A number nobody can act on is decoration. Each check now carries
 * its own remedy, and the panel lists the ones that failed.
 */
export function metaFindings(input: MetaCheckInput): MetaFinding[] {
  const { title, metaTitle, metaDesc, body = "", words = 0, minWords = 0 } = input;
  const desc = describeMetaDescription(metaDesc);
  const effectiveTitle = (metaTitle || title).trim();
  const titleLength = effectiveTitle.length;

  const findings: MetaFinding[] = [
    {
      id: "title",
      label: "The page has a real title",
      pass: title.trim().length >= 15,
      fix: "Give the page a title of at least 15 characters. It is what a reader sees first in a result.",
    },
    {
      id: "title-length",
      label: `Title fits in ${TITLE_MAX} characters`,
      pass: titleLength > 0 && titleLength <= TITLE_MAX,
      fix:
        titleLength === 0
          ? "Add a title. Without one there is nothing to show in a search result."
          : `Shorten the title by ${titleLength - TITLE_MAX} characters, or it will be cut off in results.`,
    },
    {
      id: "desc-length",
      label: `Meta description is ${DESCRIPTION_MIN} to ${DESCRIPTION_MAX} characters`,
      pass: desc.inRange,
      fix: desc.hint ?? `Write a description between ${DESCRIPTION_MIN} and ${DESCRIPTION_MAX} characters.`,
    },
    {
      id: "desc-complete",
      label: "Meta description finishes its sentence",
      pass: desc.endsComplete,
      fix: "Finish the last sentence and end it with a full stop. A snippet cut mid-thought reads as broken.",
    },
  ];

  if (minWords > 0) {
    findings.push({
      id: "length",
      label: `At least ${minWords} words`,
      pass: words >= minWords,
      fix:
        words >= minWords
          ? "Long enough."
          : `Add about ${minWords - words} more words. There is not yet enough here to answer the question the title asks.`,
    });
  }
  if (input.requireStructure) {
    findings.push({
      id: "structure",
      label: "Has headings or lists",
      pass: /<(ul|ol|h[23])/i.test(body),
      fix: "Break the body up with subheadings or a list. An unbroken wall of text is hard to read and hard to quote.",
    });
  }
  if (input.requireLinks) {
    findings.push({
      id: "links",
      label: "Links to somewhere else on the site",
      pass: /<a\s/i.test(body),
      fix: "Link to at least one related page. It gives a reader somewhere to go and shows how this page fits.",
    });
  }
  return findings;
}

/** The same checks as bare booleans, for callers that only need the score. */
export function metaChecks(input: MetaCheckInput): boolean[] {
  return metaFindings(input).map((f) => f.pass);
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
