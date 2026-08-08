/**
 * Cleans HTML on its way into the rich text editor, from a paste or from an Oge generation.
 *
 * Nothing did this before. Whatever the clipboard held went straight into the document, so a paste from
 * Word arrived with `mso-` styles and `<o:p>` tags, a paste from Google Docs with `<b style="font-weight:
 * normal">` wrappers and a `<span>` around every word, and a paste from a chat assistant with markdown
 * asterisks or bare `<div>`s. That markup is what the website then published and what search engines and
 * AI assistants read.
 *
 * The rules here are about meaning, not appearance:
 *
 *   * Presentation is stripped. Inline colours, fonts and sizes belong to the site's stylesheet, not to
 *     a paragraph. A pasted 11pt Calibri paragraph is a paragraph.
 *   * Headings never skip a level, and there is never more than one H1. The page title is the H1, so a
 *     pasted document's own H1 is demoted and everything under it moves with it — otherwise a single
 *     article ends up with three H1s and a gap from H2 to H4.
 *   * Tables get a real header row of `<th scope="col">`, and a first column of headings becomes
 *     `<th scope="row">`. A table whose headers are only bold text is unreadable to a screen reader and
 *     invisible to a search engine.
 *   * Lists become real `<ul>`/`<ol>`. A "1." typed at the start of a line is a numbered list.
 *   * Empty paragraphs used as spacing are dropped; spacing is the stylesheet's job.
 *
 * Written as a pure string transform rather than against the DOM so the same function runs in the
 * browser on paste, on the server for generated content, and under test without a DOM.
 */

/** Tags that may survive. Everything else is unwrapped (its text is kept) or dropped entirely. */
const ALLOWED = new Set([
  "p", "br", "strong", "em", "u", "s", "a", "code", "pre", "blockquote",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li",
  "table", "thead", "tbody", "tr", "th", "td",
  "img", "figure", "figcaption", "hr", "sup", "sub",
]);

/** Dropped with everything inside them: they carry no content a reader needs. */
const DROP_WITH_CONTENT = new Set(["script", "style", "head", "title", "meta", "link", "noscript", "iframe", "object", "embed", "form", "input", "button", "select", "textarea", "svg"]);

/** Attributes worth keeping, per tag. Everything else goes, including every class and inline style. */
const KEEP_ATTRS: Record<string, Set<string>> = {
  a: new Set(["href", "target", "rel"]),
  img: new Set(["src", "alt", "width", "height"]),
  th: new Set(["scope", "colspan", "rowspan"]),
  td: new Set(["colspan", "rowspan"]),
  ol: new Set(["start"]),
};

/** Old presentational tags and their meaningful equivalents. */
const RENAME: Record<string, string> = {
  b: "strong", i: "em", strike: "s", del: "s", ins: "u",
  div: "p", section: "p", article: "p", main: "p", header: "p", footer: "p", span: "",
  font: "", center: "p", small: "", big: "", tt: "code",
};

interface Tag { kind: "open" | "close" | "void"; name: string; attrs: string }
type Token = { type: "tag"; tag: Tag } | { type: "text"; text: string };

/**
 * Stand-in for a <pre> block while whitespace elsewhere is collapsed.
 *
 * It has to be something a real document cannot contain, or a stretch of ordinary text would be
 * mistaken for a stashed block and replaced by it. U+E000 sits in the Unicode private use area,
 * which no genuine content uses.
 */
const PRE_MARK = "\uE000";
const PRE_RX = new RegExp(`${PRE_MARK}(\\d+)${PRE_MARK}`, "g");

const VOID = new Set(["br", "img", "hr", "input", "meta", "link"]);

/** Split HTML into tags and text. Comments and doctypes are discarded as they are met. */
function tokenise(html: string): Token[] {
  const out: Token[] = [];
  // Word exports carry conditional comments holding whole blocks of markup; drop them wholesale.
  const src = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<!\[if[\s\S]*?<!\[endif\]>/gi, "")
    .replace(/<!DOCTYPE[^>]*>/gi, "");

  const rx = /<\/?([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^>])*?)\/?>/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = rx.exec(src)) !== null) {
    if (m.index > last) out.push({ type: "text", text: src.slice(last, m.index) });
    // Namespaced tags (o:p, w:sdt) come from Word and mean nothing here.
    const name = (m[1] ?? "").toLowerCase().replace(/^[a-z]+:/, "");
    const closing = m[0].startsWith("</");
    const selfClosing = m[0].endsWith("/>") || VOID.has(name);
    out.push({ type: "tag", tag: { kind: closing ? "close" : selfClosing ? "void" : "open", name, attrs: m[2] ?? "" } });
    last = rx.lastIndex;
  }
  if (last < src.length) out.push({ type: "text", text: src.slice(last) });
  return out;
}

/** Keep only the attributes that carry meaning for this tag. */
function cleanAttrs(name: string, raw: string): string {
  const keep = KEEP_ATTRS[name];
  if (!keep) return "";
  const out: string[] = [];
  const rx = /([a-zA-Z][\w:-]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g;
  let m: RegExpExecArray | null;
  while ((m = rx.exec(raw)) !== null) {
    const attr = (m[1] ?? "").toLowerCase();
    if (!keep.has(attr)) continue;
    const value = m[3] ?? m[4] ?? m[5] ?? "";
    // A javascript: or data: href is a script in disguise, whatever it claims to link to.
    if ((attr === "href" || attr === "src") && /^\s*(javascript|vbscript|data):/i.test(value)) continue;
    out.push(`${attr}="${value.replace(/"/g, "&quot;").trim()}"`);
  }
  // A link that opens a new tab without rel="noreferrer" hands the target a reference to this page.
  if (name === "a" && out.some((a) => a.startsWith('target="_blank"')) && !out.some((a) => a.startsWith("rel="))) {
    out.push('rel="noreferrer"');
  }
  return out.length ? ` ${out.join(" ")}` : "";
}

/** First pass: drop what must not survive, rename what is merely presentational, strip attributes. */
function sanitise(tokens: Token[]): Token[] {
  const out: Token[] = [];
  let dropDepth = 0;
  let dropName = "";

  for (const t of tokens) {
    if (t.type === "text") {
      if (dropDepth === 0) out.push(t);
      continue;
    }
    const { kind, name, attrs } = t.tag;

    if (DROP_WITH_CONTENT.has(name)) {
      if (kind === "open") { dropDepth += 1; dropName = name; }
      else if (kind === "close" && name === dropName) dropDepth = Math.max(0, dropDepth - 1);
      continue;
    }
    if (dropDepth > 0) continue;

    const renamed = Object.prototype.hasOwnProperty.call(RENAME, name) ? RENAME[name]! : name;
    // An empty rename means "unwrap": the tag goes, its text stays.
    if (renamed === "") continue;
    if (!ALLOWED.has(renamed)) continue;

    out.push({ type: "tag", tag: { kind, name: renamed, attrs: kind === "close" ? "" : cleanAttrs(renamed, attrs) } });
  }
  return out;
}

/** Serialise tokens back to HTML. */
function render(tokens: Token[]): string {
  return tokens.map((t) => {
    if (t.type === "text") return t.text;
    const { kind, name, attrs } = t.tag;
    if (kind === "close") return `</${name}>`;
    if (kind === "void") return `<${name}${attrs}>`;
    return `<${name}${attrs}>`;
  }).join("");
}

/**
 * Re-level headings so the document starts at H2 and never skips.
 *
 * The page's own title is the H1, so a pasted document's H1 becomes an H2 and its H2 an H3, and so on.
 * Levels are mapped by the order they appear rather than by arithmetic, so a document that jumps from
 * its top level straight to what it called H4 comes out as a clean H2 then H3.
 */
function relevelHeadings(html: string): string {
  const found = [...html.matchAll(/<h([1-6])\b/gi)].map((m) => Number(m[1]));
  if (found.length === 0) return html;

  const distinct = [...new Set(found)].sort((a, b) => a - b);
  const map = new Map<number, number>();
  distinct.forEach((level, i) => map.set(level, Math.min(6, 2 + i)));

  return html.replace(/<(\/?)h([1-6])\b([^>]*)>/gi, (_all, slash: string, level: string, rest: string) =>
    `<${slash}h${map.get(Number(level)) ?? 2}${slash ? "" : rest}>`);
}

/**
 * Give a table real headers.
 *
 * A first row of bold text is how most pasted tables mark their headings, which is a visual convention
 * and nothing more. The first row becomes `<th scope="col">` inside a `<thead>`; where every row then
 * begins with a heading cell, those become `<th scope="row">`.
 */
function fixTables(html: string): string {
  return html.replace(/<table\b[^>]*>([\s\S]*?)<\/table>/gi, (_all, inner: string) => {
    const rows = [...inner.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map((m) => m[1] ?? "");
    if (rows.length === 0) return "";

    const cellsOf = (row: string): { tag: string; attrs: string; body: string }[] =>
      [...row.matchAll(/<(th|td)\b([^>]*)>([\s\S]*?)<\/\1>/gi)]
        .map((m) => ({ tag: (m[1] ?? "td").toLowerCase(), attrs: m[2] ?? "", body: m[3] ?? "" }));

    const stripBold = (s: string): string => s.replace(/<\/?(strong|em|u)>/gi, "").trim();

    const head = cellsOf(rows[0]!);
    const headHtml = `<thead><tr>${head.map((c) => `<th scope="col">${stripBold(c.body)}</th>`).join("")}</tr></thead>`;

    const bodyRows = rows.slice(1).map(cellsOf).filter((cs) => cs.length > 0);
    // Only treat the first column as headings when every row marks it as one; otherwise it is data.
    const firstColIsHeader = bodyRows.length > 0 && bodyRows.every((cs) => cs[0]?.tag === "th");

    const bodyHtml = bodyRows.map((cs) => {
      const tds = cs.map((c, i) =>
        i === 0 && firstColIsHeader
          ? `<th scope="row">${stripBold(c.body)}</th>`
          : `<td>${c.body.trim()}</td>`);
      return `<tr>${tds.join("")}</tr>`;
    }).join("");

    return `<table>${headHtml}${bodyHtml ? `<tbody>${bodyHtml}</tbody>` : ""}</table>`;
  });
}

/** Turn a paragraph that is really a list item into one, and merge runs of them into a list. */
function paragraphsToLists(html: string): string {
  const ORDERED = /^\s*(\d+)[.)]\s+/;
  const BULLET = /^\s*[-*•·‣▪]\s+/;

  const blocks = html.split(/(?=<p>)/);
  const out: string[] = [];
  let buffer: { ordered: boolean; items: string[] } | null = null;

  const flush = (): void => {
    if (!buffer) return;
    const tag = buffer.ordered ? "ol" : "ul";
    out.push(`<${tag}>${buffer.items.map((i) => `<li>${i}</li>`).join("")}</${tag}>`);
    buffer = null;
  };

  for (const block of blocks) {
    const m = /^<p>([\s\S]*?)<\/p>\s*$/.exec(block);
    const text = m?.[1] ?? null;
    if (text === null) { flush(); out.push(block); continue; }

    if (ORDERED.test(text)) {
      if (!buffer?.ordered) { flush(); buffer = { ordered: true, items: [] }; }
      buffer.items.push(text.replace(ORDERED, "").trim());
    } else if (BULLET.test(text)) {
      if (buffer?.ordered !== false) { flush(); buffer = { ordered: false, items: [] }; }
      buffer.items.push(text.replace(BULLET, "").trim());
    } else {
      flush();
      out.push(block);
    }
  }
  flush();
  return out.join("");
}

/** The whole pipeline. Give it anything; it returns clean, semantic, publishable HTML. */
export function normaliseHtml(input: string): string {
  if (!input || !input.trim()) return "";

  let html = render(sanitise(tokenise(input)));

  // Collapse the whitespace Word and Docs pad every tag with, but keep it inside <pre>.
  const pres: string[] = [];
  html = html.replace(/<pre>[\s\S]*?<\/pre>/gi, (m) => `${PRE_MARK}${pres.push(m) - 1}${PRE_MARK}`);
  html = html.replace(/&nbsp;/g, " ").replace(/[\t\r\n]+/g, " ").replace(/ {2,}/g, " ");

  html = fixTables(html);
  html = paragraphsToLists(html);

  // Bare text between blocks — common when a paste arrives as plain lines — becomes paragraphs.
  html = html.replace(/(^|<\/(?:p|h[1-6]|ul|ol|table|blockquote|pre|figure)>)([^<]{2,})(?=<|$)/gi,
    (_all, before: string, text: string) => (text.trim() ? `${before}<p>${text.trim()}</p>` : before));

  // Paragraphs used only for spacing, and list items with nothing in them.
  html = html
    .replace(/<p>(\s|<br\s*\/?>)*<\/p>/gi, "")
    .replace(/<li>(\s|<br\s*\/?>)*<\/li>/gi, "")
    .replace(/<(ul|ol)>\s*<\/\1>/gi, "")
    // A <br> immediately before the end of a block is a stray line break, not a line.
    .replace(/(<br\s*\/?>\s*)+<\/(p|li|h[1-6]|td|th)>/gi, "</$2>");

  html = relevelHeadings(html);

  html = html.replace(PRE_RX, (_all, i: string) => pres[Number(i)] ?? "");
  return html.trim();
}

/** Plain text arriving from the clipboard: split on blank lines into paragraphs, then normalise. */
export function normalisePlainText(text: string): string {
  const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const paragraphs = escaped.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return normaliseHtml(paragraphs.map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`).join(""));
}
