/**
 * Convert the rich text editor's HTML into the RichBlock AST the PDF renders.
 *
 * The CMS editor (the one Insights uses) emits HTML, which is the right thing for it to store. The PDF
 * cannot lay out arbitrary HTML, so it renders a controlled subset instead: headings, paragraphs, and
 * bulleted or numbered lists, each made of runs that may be bold, italic, underlined, or a link.
 *
 * Emphasis is read from the tags rather than from computed styles, because this runs against parsed
 * HTML where nothing has been laid out and `getComputedStyle` would report defaults for everything.
 * The editor writes semantic tags, so the tags are the reliable signal.
 */
import type { RichBlock, RichRun } from "./types.js";

const BOLD_TAGS = new Set(["B", "STRONG"]);
const ITALIC_TAGS = new Set(["I", "EM"]);
const UNDERLINE_TAGS = new Set(["U", "INS"]);

interface Marks { bold?: boolean; italic?: boolean; underline?: boolean; href?: string }

/** Walk a node, accumulating the emphasis it sits inside, and flatten it to runs. */
function collectRuns(node: Node, inherited: Marks, out: RichRun[]): void {
  if (node.nodeType === 3) {
    const text = node.textContent ?? "";
    if (text === "") return;
    const last = out[out.length - 1];
    // Merge with the previous run when the formatting is identical, so a paragraph split across
    // several text nodes does not become a dozen separate runs.
    if (last
      && Boolean(last.bold) === Boolean(inherited.bold)
      && Boolean(last.italic) === Boolean(inherited.italic)
      && Boolean(last.underline) === Boolean(inherited.underline)
      && last.href === inherited.href) {
      last.text += text;
      return;
    }
    out.push({
      text,
      ...(inherited.bold ? { bold: true } : {}),
      ...(inherited.italic ? { italic: true } : {}),
      ...(inherited.underline ? { underline: true } : {}),
      ...(inherited.href ? { href: inherited.href } : {}),
    });
    return;
  }
  if (node.nodeType !== 1) return;
  const el = node as HTMLElement;
  if (el.tagName === "BR") {
    out.push({ text: " " }); // a line separator the renderer splits on, never a raw newline
    return;
  }
  const marks: Marks = {
    ...inherited,
    ...(BOLD_TAGS.has(el.tagName) ? { bold: true } : {}),
    ...(ITALIC_TAGS.has(el.tagName) ? { italic: true } : {}),
    ...(UNDERLINE_TAGS.has(el.tagName) ? { underline: true } : {}),
    ...(el.tagName === "A" && el.getAttribute("href") ? { href: el.getAttribute("href")! } : {}),
  };
  for (const child of Array.from(el.childNodes)) collectRuns(child, marks, out);
}

function runsOf(el: HTMLElement): RichRun[] {
  const out: RichRun[] = [];
  collectRuns(el, {}, out);
  return out.filter((r) => r.text !== "");
}

const hasText = (runs: RichRun[]): boolean => runs.some((r) => r.text.trim() !== "");

/**
 * Parse editor HTML into blocks. Tables are carried through as rows and cells; anything else the
 * PDF cannot lay out (images, embeds) degrades to
 * its text rather than being dropped, so a paste never silently loses content.
 */
export function htmlToBlocks(html: string, doc?: Document): RichBlock[] {
  const parser = doc ?? new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  const root = parser.body;
  const blocks: RichBlock[] = [];

  const pushParagraph = (runs: RichRun[]): void => {
    if (hasText(runs)) blocks.push({ type: "paragraph", runs });
  };

  for (const node of Array.from(root.childNodes)) {
    if (node.nodeType === 3) {
      const text = node.textContent ?? "";
      if (text.trim()) blocks.push({ type: "paragraph", runs: [{ text }] });
      continue;
    }
    if (node.nodeType !== 1) continue;
    const el = node as HTMLElement;

    switch (el.tagName) {
      case "H1":
      case "H2": {
        const runs = runsOf(el);
        if (hasText(runs)) blocks.push({ type: "h2", runs });
        break;
      }
      case "H3":
      case "H4":
      case "H5":
      case "H6": {
        const runs = runsOf(el);
        if (hasText(runs)) blocks.push({ type: "h3", runs });
        break;
      }
      case "UL":
      case "OL": {
        const items = Array.from(el.children)
          .filter((li) => li.tagName === "LI")
          .map((li) => runsOf(li as HTMLElement))
          .filter(hasText);
        if (items.length > 0) blocks.push({ type: el.tagName === "OL" ? "numbered" : "bulleted", items });
        break;
      }
      case "TABLE": {
        /*
         * A real table, kept as rows and cells.
         *
         * The alternative, and what happened before, is that every cell of a row is concatenated into
         * one paragraph, so a pasted price list arrives as a run-on sentence. Rows are read from
         * wherever they are, which covers a table with a tbody, one without, and one with a thead.
         */
        const rowEls = Array.from(el.querySelectorAll("tr"));
        const rows = rowEls
          .map((tr) => Array.from(tr.children)
            .filter((c) => c.tagName === "TD" || c.tagName === "TH")
            .map((c) => runsOf(c as HTMLElement)))
          .filter((row) => row.length > 0);
        if (rows.length > 0) {
          const first = rowEls[0];
          const headerRow = Boolean(
            el.querySelector("thead") ??
            (first && Array.from(first.children).some((c) => c.tagName === "TH")),
          );
          blocks.push({ type: "table", rows, headerRow });
        }
        break;
      }
      case "BLOCKQUOTE":
      case "P":
      case "DIV":
        pushParagraph(runsOf(el));
        break;
      default:
        // Unknown block: keep the words rather than losing them.
        pushParagraph(runsOf(el));
    }
  }
  return blocks;
}
