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
    out.push(`${name}="${value.replace(/"/g, "&quot;")}"`);
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
  return html.replace(/<\/?([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^>])*?)\/?>/g, (whole, rawName: string, attrs: string) => {
    const name = rawName.toLowerCase();
    if (!ALLOWED.has(name)) return "";
    if (whole.startsWith("</")) return `</${name}>`;
    if (VOID.has(name)) return `<${name}${cleanAttributes(name, attrs)}>`;
    return `<${name}${cleanAttributes(name, attrs)}>`;
  });
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
