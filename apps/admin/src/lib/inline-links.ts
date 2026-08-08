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

const escapeRx = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

  // Any run of whitespace in the phrase may be any run of whitespace in the copy.
  const rx = new RegExp(escapeRx(phrase).replace(/\\?\s+/g, "\\s+"), "i");

  let paragraphNumber = 0;
  LINKABLE.lastIndex = 0;
  let block: RegExpExecArray | null;
  while ((block = LINKABLE.exec(bodyHtml)) !== null) {
    paragraphNumber += 1;
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

  const rx = new RegExp(escapeRx(phrase).replace(/\\?\s+/g, "\\s+"), "i");
  let done = false;

  const html = bodyHtml.replace(LINKABLE, (whole, tag: string, inner: string) => {
    if (done) return whole;
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
