/**
 * Convert the rich text editor's HTML into the RichBlock AST the PDF renders.
 *
 * The CMS editor (the one Insights uses) emits HTML, which is the right thing for it to store. The PDF
 * cannot lay out arbitrary HTML, so it renders a controlled subset instead: headings, paragraphs,
 * tables, bulleted or numbered lists at any depth, and pasted outlines such as a sitemap, each made of
 * runs that may be bold, italic, underlined, or a link.
 *
 * Emphasis is read from the tags rather than from computed styles, because this runs against parsed
 * HTML where nothing has been laid out and `getComputedStyle` would report defaults for everything.
 * The editor writes semantic tags, so the tags are the reliable signal.
 *
 * Two things are decided here rather than in the renderers, because only here is the source visible:
 * the marker against each list item, so the pasted text's own numbering survives, and whether a block
 * of indented lines is an outline, so a sitemap comes out as a structure instead of prose.
 */
import type { RichBlock, RichRun } from "./types.js";

const BOLD_TAGS = new Set(["B", "STRONG"]);
const ITALIC_TAGS = new Set(["I", "EM"]);
const UNDERLINE_TAGS = new Set(["U", "INS"]);

/**
 * The marker for a deliberate line break.
 *
 * Not a newline, because a newline in the source is usually not a break at all: HTML is written with
 * its tags on separate lines, so a list item routinely arrives with a newline and four spaces
 * trailing it. The two have to be told apart, because one must survive into the PDF and the other
 * must be collapsed, and a raw newline reaching a single <Text> crashes the text engine outright. A
 * character that cannot occur in real copy separates them cleanly.
 */
const BREAK = "\u0000";

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
    out.push({ text: BREAK });
    return;
  }
  // A nested list inside a list item is collected by the list walker, not swept into the item's text.
  if (el.tagName === "UL" || el.tagName === "OL") return;
  const marks: Marks = {
    ...inherited,
    ...(BOLD_TAGS.has(el.tagName) ? { bold: true } : {}),
    ...(ITALIC_TAGS.has(el.tagName) ? { italic: true } : {}),
    ...(UNDERLINE_TAGS.has(el.tagName) ? { underline: true } : {}),
    ...(el.tagName === "A" && el.getAttribute("href") ? { href: el.getAttribute("href")! } : {}),
  };
  for (const child of Array.from(el.childNodes)) collectRuns(child, marks, out);
}

/**
 * The runs of an element, with the source's own whitespace resolved.
 *
 * Preformatted text turns its newlines into breaks, because there the lines are the content.
 * Everywhere else a newline is only how the HTML was typed, and is collapsed to a single space; an
 * explicit <br> is the one thing that survives as a break.
 */
function runsOf(el: HTMLElement, preformatted = false): RichRun[] {
  const out: RichRun[] = [];
  collectRuns(el, {}, out);
  return out
    .map((r) => ({
      ...r,
      text: preformatted
        ? r.text.replace(/\r\n?|\n/g, BREAK)
        : r.text.replace(/[ \t]*[\r\n]+[ \t]*/g, " "),
    }))
    .filter((r) => r.text !== "");
}

const hasText = (runs: RichRun[]): boolean => runs.some((r) => r.text.trim() !== "");

/** Split runs at the break markers, so a paragraph that had line breaks keeps them as lines. */
function toLines(runs: RichRun[]): RichRun[][] {
  const lines: RichRun[][] = [[]];
  for (const run of runs) {
    if (!run.text.includes(BREAK)) {
      lines[lines.length - 1]!.push(run);
      continue;
    }
    const pieces = run.text.split(BREAK);
    pieces.forEach((piece, i) => {
      if (i > 0) lines.push([]);
      if (piece !== "") lines[lines.length - 1]!.push({ ...run, text: piece });
    });
  }
  return lines;
}

/** The flattened form: every line joined by a single space, which is what plain copy wants. */
function flatten(lines: RichRun[][]): RichRun[] {
  const out: RichRun[] = [];
  lines.forEach((line, i) => {
    if (i > 0 && out.length > 0) out.push({ text: " " });
    out.push(...line);
  });
  return out;
}

const plain = (runs: RichRun[]): string => runs.map((r) => r.text).join("");

/* ------------------------------- list markers ------------------------------- */

const ALPHA = "abcdefghijklmnopqrstuvwxyz";
const ROMAN: [number, string][] = [
  [10, "x"], [9, "ix"], [5, "v"], [4, "iv"], [1, "i"],
];

function roman(n: number): string {
  let value = n;
  let out = "";
  for (const [amount, numeral] of ROMAN) {
    while (value >= amount) {
      out += numeral;
      value -= amount;
    }
  }
  return out || String(n);
}

/**
 * The marker for an ordered item at a given depth, in the convention every legal and technical
 * document uses: 1., then a., then i. `type` on the list overrides it, because a drafter who set one
 * meant it.
 */
function orderedMarker(index: number, level: number, type: string | null): string {
  const style = type ?? ["1", "a", "i"][Math.min(level, 2)]!;
  if (style === "a") return `${ALPHA[(index - 1) % 26]}.`;
  if (style === "A") return `${ALPHA[(index - 1) % 26]!.toUpperCase()}.`;
  if (style === "i") return `${roman(index)}.`;
  if (style === "I") return `${roman(index).toUpperCase()}.`;
  return `${index}.`;
}

/** Bullets by depth, for a list that expresses no preference. Only characters the fonts can draw. */
const BULLETS = ["•", "-", "·"];

/**
 * The bullet a list asks for, when it asks for one.
 *
 * Editors record the choice as a list-style-type, either in the inline style or in the type
 * attribute, and a writer who set it meant it. Poppins has no glyph for the hollow circle or the
 * filled square, so those become the nearest mark it can actually draw rather than being requested
 * and then silently dropped by the font fold, which would leave the item with no bullet at all.
 */
const LIST_STYLE_BULLET: Record<string, string> = {
  disc: "•",
  circle: "·",
  square: "-",
  none: " ",
};

function declaredBullet(el: HTMLElement): string | undefined {
  const declared = (
    /list-style-type\s*:\s*([a-z-]+)/i.exec(el.getAttribute("style") ?? "")?.[1] ??
    el.getAttribute("type") ??
    ""
  ).toLowerCase();
  return LIST_STYLE_BULLET[declared];
}

/**
 * The marker a line writes for itself.
 *
 * Copy pasted from a document that was not written in this editor arrives as plain paragraphs with
 * the bullets typed into the text: "• Discovery report", "- Staging environment", "(a) Notices".
 * Those are the writer's own pattern, and they were being printed as ordinary sentences that happen
 * to start with a dash. Recognising them turns the run back into a list, keeping the exact mark that
 * was typed rather than substituting the house one.
 */
const MANUAL_MARKER = /^\s*([•‣◦▪▫⁃·*+–—-]|\(?[0-9]{1,2}[.)]|\(?[a-z][.)]|\(?[ivx]{1,4}[.)])\s+(?=\S)/i;

/** What that line's marker and text are, or nothing if it carries no marker. */
function manualMarker(text: string): { marker: string; rest: string } | undefined {
  const match = MANUAL_MARKER.exec(text);
  if (!match) return undefined;
  return { marker: match[1]!.trim(), rest: text.slice(match[0].length) };
}

/**
 * Read a list, and the lists inside it, into flat items that each remember their depth.
 *
 * Depth rather than nesting because the renderer lays out a column of rows: it needs to know how far
 * to indent each one, not to walk a tree. Numbering starts where the source says it does, so an
 * `<ol start="7">` continues at seven instead of silently restarting at one.
 */
function readList(el: HTMLElement, level: number, out: { runs: RichRun[]; level: number; marker: string }[]): void {
  const ordered = el.tagName === "OL";
  const startAttr = Number.parseInt(el.getAttribute("start") ?? "", 10);
  let index = Number.isFinite(startAttr) ? startAttr : 1;
  const type = el.getAttribute("type");
  const bullet = declaredBullet(el) ?? BULLETS[Math.min(level, BULLETS.length - 1)]!;

  for (const li of Array.from(el.children)) {
    if (li.tagName !== "LI") continue;
    const item = li as HTMLElement;
    const runs = runsOf(item);
    if (hasText(runs)) {
      out.push({ runs, level, marker: ordered ? orderedMarker(index, level, type) : bullet });
      index += 1;
    }
    for (const child of Array.from(item.children)) {
      if (child.tagName === "UL" || child.tagName === "OL") readList(child as HTMLElement, level + 1, out);
    }
  }
}

/** Whether a marker counts up or just marks. Two lines only belong together if they agree on that. */
const markerFamily = (marker: string): "ordered" | "bullet" =>
  /[0-9a-z]/i.test(marker) ? "ordered" : "bullet";

/** Strip a line's own marker from its runs, leaving the words. */
function withoutMarker(line: RichRun[]): RichRun[] {
  const [first, ...rest] = line;
  if (!first) return line;
  const found = manualMarker(first.text);
  if (!found) return line;
  return [{ ...first, text: found.rest }, ...rest].filter((r) => r.text !== "");
}

/**
 * Build a list out of lines that were typed as one, keeping each line's own mark.
 *
 * A second bullet character inside the same run reads as a sub-level, which is how people write
 * nested lists by hand: "•" for the point and "–" or "◦" for what hangs off it.
 */
function manualList(lines: RichRun[][], markers: string[]): RichBlock {
  const top = markers[0]!;
  const ordered = markerFamily(top) === "ordered";
  return {
    type: ordered ? "numbered" : "bulleted",
    items: lines.map(withoutMarker),
    // Only for bullets: a numbered list's markers differ from each other by definition, and reading
    // that as depth indented every item after the first.
    itemLevels: markers.map((m) => (ordered || m === top ? 0 : 1)),
    itemMarkers: markers,
  };
}

/**
 * A picture, if it is one the document can carry.
 *
 * Only a base64 image travels. A remote address would mean the renderer fetching whatever address a
 * document happens to contain, from the server, which is not a thing a document generator should be
 * able to do for you. When the picture cannot come, its caption or alt text still does: an
 * illustration that vanishes without trace is worse than one whose absence is stated.
 */
function imageBlock(img: HTMLElement, caption?: RichRun[]): RichBlock | null {
  const src = img.getAttribute("src") ?? "";
  const alt = (img.getAttribute("alt") ?? "").trim();
  const words = caption && hasText(caption) ? caption : alt ? [{ text: alt }] : undefined;
  const embeddable = /^data:image\/(png|jpe?g|gif|webp);base64,/i.test(src);
  // Nothing to show and nothing to say about it: an empty frame helps no one.
  if (!embeddable && !words) return null;
  return {
    type: "image",
    ...(embeddable ? { src } : {}),
    ...(words ? { caption: words } : {}),
  };
}

/* --------------------------------- outlines --------------------------------- */

/**
 * The characters a pasted tree is drawn with, and the widths one level of indentation takes.
 *
 * A sitemap or an information architecture is nearly always pasted as an ASCII tree or as indented
 * lines. Neither survives being treated as prose: the connectors are not in the embedded fonts and
 * would be dropped, and the indentation is whitespace that a text engine is free to collapse. So the
 * shape is read off the characters here and carried as structure instead, which is the only way to
 * reproduce it exactly.
 */
const TREE_PREFIX = /^[\s│├└─┈┊|`+\-*>]*[│├└─|`+]+[\s─┈-]*/;
const TREE_GLYPHS = /[│├└─┈┊]/;

/** How deep a line sits: the width of what precedes its label, in units of two spaces. */
function outlineLevel(line: string): number {
  const prefix = TREE_PREFIX.exec(line)?.[0] ?? /^\s*/.exec(line)![0];
  // Tabs are worth two spaces, which is the shallowest reading and so the safest.
  const width = prefix.replace(/\t/g, "  ").length;
  return Math.min(6, Math.floor(width / 2));
}

function stripOutlinePrefix(line: string): string {
  return line.replace(TREE_PREFIX, "").replace(/^\s+/, "");
}

/**
 * Whether a run of lines is an outline rather than a paragraph that happened to wrap.
 *
 * Two signals, either of which is enough: the connector glyphs of an ASCII tree, or several lines
 * that are indented under an unindented one. A pair of lines is not evidence, so it takes three.
 */
function looksLikeOutline(lines: string[]): boolean {
  const filled = lines.filter((l) => l.trim() !== "");
  if (filled.length < 3) return false;
  if (filled.some((l) => TREE_GLYPHS.test(l))) return true;
  const indented = filled.filter((l) => /^(?: {2,}|\t)/.test(l)).length;
  return indented >= 2 && indented < filled.length;
}

/** Turn outline lines into items that remember their depth. */
function toOutline(lines: RichRun[][]): RichBlock {
  const kept = lines.filter((line) => plain(line).trim() !== "");
  const items: RichRun[][] = [];
  const itemLevels: number[] = [];
  for (const line of kept) {
    const text = plain(line);
    itemLevels.push(outlineLevel(text));
    // The prefix is stripped from the first run only; it is always at the start of the line.
    const [first, ...rest] = line;
    const head = first ? [{ ...first, text: stripOutlinePrefix(first.text) }] : [];
    items.push([...head, ...rest].filter((r) => r.text !== ""));
  }
  return { type: "tree", items, itemLevels };
}

/**
 * Build a paragraph, an outline, or several paragraphs, depending on what the lines turn out to be.
 *
 * A single `<p>` or `<pre>` carrying line breaks can be any of the three, and which one it is can
 * only be told from the text.
 */
function blocksFromLines(runs: RichRun[], preformatted: boolean): RichBlock[] {
  if (!hasText(runs)) return [];
  const lines = toLines(runs);
  if (lines.length === 1) return [{ type: "paragraph", runs }];
  if (looksLikeOutline(lines.map(plain))) return [toOutline(lines)];
  /*
   * A list typed inside one paragraph, its bullets in the text and its items separated by breaks.
   * Two marked lines is a list; one is a sentence that happens to open with a dash.
   */
  const filled = lines.filter((l) => plain(l).trim() !== "");
  const marks = filled.map((l) => manualMarker(plain(l))?.marker);
  /*
   * The marked lines are usually the tail of the paragraph, introduced by an unmarked line: "The
   * following are in scope:" and then the points. So the list is taken from the longest run of marked
   * lines at the end, and whatever leads into it stays the sentence it is.
   */
  let start = filled.length;
  while (start > 0 && marks[start - 1] !== undefined
    && markerFamily(marks[start - 1]!) === markerFamily(marks[filled.length - 1]!)) start -= 1;
  if (filled.length - start > 1) {
    const list = manualList(filled.slice(start), marks.slice(start) as string[]);
    const lead = filled.slice(0, start);
    return lead.length > 0 ? [{ type: "paragraph", runs: flatten(lead) }, list] : [list];
  }
  // Preformatted text keeps its lines; ordinary copy that merely wrapped is joined back up.
  if (preformatted) {
    const kept = lines.filter((l) => l.length > 0);
    return [{ type: "paragraph", runs: flatten(kept), lines: kept }];
  }
  return [{ type: "paragraph", runs: flatten(lines), lines }];
}

/**
 * Parse editor HTML into blocks. Tables are carried through as rows and cells; anything else the
 * PDF cannot lay out (images, embeds) degrades to its text rather than being dropped, so a paste
 * never silently loses content.
 */
export function htmlToBlocks(html: string, doc?: Document): RichBlock[] {
  const parser = doc ?? new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  const root = parser.body;
  const blocks: RichBlock[] = [];

  const pushParagraph = (runs: RichRun[], preformatted = false): void => {
    blocks.push(...blocksFromLines(runs, preformatted));
  };

  /** The tags that carry a block of their own and so must be read rather than flattened. */
  const BLOCK_TAGS = new Set([
    "P", "DIV", "UL", "OL", "TABLE", "PRE", "BLOCKQUOTE", "H1", "H2", "H3", "H4", "H5", "H6",
    // A picture inside a paragraph is the usual shape of a pasted diagram, so a wrapper holding one
    // is read through rather than flattened to the text it does not have.
    "FIGURE", "IMG",
  ]);

  const readNode = (node: Node): void => {
    if (node.nodeType === 3) {
      const text = node.textContent ?? "";
      if (text.trim()) blocks.push({ type: "paragraph", runs: [{ text }] });
      return;
    }
    if (node.nodeType !== 1) return;
    const el = node as HTMLElement;

    switch (el.tagName) {
      case "H1":
      case "H2":
      case "H3":
      case "H4":
      case "H5":
      case "H6": {
        /*
         * The level as written. h5 and h6 are read as h4: four levels is as many as a document of
         * this kind can show apart, and pretending to more would mean two levels set identically.
         */
        const runs = runsOf(el);
        const level = Math.min(4, Number.parseInt(el.tagName.slice(1), 10));
        if (hasText(runs)) blocks.push({ type: `h${level}` as RichBlock["type"], runs: flatten(toLines(runs)) });
        break;
      }
      case "UL":
      case "OL": {
        const read: { runs: RichRun[]; level: number; marker: string }[] = [];
        readList(el, 0, read);
        if (read.length > 0) {
          blocks.push({
            type: el.tagName === "OL" ? "numbered" : "bulleted",
            items: read.map((i) => i.runs),
            itemLevels: read.map((i) => i.level),
            itemMarkers: read.map((i) => i.marker),
          });
        }
        break;
      }
      case "PRE": {
        /*
         * Preformatted text: the lines are the content.
         *
         * This is where a pasted sitemap most often arrives. Its newlines come through the text node
         * itself rather than as <br>, so they are turned into the same break markers before the lines
         * are read.
         */
        pushParagraph(runsOf(el, true), true);
        break;
      }
      case "FIGURE": {
        /*
         * A figure: the picture and the words under it, kept together.
         *
         * A pasted diagram usually arrives wrapped this way, and the caption is part of the diagram —
         * an architecture drawing whose caption has floated three paragraphs away explains nothing.
         */
        const img = el.querySelector("img");
        const caption = el.querySelector("figcaption");
        const figure = img ? imageBlock(img as HTMLElement, caption ? runsOf(caption as HTMLElement) : undefined) : null;
        if (figure) {
          blocks.push(figure);
        } else if (!img) {
          for (const child of Array.from(el.childNodes)) readNode(child);
        }
        break;
      }
      case "IMG": {
        const picture = imageBlock(el);
        if (picture) blocks.push(picture);
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
            .map((c) => flatten(toLines(runsOf(c as HTMLElement)))))
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
      default: {
        /*
         * A wrapper is read through, not flattened.
         *
         * Editors wrap content in divs freely, and a list or a table inside one used to be swept up
         * as loose text: the very failure that made a pasted table read as a sentence, one level in.
         * If this element contains blocks, each is read on its own terms; only when it contains none
         * is it a paragraph.
         */
        const children = Array.from(el.children);
        if (children.some((c) => BLOCK_TAGS.has(c.tagName))) {
          for (const child of Array.from(el.childNodes)) readNode(child);
        } else {
          pushParagraph(runsOf(el));
        }
      }
    }
  };

  for (const node of Array.from(root.childNodes)) readNode(node);
  return foldTypedLists(blocks);
}

/**
 * Fold a run of paragraphs that were each typed as a bullet back into a single list.
 *
 * Copy pasted from Word or from an email arrives this way: one paragraph per point, the bullet
 * character typed into the text. Left alone, each prints as a sentence beginning with a dash, flush
 * with the margin and with no relationship to the ones around it. Folded, it is the list the writer
 * wrote, with the marks they chose.
 *
 * It takes at least two to be a list. A lone paragraph opening with "1." is a sentence, and turning
 * it into a one-item list would indent something the writer meant to sit flush.
 */
function foldTypedLists(blocks: RichBlock[]): RichBlock[] {
  const out: RichBlock[] = [];
  let run: { block: RichBlock; marker: string }[] = [];

  const flush = (): void => {
    if (run.length > 1) {
      out.push(manualList(run.map((r) => r.block.runs ?? []), run.map((r) => r.marker)));
    } else {
      for (const item of run) out.push(item.block);
    }
    run = [];
  };

  for (const block of blocks) {
    const marker = block.type === "paragraph" && !block.lines
      ? manualMarker(plain(block.runs ?? []))?.marker
      : undefined;
    if (marker === undefined) {
      flush();
      out.push(block);
      continue;
    }
    // A run holds together only while the marks agree on what kind of list this is.
    if (run.length > 0 && markerFamily(run[0]!.marker) !== markerFamily(marker)) flush();
    run.push({ block, marker });
  }
  flush();
  return out;
}
