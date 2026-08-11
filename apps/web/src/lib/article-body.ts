/**
 * Remove blocks from an article body that the page already renders elsewhere.
 *
 * The CMS assistant used to offer "Insert TL;DR into content" and "Insert FAQs into content", and
 * both also saved the same content to the article's own `tldr` and `faqs` fields. The template
 * renders those fields as the short-version panel and the questions accordion, so anything that was
 * inserted published a second time: the summary appeared twice, and the FAQ appeared twice with
 * only the accordion carrying FAQPage schema.
 *
 * The buttons are gone, but articles saved before that still hold the inserted markup. Rather than
 * rewrite stored copy, the duplicate is removed on the way out, and only when it really is a
 * duplicate: a TL;DR block is dropped only when the article has a stored TL;DR, and a question is
 * dropped only when that exact question is in the stored FAQ set. An editor who wrote their own
 * FAQ prose keeps it.
 */

/** Normalise for comparison: strip tags, drop punctuation, collapse space, lowercase. */
function key(input: string): string {
  return input
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export interface DuplicateSources {
  /** The stored TL;DR bullets. A body TL;DR block is removed only when this has entries. */
  tldr?: string[] | undefined;
  /** The stored FAQ set. A body question is removed only when it matches one of these. */
  faq?: { question: string }[] | undefined;
}

/** A heading and the paragraphs that follow it, which is the shape the FAQ insert produced. */
const HEADING_WITH_BODY = /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>\s*(?:<p[^>]*>[\s\S]*?<\/p>\s*)*/gi;

export function stripDuplicateBlocks(body: string, sources: DuplicateSources): string {
  let out = body ?? "";
  if (!out) return "";

  // --- the summary: heading and its list together ------------------------------------------------
  if (sources.tldr && sources.tldr.length > 0) {
    out = out.replace(/<h[1-6][^>]*>\s*TL;?DR[^<]*<\/h[1-6]>\s*(?:<(ul|ol)[\s\S]*?<\/\1>)?/gi, "");
  }

  // --- the questions the accordion already shows -------------------------------------------------
  const questions = new Set((sources.faq ?? []).map((f) => key(f.question)).filter(Boolean));
  if (questions.size > 0) {
    // The heading the insert wrote above the set. Removed only because the set itself is stored.
    out = out.replace(/<h[1-6][^>]*>\s*(?:Frequently asked questions|Common questions|FAQs?)\s*<\/h[1-6]>/gi, "");

    // One pass: drop a heading and its answer only when that heading is one of the stored questions.
    out = out.replace(HEADING_WITH_BODY, (match, heading: string) => (questions.has(key(heading)) ? "" : match));
  }

  return out.replace(/(?:\s*<p>\s*<\/p>\s*)+/gi, "").trim();
}
