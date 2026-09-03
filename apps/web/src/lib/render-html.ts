/**
 * Rendering CMS-authored HTML on the public site.
 *
 * The CMS rich text editor stores HTML. Both the insight page and the legal pages were passing that
 * HTML to ReactMarkdown, which escapes raw HTML by default — so an article with a heading, a list or a
 * table published its own tags as visible text. It only ever looked correct because the content that
 * had been through those pages was unformatted prose.
 *
 * So the body is rendered as HTML. Because it is rendered as HTML, it is sanitised here as well as in
 * the editor: the editor cleans what is pasted in, and this cleans what is served out, so a row written
 * before the editor normalised anything cannot put a script on a public page.
 *
 * An allow-list, not a block-list. Anything not named is dropped, which fails safe as new elements and
 * attributes appear.
 */

/** Elements a published document may contain. */
const ALLOWED = new Set([
  "p", "br", "strong", "em", "u", "s", "a", "code", "pre", "blockquote",
  "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "table", "thead", "tbody", "tr", "th", "td",
  "img", "figure", "figcaption", "hr", "sup", "sub", "span",
]);

/** Elements dropped along with everything inside them. */
const DROP_TREE = new Set(["script", "style", "iframe", "object", "embed", "form", "input", "button", "svg", "noscript"]);

/** Attributes kept, per element. Everything else goes, including every inline style. */
const KEEP: Record<string, Set<string>> = {
  a: new Set(["href", "target", "rel"]),
  img: new Set(["src", "alt", "width", "height", "loading"]),
  th: new Set(["scope", "colspan", "rowspan"]),
  td: new Set(["colspan", "rowspan"]),
  ol: new Set(["start"]),
  h2: new Set(["id"]),
  h3: new Set(["id"]),
};

const VOID = new Set(["br", "img", "hr"]);

/** A URL-safe anchor from heading text. */
const slugify = (s: string): string =>
  s.toLowerCase().trim().replace(/<[^>]+>/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/** Same-site absolute URLs become paths; everything else is left exactly as written. */
function internalise(name: string, value: string): string {
  if (name !== "href") return value;
  const m = /^https?:\/\/(?:www\.)?nexoristech\.com(\/[^"']*)?$/i.exec(value.trim());
  return m ? (m[1] ?? "/") : value;
}

function cleanAttributes(tag: string, raw: string): string {
  const keep = KEEP[tag];
  if (!keep) return "";
  const out: string[] = [];
  for (const m of raw.matchAll(/([a-zA-Z][\w:-]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    const name = (m[1] ?? "").toLowerCase();
    if (!keep.has(name)) continue;
    const value = (m[3] ?? m[4] ?? m[5] ?? "").trim();
    // A javascript: or data: URL is a script wearing a link's clothes.
    if ((name === "href" || name === "src") && /^\s*(javascript|vbscript|data):/i.test(value)) continue;
    /*
     * A link to our own site, written absolutely, is reduced to its path.
     *
     * Editor tools have written internal links as https://nexoristech.com/... . On this site that
     * is the same page, but the browser treats it as leaving: a full navigation instead of a
     * client-side one, and from any environment that is not production it goes somewhere else
     * entirely. The path is what an internal link means.
     */
    out.push(`${name}="${internalise(name, value).replace(/"/g, "&quot;")}"`);
  }
  // A link opening a new tab without rel hands the destination a handle on this page.
  if (tag === "a" && out.some((a) => a.startsWith('target="_blank"')) && !out.some((a) => a.startsWith("rel="))) {
    out.push('rel="noreferrer"');
  }
  return out.length ? ` ${out.join(" ")}` : "";
}

/**
 * Strip anything not on the allow-list, keeping the text inside unwrapped elements.
 *
 * Two passes, and the order matters. A single tag-matching pass can only delete tags, so `<script>` and
 * `</script>` would vanish and leave the code between them sitting in the document as visible text —
 * which is how `steal()` survived the first version of this. Elements whose contents must go are
 * removed whole first; only then are the remaining tags filtered.
 */
export function sanitiseHtml(input: string): string {
  if (!input) return "";

  let html = input.replace(/<!--[\s\S]*?-->/g, "");

  // Pass one: remove the dangerous elements together with everything they contain.
  for (const tag of DROP_TREE) {
    html = html
      .replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}\\s*>`, "gi"), "")
      // An unclosed one would otherwise leave its opening tag behind for pass two to drop, keeping the
      // body after it; taking it to the end of the input is the safe reading.
      .replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*$`, "gi"), "");
  }

  // Pass two: keep only allowed elements, and only their meaningful attributes.
  html = html.replace(/<\/?([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^>])*?)\/?>/g, (whole, rawName: string, attrs: string) => {
    const name = rawName.toLowerCase();
    if (!ALLOWED.has(name)) return "";
    if (whole.startsWith("</")) return `</${name}>`;
    if (VOID.has(name)) return `<${name}${cleanAttributes(name, attrs)}>`;
    return `<${name}${cleanAttributes(name, attrs)}>`;
  });

  /*
   * Pass three: repair paragraph nesting, then drop paragraphs with nothing in them.
   *
   * A paragraph cannot contain another paragraph, or a list, or a heading. When the stored HTML says
   * it does, no sanitiser sees a problem and the browser's parser silently rewrites it: it closes the
   * outer <p> before the block it cannot contain, and turns the now-orphaned </p> into a second empty
   * paragraph somewhere else. The published article opened with `<p><p>A standard business website`
   * and ended with `handover.</p><br></p>`, and the page rendered a blank line at the top and another
   * at the bottom. The one at the bottom is what made the space before the FAQ section look wrong:
   * the section margin was 40px and the gap on screen was closer to ninety.
   *
   * This is worth fixing in the markup rather than hiding in CSS, because the same invalid nesting is
   * what a crawler and a reading-mode parser see too.
   */

  // An opening <p> immediately in front of a block element is not a paragraph, it is a wrapper the
  // parser is about to discard anyway.
  html = html.replace(
    /<p\b[^>]*>(\s*)(?=<(?:p|div|ul|ol|h[1-6]|table|blockquote|figure|pre|section)\b)/gi,
    "$1",
  );
  // Line breaks padding the end of a paragraph, which are spacing by another name.
  html = html.replace(/(?:<br\s*\/?>\s*)+(?=<\/p>)/gi, "");
  // The closing half of a wrapper whose opening half has just been removed, left dangling at the end.
  html = html.replace(/(<\/(?:p|ul|ol|div|h[1-6]|table|blockquote|figure)>\s*)<\/p>\s*$/i, "$1");
  // Trailing breaks with no paragraph left to sit in.
  html = html.replace(/(?:\s*<br\s*\/?>)+\s*$/i, "");

  // Whitespace, non-breaking spaces and a lone <br> all count as empty. An image does not, so a
  // paragraph wrapping a picture survives.
  return html.replace(/<p\b[^>]*>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, "");
}

/**
 * The H2 headings in a document, for an on-page contents list.
 *
 * The article page looked for markdown `## ` lines, which CMS content never contains — it is HTML — so
 * the contents list on every article was silently empty.
 */
export function headingsOf(html: string): { text: string; id: string }[] {
  return [...sanitiseHtml(html).matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)]
    .map((m) => (m[1] ?? "").replace(/<[^>]+>/g, "").trim())
    .filter(Boolean)
    .map((text, i) => ({ text, id: slugify(text) || `section-${i + 1}` }));
}

/**
 * Put an anchor id on every H2 so the contents list can jump to it.
 *
 * Applied to the sanitised output rather than trusting whatever id the editor wrote, so the ids the
 * links point at and the ids on the page are generated by the same rule and cannot drift.
 */
/**
 * Put every table in a scrolling frame.
 *
 * A table wide enough to overflow its column drags the whole page sideways with it, which on a
 * phone means every paragraph in the article scrolls too. Wrapping it lets the table scroll inside
 * its own bounds and leaves the rest of the page still.
 */
export function wrapTables(html: string): string {
  return html.replace(/<table[\s>][\s\S]*?<\/table>/gi, (t) => `<div class="table-wrap">${t}</div>`);
}

export function withHeadingIds(html: string): string {
  let i = 0;
  return sanitiseHtml(html).replace(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi, (_all, inner: string) => {
    i += 1;
    const text = inner.replace(/<[^>]+>/g, "").trim();
    return `<h2 id="${slugify(text) || `section-${i}`}">${inner}</h2>`;
  });
}

/**
 * The steps of a how-to guide, taken from the document's own H2 sections.
 *
 * A HowTo needs a step list with text on every step, and the article already has one: each heading is a
 * step and the copy beneath it is the instruction. Deriving them rather than asking the editor to type
 * them twice means the structured data cannot drift from the page.
 *
 * A section with a heading and no copy is skipped: a step with no text is invalid, and inventing text
 * for it would describe something the page does not say.
 */
export function stepsOf(html: string): { name: string; text: string; anchor: string }[] {
  return splitSections(html)
    .filter((s) => s.heading)
    .map((s) => ({
      name: s.heading,
      text: s.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
      anchor: s.id,
    }))
    .filter((s) => s.text);
}

export interface HtmlSection {
  /** The heading text, for the table of contents. */
  heading: string;
  /** Anchor id, so the contents list can jump to it. */
  id: string;
  /** Sanitised HTML of everything under that heading. */
  html: string;
}


/**
 * Split a document into its top-level sections, one per H2.
 *
 * The legal pages needed this and did not have it: the whole body arrived as a single section with an
 * empty heading, so the contents list showed one blank entry and the numbering read "01" for the entire
 * policy. Anything before the first heading is kept as an unnumbered preamble.
 */
export function splitSections(input: string): HtmlSection[] {
  const clean = sanitiseHtml(input);
  if (!clean.trim()) return [];

  const parts = clean.split(/(?=<h2\b)/i).filter((p) => p.trim());
  const sections: HtmlSection[] = [];

  for (const part of parts) {
    const m = /^<h2\b[^>]*>([\s\S]*?)<\/h2>/i.exec(part);
    if (!m) {
      // Copy before the first heading. It belongs to the page, not to a section.
      sections.push({ heading: "", id: "", html: part });
      continue;
    }
    const heading = (m[1] ?? "").replace(/<[^>]+>/g, "").trim();
    sections.push({ heading, id: slugify(heading) || `section-${sections.length + 1}`, html: part.slice(m[0].length) });
  }
  return sections;
}

/**
 * A short label for a contents entry.
 *
 * Article headings are written as the questions a reader actually asks — "How much does a
 * custom-coded website cost in Nigeria?" — which is right on the page and wrong in a narrow
 * sidebar, where it wrapped to four lines and the list stopped being scannable. A contents list is
 * read by shape: the eye runs down it looking for one line that matches what it wants.
 *
 * The label is derived rather than typed, so no editor has to maintain a second title for every
 * section, and derived by removing what a question adds rather than by cutting characters off the
 * end. "How much does a WordPress website cost in Nigeria?" is carrying one idea — a WordPress
 * website's cost — and the interrogative scaffolding around it is what makes it long.
 *
 * Truncation is the last resort and happens at a word boundary. A label is never cut mid-word.
 */
const QUESTION_OPENERS = [
  /^how much (?:does|do|is|are|will|would|can)\s+/i,
  /^how (?:do|does|can|should|would|will)\s+(?:you|we|i|they)?\s*/i,
  /^what (?:is|are|does|do|kind of|sort of|type of)\s+/i,
  /^why (?:is|are|does|do|should|would)\s+/i,
  /^when (?:is|are|does|do|should|would)\s+/i,
  /^which (?:is|are|of)?\s*/i,
  /^who (?:is|are|does|do|should)\s+/i,
  /^should (?:you|we|i|they)\s+/i,
  /^do (?:you|we|i|they)\s+/i,
];

/*
 * Qualifiers that repeat on every heading in a piece.
 *
 * An article about website costs in Nigeria has "in Nigeria" on eight of its nine headings, so in a
 * contents list the phrase distinguishes nothing and costs a line on a narrow column. It is always
 * removed, not only when the label is over length: repetition is the problem, not width.
 */
const TRAILING_NOISE = /\s+(?:in nigeria|in 2026|actually|really|exactly|for you|right now)\b/gi;

/**
 * A verb left dangling once its question has been removed.
 *
 * "What does a website price actually include?" reduces to "a website price include", which is not
 * a phrase anybody would write. The subject alone - "Website price" - is the label. Words that are
 * also nouns are deliberately absent: "cost" stays, because "Website cost" is exactly right.
 */
const DANGLING_VERB =
  /\s+(?:include|includes|mean|means|work|works|matter|matters|differ|differs|involve|involves|entail|entails|apply|applies|do|does)$/i;

export function tocLabel(heading: string, max = 38): string {
  let text = heading.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().replace(/\?+$/, "");
  for (const opener of QUESTION_OPENERS) {
    const stripped = text.replace(opener, "");
    // Only accept the strip when something substantial survives it.
    if (stripped !== text && stripped.trim().split(/\s+/).length >= 2) {
      text = stripped.trim();
      break;
    }
  }
  text = text.replace(TRAILING_NOISE, "").trim();
  // The article the question left behind: "a website cost" is a fragment, "Website cost" is a label.
  text = text.replace(/^(?:a|an|the)\s+/i, "");
  if (text.split(/\s+/).length > 2) text = text.replace(DANGLING_VERB, "");
  text = text.replace(/\s{2,}/g, " ").replace(/[,;:\-–—]+$/, "").trim();
  if (text.length === 0) return heading.replace(/<[^>]+>/g, "").trim();

  if (text.length > max) {
    const words = text.split(" ");
    let out = "";
    for (const word of words) {
      const next = out ? `${out} ${word}` : word;
      if (next.length > max) break;
      out = next;
    }
    text = (out || text.slice(0, max)).replace(/[,;:\-–—]+$/, "");
  }
  /*
   * A label never ends on a word that was about to introduce something.
   *
   * Cutting at a word boundary still leaves "Price ranges for different types of" and "Hire a
   * freelancer, an agency, or use a", which read as sentences interrupted rather than as labels.
   * Trailing function words are dropped until the label ends on something that carries meaning.
   */
  for (;;) {
    const trimmed = text.replace(
      /\s+(?:of|for|to|in|on|at|by|with|from|a|an|the|or|and|that|is|are|do|does|most|use)$/i,
      "",
    );
    if (trimmed === text || trimmed.split(/\s+/).length < 2) break;
    text = trimmed;
  }
  text = text.replace(/[,;:\-–—]+$/, "").trim();
  // A label reads as a label, not as a sentence fragment starting mid-thought.
  return text.charAt(0).toUpperCase() + text.slice(1);
}
