/**
 * Fitting meta titles and descriptions to their limits without cutting words or sentences.
 *
 * The generator used to do `description.slice(0, 160)`, which is how a snippet ends up reading
 * "...helping teams reduce manual work and impro". A search result is often the only sentence
 * someone reads before deciding whether to click, and a severed word is a reason not to.
 *
 * A model will not reliably hit a 155 to 160 character window either: asked for 160 it returns 180
 * or 120, and asked again it returns something different. So the length is enforced here rather
 * than hoped for, by keeping whole sentences and stopping before the limit instead of chopping at
 * it. That is also why the title is derived from the page title rather than written: the title of
 * the page is already the best short description of the page, and inventing a second one invites
 * the two to disagree.
 */
import { META_LIMITS } from "./constants.js";

export interface FittedDescription {
  /** The description to use. Always ends on a sentence boundary, never mid-word. */
  text: string;
  /** False when not even the first sentence fits the maximum, so there is nothing whole to use. */
  complete: boolean;
  /** True when the length sits inside the target window. */
  inRange: boolean;
  length: number;
}

/** Collapse whitespace and strip surrounding quotes a model sometimes wraps its answer in. */
function tidy(input: string): string {
  return input
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^["'“”]+|["'“”]+$/g, "")
    .trim();
}

/**
 * Split into sentences.
 *
 * Abbreviations are the trap: "No. 5", "e.g." and "Ltd." all end in a full stop without ending a
 * sentence. A sentence break is only recognised when the stop is followed by whitespace and a
 * capital letter or a digit, which is enough for prose of this kind.
 */
/**
 * Words whose full stop is part of the word, not the end of a sentence.
 *
 * "No." is here because the company's own address starts "No. 5, Mojisola Dokpesi Street", and a
 * stop followed by a digit otherwise looks exactly like a sentence break.
 */
const ABBREVIATIONS = new Set([
  "no", "nos", "ltd", "inc", "co", "corp", "plc", "st", "rd", "ave",
  "mr", "mrs", "ms", "dr", "prof", "sr", "jr",
  "eg", "ie", "etc", "vs", "fig", "vol", "approx", "dept", "est",
]);

/** True when the stop at `index` closes an abbreviation rather than a sentence. */
function isAbbreviation(text: string, index: number): boolean {
  const before = text.slice(0, index);
  const word = (before.match(/([A-Za-z.]+)$/)?.[1] ?? "").replace(/\./g, "").toLowerCase();
  if (!word) return false;
  // Single initials ("J. Smith") and known abbreviations both keep their stop.
  return word.length === 1 || ABBREVIATIONS.has(word);
}

export function splitSentences(input: string): string[] {
  const text = tidy(input);
  if (!text) return [];
  const out: string[] = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch !== "." && ch !== "!" && ch !== "?") continue;
    // Consume a run of terminators, e.g. "?!".
    let end = i;
    while (end + 1 < text.length && ".!?".includes(text[end + 1] ?? "")) end++;
    const after = text.slice(end + 1);
    if (after === "") {
      out.push(text.slice(start, end + 1).trim());
      start = end + 1;
      break;
    }
    if (!/^\s/.test(after)) { i = end; continue; }
    if (!/^\s+["'“]?[A-Z0-9]/.test(after)) { i = end; continue; }
    if (ch === "." && isAbbreviation(text, i)) { i = end; continue; }
    out.push(text.slice(start, end + 1).trim());
    start = end + 1;
    i = end;
  }
  const tail = text.slice(start).trim();
  if (tail) out.push(tail);
  return out.filter(Boolean);
}

/**
 * Fit a description into the meta window using whole sentences only.
 *
 * Sentences are added while they fit. Nothing is ever cut, so the result is always something a
 * person could read aloud and a search engine can show in full.
 */
export function fitMetaDescription(
  input: string,
  limits: { min: number; max: number } = { min: META_LIMITS.descriptionMin, max: META_LIMITS.descriptionMax },
): FittedDescription {
  const sentences = splitSentences(input);
  let text = "";
  for (const sentence of sentences) {
    const candidate = text ? `${text} ${sentence}` : sentence;
    if (candidate.length > limits.max) break;
    text = candidate;
  }
  return {
    text,
    complete: text.length > 0,
    inRange: text.length >= limits.min && text.length <= limits.max,
    length: text.length,
  };
}

/**
 * Derive the meta title from the page title.
 *
 * The page title is already the shortest accurate description of the page, so the meta title is it,
 * shortened only when it has to be, and only at a word boundary. Trailing punctuation left behind
 * by the cut is removed so the result does not end on a comma or a dangling connector.
 */
export function deriveMetaTitle(pageTitle: string, max: number = META_LIMITS.titleMax): string {
  const title = tidy(pageTitle);
  if (title.length <= max) return title;

  const words = title.split(" ");
  let out = "";
  for (const word of words) {
    const candidate = out ? `${out} ${word}` : word;
    if (candidate.length > max) break;
    out = candidate;
  }
  // A single word longer than the limit leaves nothing; fall back to a hard cut, which is the one
  // case where there is no word boundary to respect.
  if (!out) out = title.slice(0, max);
  return out.replace(/[\s,;:\-–—]+$/g, "").replace(/\s+(and|or|for|the|a|an|to|of|in|with|on)$/i, "");
}
