/**
 * Placing an internal link inside the running text, on the phrase it belongs to.
 *
 * The assistant used to append a paragraph reading "Related reading: <link>" to the bottom of the
 * article. That is a footnote, not internal linking: it passes little authority, readers skip it, and it
 * tells a search engine nothing about what the linked page is about. A link earns its weight from the
 * words it sits on and the sentence around them.
 *
 * So a suggestion is only useful if the phrase actually occurs in the copy. These functions find that
 * occurrence, show the editor the exact paragraph with the phrase marked, and — on accept — wrap that
 * one occurrence in place, leaving everything else untouched.
 *
 * What is deliberately refused:
 *
 *   * A phrase inside an existing link. Nesting anchors is invalid, and re-linking an already-linked
 *     phrase to somewhere else changes a decision someone already made.
 *   * A phrase inside a heading. A heading is a landmark; a link in one competes with it and reads badly
 *     in a table of contents.
 *   * A second link to a target already linked from this page. The first link is the one that counts.
 *
 * A pure string transform, so it runs in the browser and under test alike.
 */

/** Where a phrase was found, with enough context for an editor to judge it before accepting. */
export interface AnchorMatch {
  /** Which paragraph, counting only linkable blocks, so the UI can say "paragraph 3". */
  paragraphNumber: number;
  /** The paragraph's text, split around the phrase so the UI can mark it without using innerHTML. */
  before: string;
  /** The phrase exactly as it appears in the copy, which may differ in case from the suggestion. */
  match: string;
  after: string;
}

/** Blocks a link may sit in. Headings and existing links are excluded by design. */
const LINKABLE = /<(p|li|td|th|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/gi;

/**
 * Headings that open a summary of the article rather than a part of it.
 *
 * These blocks restate what the piece says, for a reader deciding whether to read it and for an
 * assistant quoting it. A link in one sends that reader away before they have started, and the same
 * sentence usually appears again further down where it is actually being made — which is where the
 * link belongs, with the argument around it.
 */
const SUMMARY_HEADING =
  /^\s*(tl;?\s*dr|key\s+facts?(\s+at\s+a\s+glance)?|key\s+takeaways?|the\s+short\s+version|in\s+short|at\s+a\s+glance|summary)\b/i;

/**
 * The character ranges covered by summary blocks: each summary heading up to the next heading.
 *
 * Editors write these as an ordinary heading followed by a list, so there is no wrapper to test for
 * and no class to look at. The span between one heading and the next is the block.
 */
export function summaryRanges(html: string): [number, number][] {
  const headings = [...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)];
  const ranges: [number, number][] = [];
  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i]!;
    const text = (heading[2] ?? "").replace(/<[^>]+>/g, "").replace(/&[a-z]+;/gi, " ").trim();
    if (!SUMMARY_HEADING.test(text)) continue;
    const next = headings[i + 1];
    ranges.push([heading.index, next ? next.index : html.length]);
  }
  return ranges;
}

const within = (ranges: readonly [number, number][], index: number): boolean =>
  ranges.some(([from, to]) => index >= from && index < to);

const escapeRx = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * The phrase, matched only where it is a whole phrase.
 *
 * This was a plain substring match, so a suggested anchor of "cost" linked the first four letters of
 * "costs" and left the s outside the link, and "automation" cut into "automations". The reader saw a
 * word with its ending sheared off, and the markup carried a link around a fragment.
 *
 * A hyphen counts as part of a word here: "commerce" must not match inside "e-commerce", which is a
 * different thing and a different page. Any run of whitespace in the phrase matches any run in the
 * copy, so a paste that left two spaces between words still matches.
 */
function phraseRx(phrase: string): RegExp {
  return new RegExp(`(?<![\\w-])${escapeRx(phrase).replace(/\\?\s+/g, "\\s+")}(?![\\w-])`, "i");
}
const stripTags = (s: string): string => s.replace(/<[^>]+>/g, "");
const decode = (s: string): string =>
  s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');

/** True when the position sits inside an <a> element within this block. */
function insideLink(html: string, index: number): boolean {
  const before = html.slice(0, index);
  return before.lastIndexOf("<a ") > before.lastIndexOf("</a>");
}

/**
 * Find where a phrase occurs in the body, ignoring blocks a link must not go in.
 *
 * Matching is case-insensitive and tolerant of the extra whitespace a paste leaves between words, but
 * the text returned is what the copy actually says, so the editor sees their own words.
 */
export function findAnchor(bodyHtml: string, anchor: string): AnchorMatch | null {
  const phrase = anchor.trim();
  if (!phrase) return null;

  const rx = phraseRx(phrase);
  const summaries = summaryRanges(bodyHtml);

  let paragraphNumber = 0;
  LINKABLE.lastIndex = 0;
  let block: RegExpExecArray | null;
  while ((block = LINKABLE.exec(bodyHtml)) !== null) {
    paragraphNumber += 1;
    // A TL;DR or Key Facts block summarises the article; a link belongs where the point is made.
    if (within(summaries, block.index)) continue;
    const inner = block[2] ?? "";
    const hit = rx.exec(inner);
    if (!hit) continue;
    if (insideLink(inner, hit.index)) continue;

    const text = decode(stripTags(inner));
    const textHit = rx.exec(text);
    if (!textHit) continue;

    return {
      paragraphNumber,
      before: text.slice(0, textHit.index),
      match: textHit[0],
      after: text.slice(textHit.index + textHit[0].length),
    };
  }
  return null;
}

/** Whether this page already links to a target, so a second link is not offered. */
export function alreadyLinks(bodyHtml: string, target: string): boolean {
  return new RegExp(`<a[^>]+href=["']${escapeRx(target)}["']`, "i").test(bodyHtml);
}

export interface ApplyResult {
  html: string;
  /** False when nothing changed, with `reason` saying why, so the UI can be specific. */
  applied: boolean;
  reason?: "not-found" | "already-linked" | "in-link";
}

/**
 * Wrap the first suitable occurrence of the phrase in a link to the target.
 *
 * Only the first occurrence is linked. Linking every mention of a phrase reads as spam to a reader and
 * to a search engine, and the first mention is the one with the most context around it.
 */
export function applyInlineLink(bodyHtml: string, anchor: string, target: string): ApplyResult {
  const phrase = anchor.trim();
  if (!phrase) return { html: bodyHtml, applied: false, reason: "not-found" };
  if (alreadyLinks(bodyHtml, target)) return { html: bodyHtml, applied: false, reason: "already-linked" };

  const rx = phraseRx(phrase);
  const summaries = summaryRanges(bodyHtml);
  let done = false;

  const html = bodyHtml.replace(LINKABLE, (whole, tag: string, inner: string, offset: number) => {
    if (done) return whole;
    // The same exclusion the finder applies, so what is offered and what is placed agree.
    if (within(summaries, offset)) return whole;
    const hit = rx.exec(inner);
    if (!hit) return whole;
    if (insideLink(inner, hit.index)) return whole;
    // A phrase that spans a tag boundary cannot be wrapped without breaking the markup around it.
    if (/<[^>]*$/.test(inner.slice(0, hit.index)) || hit[0].includes("<")) return whole;

    done = true;
    const linked = `${inner.slice(0, hit.index)}<a href="${target}">${hit[0]}</a>${inner.slice(hit.index + hit[0].length)}`;
    // Reuse the opening tag exactly as it was, so any attributes on the block survive.
    const open = whole.slice(0, whole.indexOf(">") + 1);
    return `${open}${linked}</${tag}>`;
  });

  return done ? { html, applied: true } : { html: bodyHtml, applied: false, reason: "not-found" };
}
