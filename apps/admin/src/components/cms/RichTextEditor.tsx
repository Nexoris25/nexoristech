"use client";
/**
 * The one reusable rich text editor for the whole CMS (insights, legal pages, case studies, jobs, ...).
 * A contentEditable surface with a single-line toolbar. Text style (Paragraph, H1-H6) and alignment
 * (Left/Center/Right/Justify) are dropdowns; bold/italic/underline, lists, quote, indent, link, image,
 * and remove-format are icon buttons; a Symbols dropdown inserts currency and common glyphs. Tables can
 * be inserted and then grown, shrunk, and given header rows/columns from a contextual toolbar that
 * appears while the caret sits inside a table. Clean semantic HTML is written to a hidden field so the
 * public page and the search/answer engines get real, crawlable markup.
 */
import { useEffect, useRef, useState } from "react";
import type { ClipboardEvent, MouseEvent as ReactMouseEvent, ReactNode } from "react";
import {
  Bold, Italic, Underline, List, ListOrdered, Quote, Indent, Outdent, Link2,
  Image as ImageIcon, Table as TableIcon, Eraser, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Rows3, Columns3, Trash2, PanelTop, PanelLeft, MoreHorizontal, Loader2,
} from "lucide-react";
import { normaliseHtml, normalisePlainText } from "../../lib/normalise-html.js";
import { applyInlineLink } from "../../lib/inline-links.js";

function cmd(command: string, value?: string): void { document.execCommand(command, false, value); }

const HEADINGS: { label: string; tag: string }[] = [
  { label: "Paragraph", tag: "P" }, { label: "Heading 1", tag: "H1" }, { label: "Heading 2", tag: "H2" },
  { label: "Heading 3", tag: "H3" }, { label: "Heading 4", tag: "H4" }, { label: "Heading 5", tag: "H5" }, { label: "Heading 6", tag: "H6" },
];
const SYMBOLS: { g: string; name: string }[] = [
  { g: "₦", name: "Naira" }, { g: "$", name: "Dollar" }, { g: "€", name: "Euro" }, { g: "£", name: "Pound" },
  { g: "¥", name: "Yen" }, { g: "₵", name: "Cedi" }, { g: "%", name: "Percent" }, { g: "©", name: "Copyright" },
  { g: "®", name: "Registered" }, { g: "™", name: "Trademark" }, { g: "§", name: "Section" }, { g: "•", name: "Bullet" },
  { g: "→", name: "Arrow" }, { g: "×", name: "Times" }, { g: "÷", name: "Divide" }, { g: "±", name: "Plus-minus" },
  { g: "°", name: "Degree" }, { g: "…", name: "Ellipsis" }, { g: "“", name: "Open quote" }, { g: "”", name: "Close quote" },
  { g: "‘", name: "Open single" }, { g: "’", name: "Close single" }, { g: "–", name: "En dash" }, { g: "✓", name: "Check" },
];

/** A file already in the media library, as the picker needs it. */
interface LibraryItem { id: string; name: string; url: string; alt_text: string | null }

export interface RichTextApi {
  appendHtml: (html: string) => void;
  prependHtml: (html: string) => void;
  setHtml: (html: string) => void;
  /** The current body, so a suggestion can be checked against the real copy before it is offered. */
  getHtml: () => string;
  /**
   * Wrap a phrase already in the body with a link, in place. Returns false when the phrase is not
   * there, is inside a heading or an existing link, or the target is already linked from this page.
   */
  linkInline: (anchor: string, target: string) => boolean;
}

/**
 * `allowImages` lets pictures into the body: a pasted screenshot or diagram is kept, and the toolbar
 * button takes a file from the machine rather than asking for a web address. It is off by default,
 * because an Insights article's images belong in the media library where they can be given alt text
 * and served at a sensible size; a proposal's diagram has nowhere else to live and travels inside the
 * document itself.
 *
 * `keepHeadingLevels` keeps a paste's heading levels exactly as they came. Off by default, because an
 * article is published inside a page that already has an H1 and its headings are shifted down to sit
 * under it. A document has no page around it: its H1 is its title and its H2s are its sections, and
 * shifting them turned every section into a sub-heading.
 */
export function RichTextEditor({ name, initialHtml, onChange, registerApi, allowImages = false, uploadImages = false, keepHeadingLevels = false }: { name: string; initialHtml?: string; onChange?: (html: string) => void; registerApi?: (api: RichTextApi) => void; allowImages?: boolean; uploadImages?: boolean; keepHeadingLevels?: boolean }): ReactNode {
  const ref = useRef<HTMLDivElement>(null);
  const cellRef = useRef<HTMLTableCellElement | null>(null);
  const linkRef = useRef<HTMLAnchorElement | null>(null);
  const [html, setHtml] = useState(initialHtml ?? "");
  const [inTable, setInTable] = useState(false);
  const [inLink, setInLink] = useState(false);
  const [uploading, setUploading] = useState(false);
  /*
   * A file that has been uploaded but not yet placed.
   *
   * The picture used to go straight into the document with whatever name it was saved under and
   * whatever alt text the model wrote. Both are worth a second before they are committed: the name
   * is how the file will be found in the media library for the rest of its life, and the alt text is
   * the whole of what a reader who cannot see the picture gets. A generated description is a good
   * first draft and a poor last word, and the moment to correct it is while the picture is on
   * screen and the writer knows why they added it.
   */
  const [pending, setPending] = useState<{ url: string; name: string; alt: string; id?: string } | null>(null);
  /* The link being written or edited. `existing` is true when the caret was inside one already. */
  const [linkEdit, setLinkEdit] = useState<{ url: string; text: string; existing: boolean } | null>(null);
  /* Which picker is open: nothing, the choice between the two sources, or the library itself. */
  const [source, setSource] = useState<"" | "ask" | "library">("");
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [libraryBusy, setLibraryBusy] = useState(false);
  const savedRange = useRef<Range | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  // The block tag under the caret, so the style dropdown always shows what you are actually editing.
  const [blockTag, setBlockTag] = useState("P");

  useEffect(() => { if (ref.current && initialHtml) ref.current.innerHTML = initialHtml; }, [initialHtml]);

  const sync = (): void => { if (ref.current) { const v = ref.current.innerHTML; setHtml(v); onChange?.(v); } };

  // Expose imperative append/prepend so the Oge assistant can drop generated blocks into the body:
  // FAQs at the bottom (append), TL;DR at the top (prepend).
  //
  // Generated markup goes through the same normaliser as a paste. A model returns whatever shape it
  // likes — an <h1> for a FAQ heading, a <div> per answer, a "1." line meant as a list — and none of
  // that should reach the document just because it came from us rather than from a clipboard.
  useEffect(() => {
    if (!registerApi) return;
    const nodesOf = (h: string): Node[] => {
      const wrap = document.createElement("div");
      wrap.innerHTML = normaliseHtml(h);
      return Array.from(wrap.childNodes);
    };
    registerApi({
      appendHtml: (h: string) => { const el = ref.current; if (!el) return; nodesOf(h).forEach((n) => el.appendChild(n)); sync(); },
      prependHtml: (h: string) => { const el = ref.current; if (!el) return; const first = el.firstChild; nodesOf(h).forEach((n) => el.insertBefore(n, first)); sync(); },
      setHtml: (h: string) => { const el = ref.current; if (!el) return; el.innerHTML = h; sync(); },
      getHtml: () => ref.current?.innerHTML ?? "",
      // The link goes on the words themselves, in the paragraph they already sit in. Nothing is
      // appended and nothing else in the document moves.
      linkInline: (anchor: string, target: string) => {
        const el = ref.current;
        if (!el) return false;
        const r = applyInlineLink(el.innerHTML, anchor, target);
        if (!r.applied) return false;
        el.innerHTML = r.html;
        sync();
        return true;
      },
    });
    // registerApi is stable from the parent; run once.
  }, []);
  const BLOCK_TAGS = new Set(["P", "H1", "H2", "H3", "H4", "H5", "H6", "BLOCKQUOTE"]);
  /** Track the table cell and the block tag under the caret, so the toolbar reflects the caret. */
  const trackCell = (): void => {
    const sel = window.getSelection();
    let node = sel && sel.anchorNode ? (sel.anchorNode as Node) : null;
    let cell: HTMLTableCellElement | null = null;
    let link: HTMLAnchorElement | null = null;
    let tag = "P";
    let foundTag = false;
    while (node && node !== ref.current) {
      if (!cell && node instanceof HTMLTableCellElement) cell = node;
      if (!link && node instanceof HTMLAnchorElement) link = node;
      if (!foundTag && node instanceof HTMLElement && BLOCK_TAGS.has(node.tagName)) { tag = node.tagName; foundTag = true; }
      node = node.parentNode;
    }
    cellRef.current = cell;
    linkRef.current = link;
    setInTable(Boolean(cell));
    setInLink(Boolean(link));
    // Only reflect the caret when it is actually inside this editor.
    if (sel && sel.anchorNode && ref.current?.contains(sel.anchorNode)) setBlockTag(tag);
  };
  const afterEdit = (): void => { sync(); trackCell(); };

  // Clicking or arrowing through the text is a selection change, not an input event, so listen globally
  // to keep the style dropdown in step with whatever block the caret is in.
  useEffect(() => {
    const onSelChange = (): void => {
      const sel = window.getSelection();
      if (sel && sel.anchorNode && ref.current?.contains(sel.anchorNode)) trackCell();
    };
    document.addEventListener("selectionchange", onSelChange);
    return () => document.removeEventListener("selectionchange", onSelChange);
    // trackCell is stable for the life of the component.
  }, []);

  const setBlock = (tag: string): void => { cmd("formatBlock", tag); afterEdit(); };

  /**
   * Quote is a toggle, not a one-way door.
   *
   * The button only ever applied BLOCKQUOTE, so a paragraph could be quoted and never unquoted:
   * pressing it again asked the browser to make a blockquote out of a blockquote, which is a no-op.
   * Pressing it inside a quote now turns the block back into a paragraph, which is what a button
   * that looks pressed is expected to do.
   */
  const toggleQuote = (): void => setBlock(blockTag === "BLOCKQUOTE" ? "P" : "BLOCKQUOTE");
  const align = (c: string): void => { cmd(c); afterEdit(); };
  const run = (c: string) => () => { cmd(c); afterEdit(); };
  // Insert a DOM node at the caret (or append to the end if the caret is outside the editor). More
  // reliable than execCommand('insertHTML') for block content like tables.
  const insertAtCaret = (...nodes: Node[]): void => {
    const editor = ref.current; if (!editor) return;
    editor.focus();
    const sel = window.getSelection();
    if (sel && sel.rangeCount && editor.contains(sel.anchorNode)) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const frag = document.createDocumentFragment();
      nodes.forEach((n) => frag.appendChild(n));
      const last = frag.lastChild;
      range.insertNode(frag);
      if (last) { range.setStartAfter(last); range.collapse(true); sel.removeAllRanges(); sel.addRange(range); }
    } else {
      nodes.forEach((n) => editor.appendChild(n));
    }
    afterEdit();
  };

  /**
   * Everything arriving from the clipboard is normalised before it enters the document.
   *
   * Without this, a paste from Word brought its mso- styles and namespaced tags, a paste from Google
   * Docs a <span> around every word, and a paste from a chat assistant bare <div>s and 1. lines that
   * looked like a list and were not one. That markup is what the site then published.
   *
   * HTML is preferred over plain text when the clipboard carries both, because it holds the structure —
   * the headings, the lists, the table — which plain text has already thrown away.
   */
  const onPaste = (e: ClipboardEvent<HTMLDivElement>): void => {
    const clipboard = e.clipboardData;
    if (!clipboard) return;
    const html = clipboard.getData("text/html");
    const text = clipboard.getData("text/plain");
    if (!html && !text) return;

    e.preventDefault();
    // Paste brings the words, not the source page's links. See NormaliseOptions.stripLinks.
    const clean = html
      ? normaliseHtml(html, { stripLinks: true, stripImages: !allowImages, keepHeadingLevels })
      : normalisePlainText(text);
    if (!clean) return;

    // Parsed here rather than handed to execCommand('insertHTML'), which rewrites block markup and
    // would undo the structure that was just established.
    const template = document.createElement("template");
    template.innerHTML = clean;
    // A pasted table is the same object as an inserted one and gets the same class, so it picks up
    // the editor's table styling and reads the same way. The row and column tools already work on
    // it either way: they find the cell under the caret rather than looking for a marked table.
    for (const table of Array.from(template.content.querySelectorAll("table"))) {
      table.classList.add("cms-table");
    }
    insertAtCaret(...Array.from(template.content.childNodes));
  };

  /**
   * Insert, edit, or remove a link.
   *
   * `document.execCommand("createLink")` needs a selection and silently does nothing without one,
   * so the button did nothing at all unless text happened to be highlighted, and there was no way
   * to change or remove a link once made. A prompt could not have fixed that: editing needs the
   * current address in the box, and removing needs a control of its own.
   *
   * The selection is saved before the dialog opens, because opening it moves focus out of the
   * editable area and the browser forgets where the caret was.
   */
  const openLink = (): void => {
    const sel = window.getSelection();
    savedRange.current = sel && sel.rangeCount > 0 ? sel.getRangeAt(0).cloneRange() : null;
    const anchor = linkRef.current;
    if (anchor) {
      setLinkEdit({ url: anchor.getAttribute("href") ?? "", text: anchor.textContent ?? "", existing: true });
      return;
    }
    setLinkEdit({ url: "https://", text: sel ? sel.toString() : "", existing: false });
  };

  /** Put the caret back where it was before the dialog took focus. */
  const restoreRange = (): void => {
    const range = savedRange.current;
    if (!range) return;
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  };

  const applyLink = (): void => {
    const edit = linkEdit;
    if (!edit) return;
    const url = edit.url.trim();
    const text = edit.text.trim();
    setLinkEdit(null);
    if (!url) return;

    const anchor = linkRef.current;
    if (edit.existing && anchor) {
      anchor.setAttribute("href", url);
      if (text && text !== anchor.textContent) anchor.textContent = text;
      afterEdit();
      return;
    }

    ref.current?.focus();
    restoreRange();
    const sel = window.getSelection();
    const hasSelection = Boolean(sel && !sel.isCollapsed);
    if (hasSelection) {
      cmd("createLink", url);
    } else {
      // Nothing selected: the link is created from the typed text, which is what somebody pressing
      // the button with no selection is asking for.
      const a = document.createElement("a");
      a.href = url;
      a.textContent = text || url;
      insertAtCaret(a, document.createTextNode(" "));
    }
    afterEdit();
  };

  const removeLink = (): void => {
    const anchor = linkRef.current;
    setLinkEdit(null);
    if (!anchor) return;
    const parent = anchor.parentNode;
    if (!parent) return;
    while (anchor.firstChild) parent.insertBefore(anchor.firstChild, anchor);
    parent.removeChild(anchor);
    linkRef.current = null;
    setInLink(false);
    afterEdit();
  };

  /**
   * Clicking a link opens it for editing.
   *
   * Editing one meant knowing to put the caret inside it and then find the toolbar button, which
   * reads "Edit link" only once you are already there. Nobody discovers that. Clicking the words is
   * what everyone tries first, and it did nothing at all, so a wrong address was usually fixed by
   * deleting the link and writing it again.
   *
   * The anchor is taken from the click rather than from `linkRef`, because that is set from the
   * selection by `trackCell` and the selection has not necessarily caught up by the time this runs.
   */
  const onEditorClick = (event: ReactMouseEvent<HTMLDivElement>): void => {
    // A modified or middle click is the browser's own "open this link" gesture. Left alone, so an
    // editor can still follow a link to check where it goes.
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;

    const node = event.target as Node | null;
    const el = node instanceof HTMLElement ? node : (node?.parentElement ?? null);
    const anchor = el?.closest("a");
    if (!(anchor instanceof HTMLAnchorElement) || !ref.current?.contains(anchor)) return;

    // Dragging across the text is selecting it, not asking to edit the link.
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) return;

    event.preventDefault();
    linkRef.current = anchor;
    setInLink(true);
    openLink();
  };
  /*
   * A picture from the machine, carried inside the document.
   *
   * Not a web address: a document is generated on the server and sent to a client, and an image that
   * lives at a URL is one the server would have to go and fetch, from wherever the address points.
   * Reading the file here means the picture travels with the document and nothing is fetched at all.
   */
  /*
   * A picture in the body, uploaded the same way every other image on the platform is.
   *
   * This used to read the file into a data: URL and paste the whole thing into the document. That
   * is why images could not be used: the article body is stored in a database column and rendered
   * into a page, and a single photograph carried inline is a megabyte of base64 in both. It also
   * meant nothing was converted, nothing was resized, and the alt text was the filename.
   *
   * It now posts to the same endpoint the cover-image field uses, which converts to WebP with
   * sharp, caps the width, records the file in the media library and asks Oge for alt text. What
   * lands in the document is a URL and a described image.
   *
   * `allowImages` still gates it, because an agreement PDF genuinely does want the picture carried
   * inside the document rather than fetched from a URL the recipient may not be able to reach.
   */
  /**
   * Where the picture comes from.
   *
   * The button went straight to a file picker, which assumed every image is new. Most are not: a
   * logo, a chart, a headshot already lives in the media library, and re-uploading it makes a second
   * copy with its own name and its own alt text to keep in step with the first. The choice is asked
   * once, and the library is offered first because reusing what is there is the commoner case.
   */
  const chooseImage = (): void => {
    if (!uploadImages) { pickFromComputer(); return; }
    setSource("ask");
  };

  const pickFromComputer = (): void => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/gif,image/webp,image/avif";
    input.onchange = (): void => {
      const file = input.files?.[0];
      if (!file) return;
      if (uploadImages) {
        void uploadAndInsert(file);
        return;
      }
      // Carried inside the document: the PDF path, where there is no server to fetch a URL from.
      if (file.size > 3_000_000) { window.alert("That image is larger than 3 MB. Export it smaller and try again."); return; }
      const reader = new FileReader();
      reader.onload = (): void => {
        const src = typeof reader.result === "string" ? reader.result : "";
        if (!src.startsWith("data:image/")) return;
        insertFigure(src, file.name.replace(/\.[a-z0-9]+$/i, ""));
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  /** Bring in a file that is already in the library, with the name and alt text it already has. */
  const openLibrary = async (): Promise<void> => {
    setSource("library");
    setLibraryBusy(true);
    try {
      const res = await fetch("/api/cms/media/list");
      if (!res.ok) throw new Error("list");
      setLibrary((await res.json()) as LibraryItem[]);
    } catch {
      setLibrary([]);
    } finally {
      setLibraryBusy(false);
    }
  };

  /**
   * Place the reviewed picture, and keep the library in step with what was typed.
   *
   * The name and alt text are saved back to the media row as well as written onto the image, so the
   * library shows what the editor decided rather than what the upload guessed. If that save fails
   * the picture is still inserted: losing the image over a metadata write would be the worse
   * outcome, and the library can be corrected on its own screen.
   */
  const confirmPending = async (): Promise<void> => {
    const p = pending;
    if (!p) return;
    setPending(null);
    insertFigure(p.url, p.alt);
    if (!p.id) return;
    const body = new FormData();
    body.append("action", "update");
    body.append("id", p.id);
    body.append("name", p.name);
    body.append("alt_text", p.alt);
    await fetch("/api/cms/media", { method: "POST", body }).catch(() => undefined);
  };

  /** Put the picture in the document, with its alt text and a caption slot. */
  const insertFigure = (src: string, alt: string): void => {
    const figure = document.createElement("figure");
    const img = document.createElement("img");
    img.src = src;
    img.alt = alt;
    const caption = document.createElement("figcaption");
    caption.textContent = "Caption";
    figure.append(img, caption);
    const after = document.createElement("p");
    after.appendChild(document.createElement("br"));
    insertAtCaret(figure, after);
  };

  const uploadAndInsert = async (file: File): Promise<void> => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "Article images");
      const res = await fetch("/api/cms/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const problem = (await res.json().catch(() => null)) as { error?: string } | null;
        window.alert(problem?.error ? `That image could not be uploaded: ${problem.error}.` : "That image could not be uploaded.");
        return;
      }
      const done = (await res.json()) as { url: string; altText?: string; id?: string };
      // Offered for review rather than placed. Nothing reaches the document until it is confirmed.
      setPending({
        url: done.url,
        name: file.name.replace(/\.[a-z0-9]+$/i, ""),
        alt: done.altText ?? "",
        ...(done.id ? { id: done.id } : {}),
      });
    } catch {
      window.alert("That image could not be uploaded. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  };
  const insertSymbol = (g: string): void => { insertAtCaret(document.createTextNode(g)); };

  const insertTable = (): void => {
    const rows = 3, cols = 3;
    const table = document.createElement("table"); table.className = "cms-table";
    const tbody = document.createElement("tbody");
    for (let r = 0; r < rows; r++) {
      const tr = document.createElement("tr");
      for (let c = 0; c < cols; c++) { const cell = document.createElement(r === 0 ? "th" : "td"); cell.textContent = r === 0 ? "Heading" : "Cell"; tr.appendChild(cell); }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    const p = document.createElement("p"); p.appendChild(document.createElement("br"));
    insertAtCaret(table, p);
  };

  // --- Table editing (operate on the cell where the caret sits) ---
  const withCell = (fn: (cell: HTMLTableCellElement, row: HTMLTableRowElement, table: HTMLTableElement, colIndex: number) => void): void => {
    const cell = cellRef.current; if (!cell) return;
    const row = cell.parentElement as HTMLTableRowElement | null;
    const table = cell.closest("table"); if (!row || !table) return;
    fn(cell, row, table as HTMLTableElement, cell.cellIndex);
    sync();
  };
  const cellHtml = (tag: "td" | "th", text = "Cell"): string => `<${tag}>${text}</${tag}>`;
  const addRow = (dir: 1 | -1) => (): void => withCell((_cell, row) => {
    const cols = row.children.length; const nr = document.createElement("tr");
    for (let i = 0; i < cols; i++) nr.innerHTML += cellHtml("td");
    row.parentElement?.insertBefore(nr, dir === 1 ? row.nextSibling : row);
  });
  const deleteRow = (): void => withCell((_cell, row, table) => { if (table.rows.length > 1) row.remove(); });
  const addCol = (dir: 1 | -1) => (): void => withCell((_cell, _row, table, colIndex) => {
    Array.from(table.rows).forEach((r, ri) => {
      const isHead = ri === 0 && r.querySelector("th");
      const c = document.createElement(isHead ? "th" : "td"); c.textContent = isHead ? "Heading" : "Cell";
      const ref2 = r.children[colIndex + (dir === 1 ? 1 : 0)] ?? null;
      r.insertBefore(c, ref2);
    });
  });
  const deleteCol = (): void => withCell((_cell, _row, table, colIndex) => {
    if ((table.rows[0]?.children.length ?? 0) <= 1) return;
    Array.from(table.rows).forEach((r) => r.children[colIndex]?.remove());
  });
  const toggleHeaderRow = (): void => withCell((_cell, _row, table) => {
    const first = table.rows[0]; if (!first) return;
    const isHeader = Boolean(first.querySelector("th"));
    Array.from(first.children).forEach((c) => swapCell(c as HTMLTableCellElement, isHeader ? "td" : "th"));
  });
  const toggleHeaderCol = (): void => withCell((_cell, _row, table) => {
    const firstCellIsHeader = table.rows[0]?.children[0]?.tagName === "TH";
    Array.from(table.rows).forEach((r) => { const c = r.children[0] as HTMLTableCellElement | undefined; if (c) swapCell(c, firstCellIsHeader ? "td" : "th"); });
  });
  const swapCell = (c: HTMLTableCellElement, tag: "td" | "th"): void => {
    if (c.tagName.toLowerCase() === tag) return;
    const n = document.createElement(tag); n.innerHTML = c.innerHTML; c.replaceWith(n);
  };

  /* `on` marks a tool that is currently applied, so quote and link read as toggles rather than as
     buttons that may or may not have done something. */
  const Btn = ({ onClick, title, children, on = false }: { onClick: () => void; title: string; children: ReactNode; on?: boolean }): ReactNode => (
    <button type="button" title={title} aria-label={title} aria-pressed={on} onMouseDown={(e) => e.preventDefault()} onClick={onClick}
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-md hover:bg-slate-100 hover:text-[#543CDA] ${on ? "bg-[#EEEBFC] text-[#543CDA]" : "text-slate-600"}`}>{children}</button>
  );
  const Sep = (): ReactNode => <span className="mx-0.5 h-5 w-px shrink-0 bg-slate-200" />;
  const selectCls = "h-8 shrink-0 cursor-pointer rounded-md border border-slate-200 bg-white px-2 text-[0.8rem] font-600 text-slate-700 focus:border-[#543CDA] focus:outline-none";

  // The twelve tools that earn their place on the toolbar, in the order writers reach for them. Every
  // remaining tool lives behind the thirteenth control, "More", so the row never overflows.
  const primary: { title: string; icon: typeof Quote; onClick: () => void; on?: boolean }[] = [
    { title: "Bold", icon: Bold, onClick: run("bold") },
    { title: "Italic", icon: Italic, onClick: run("italic") },
    { title: "Underline", icon: Underline, onClick: run("underline") },
    { title: "Bulleted list", icon: List, onClick: run("insertUnorderedList") },
    { title: "Numbered list", icon: ListOrdered, onClick: run("insertOrderedList") },
    { title: "Align left", icon: AlignLeft, onClick: () => align("justifyLeft") },
    { title: "Align center", icon: AlignCenter, onClick: () => align("justifyCenter") },
    { title: "Align right", icon: AlignRight, onClick: () => align("justifyRight") },
    { title: "Justify", icon: AlignJustify, onClick: () => align("justifyFull") },
    { title: inLink ? "Edit link" : "Insert link", icon: Link2, onClick: openLink, on: inLink },
    { title: blockTag === "BLOCKQUOTE" ? "Remove quote" : "Quote", icon: Quote, onClick: toggleQuote, on: blockTag === "BLOCKQUOTE" },
    {
      title: uploading ? "Uploading image…" : "Insert image",
      icon: uploading ? Loader2 : ImageIcon,
      onClick: () => { if (!uploading) chooseImage(); },
    },
  ];
  const secondary: { title: string; icon: typeof Quote; onClick: () => void }[] = [
    { title: "Insert table", icon: TableIcon, onClick: insertTable },
    { title: "Indent", icon: Indent, onClick: run("indent") },
    { title: "Outdent", icon: Outdent, onClick: run("outdent") },
    { title: "Remove formatting", icon: Eraser, onClick: run("removeFormat") },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-0.5 rounded-t-xl border-b border-slate-200 bg-slate-50 px-2 py-1.5">
        {/* The style dropdown mirrors the caret: click an H3 and it reads Heading 3. */}
        <select aria-label="Text style" value={blockTag} onMouseDown={(e) => e.stopPropagation()} onChange={(e) => setBlock(e.target.value)} className={`mr-1 ${selectCls}`}>
          {HEADINGS.map((h) => <option key={h.tag} value={h.tag}>{h.label}</option>)}
          {/* Quote is a block too, so the caret can legitimately sit in one. */}
          <option value="BLOCKQUOTE">Quote</option>
        </select>
        <Sep />

        {/* The twelve tools, always visible. Alignment is four icons, never a dropdown. */}
        {primary.map((t, i) => (
          <span key={t.title} className="contents">
            {i === 3 || i === 5 || i === 9 ? <Sep /> : null}
            <Btn title={t.title} onClick={t.onClick} on={t.on ?? false}><t.icon size={16} /></Btn>
          </span>
        ))}

        {/* The thirteenth control: everything else. */}
        <Sep />
        <div className="relative shrink-0">
          <button type="button" title="More tools" aria-label="More tools" aria-haspopup="menu" aria-expanded={moreOpen}
            onMouseDown={(e) => e.preventDefault()} onClick={() => setMoreOpen((v) => !v)}
            className={`grid h-8 w-8 place-items-center rounded-md hover:bg-slate-100 hover:text-[#543CDA] ${moreOpen ? "bg-[#EEEBFC] text-[#543CDA]" : "text-slate-600"}`}><MoreHorizontal size={16} /></button>
          {moreOpen ? (
            <>
              <button type="button" aria-label="Close menu" className="fixed inset-0 z-20 cursor-default" onMouseDown={(e) => e.preventDefault()} onClick={() => setMoreOpen(false)} />
              <div role="menu" className="absolute right-0 top-full z-30 mt-1 w-[15rem] max-w-[calc(100vw-2rem)] rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
                <p className="mb-1 text-[0.66rem] font-600 uppercase tracking-wide text-slate-500">Tools</p>
                <div className="flex flex-wrap gap-1">
                  {secondary.map((t) => <button key={t.title} type="button" title={t.title} aria-label={t.title} onMouseDown={(e) => e.preventDefault()} onClick={() => { t.onClick(); setMoreOpen(false); }} className="grid h-8 w-8 place-items-center rounded-md text-slate-600 hover:bg-[#EEEBFC] hover:text-[#543CDA]"><t.icon size={16} /></button>)}
                </div>
                <p className="mb-1 mt-2 text-[0.66rem] font-600 uppercase tracking-wide text-slate-500">Symbols</p>
                <div className="grid grid-cols-6 gap-1">
                  {SYMBOLS.map((s, i) => <button key={`${s.g}-${i}`} type="button" title={s.name} onMouseDown={(e) => e.preventDefault()} onClick={() => { insertSymbol(s.g); setMoreOpen(false); }} className="grid h-7 place-items-center rounded-md text-[0.95rem] text-slate-700 hover:bg-[#EEEBFC] hover:text-[#543CDA]">{s.g}</button>)}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {inTable ? (
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-[#F4F1FD] px-2 py-1.5 text-[0.72rem] font-600 text-[#543CDA]">
          <span className="mr-1 shrink-0 text-[0.68rem] uppercase tracking-wide text-slate-500">Table</span>
          <TBtn onClick={addRow(1)} icon={Rows3} title="Add row below" />
          <TBtn onClick={addRow(-1)} icon={Rows3} title="Add row above" flip />
          <TBtn onClick={deleteRow} icon={Trash2} title="Delete row" />
          <Sep />
          <TBtn onClick={addCol(1)} icon={Columns3} title="Add column right" />
          <TBtn onClick={addCol(-1)} icon={Columns3} title="Add column left" flip />
          <TBtn onClick={deleteCol} icon={Trash2} title="Delete column" />
          <Sep />
          <TBtn onClick={toggleHeaderRow} icon={PanelTop} title="Toggle header row" label="Header row" />
          <TBtn onClick={toggleHeaderCol} icon={PanelLeft} title="Toggle header column" label="Header column" />
        </div>
      ) : null}

      {/* The writing surface scrolls inside itself, and its minimum never exceeds its maximum.
          A flat 420px minimum against a viewport-relative maximum meant that on a short screen the
          minimum won and the cap stopped working, which is exactly where it was needed most.
          It had a minimum height and no maximum, so it grew with every paragraph: the toolbar rose
          away up the page, the editor pushed everything below it down, and on a long article the
          controls were off screen exactly when they were needed. Capping the height against the
          viewport keeps the toolbar and the surrounding form still while the text moves. */}
      <div ref={ref} contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true"
        onInput={afterEdit} onBlur={sync} onKeyUp={trackCell} onMouseUp={trackCell} onClick={onEditorClick} onPaste={onPaste}
        className="cms-rte min-h-[min(26rem,calc(100vh-14rem))] max-h-[calc(100vh-14rem)] overflow-y-auto px-5 py-4 text-[0.92rem] leading-relaxed text-slate-800 focus:outline-none"
        data-placeholder="Start writing..." />
      <input type="hidden" name={name} value={html} />

      {source ? (
        <div className="fixed inset-0 z-[200] grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Add an image">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-[1rem] font-700 text-slate-900">Add an image</h2>
              <button type="button" onClick={() => setSource("")} aria-label="Close" className="text-slate-400 hover:text-slate-700">&times;</button>
            </div>

            {source === "ask" ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {/* The library first: reusing a file already here is the commoner case, and a second
                    copy of the same picture is a second name and a second alt text to keep in step. */}
                <button type="button" onClick={() => void openLibrary()}
                  className="rounded-xl border border-slate-200 p-4 text-left transition-colors hover:border-[#543CDA] hover:bg-[#F8F7FE]">
                  <span className="block text-[0.9rem] font-700 text-slate-900">Media Library</span>
                  <span className="mt-1 block text-[0.8rem] text-slate-500">
                    A picture already uploaded, with the name and alt text it already has.
                  </span>
                </button>
                <button type="button" onClick={() => { setSource(""); pickFromComputer(); }}
                  className="rounded-xl border border-slate-200 p-4 text-left transition-colors hover:border-[#543CDA] hover:bg-[#F8F7FE]">
                  <span className="block text-[0.9rem] font-700 text-slate-900">My computer</span>
                  <span className="mt-1 block text-[0.8rem] text-slate-500">
                    Upload a new file. It is converted to WebP and described before it is placed.
                  </span>
                </button>
              </div>
            ) : (
              <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
                {libraryBusy ? (
                  <p className="py-10 text-center text-[0.85rem] text-slate-500">Loading the library…</p>
                ) : library.length === 0 ? (
                  <p className="py-10 text-center text-[0.85rem] text-slate-500">
                    Nothing in the library yet. Upload from your computer instead.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {library.map((m) => (
                      <button key={m.id} type="button"
                        onClick={() => { setSource(""); insertFigure(m.url, m.alt_text ?? ""); }}
                        className="overflow-hidden rounded-lg border border-slate-200 text-left transition-shadow hover:border-[#543CDA] hover:shadow-md">
                        <span className="block aspect-[4/3] w-full overflow-hidden bg-slate-50">
                          <img src={m.url} alt={m.alt_text ?? ""} className="h-full w-full object-cover" />
                        </span>
                        <span className="block truncate px-2 py-1.5 text-[0.74rem] font-600 text-slate-700" title={m.name}>{m.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                <button type="button" onClick={() => setSource("ask")} className="mt-3 text-[0.8rem] font-600 text-[#543CDA] hover:underline">
                  &larr; Back
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {linkEdit ? (
        <div className="fixed inset-0 z-[200] grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label={linkEdit.existing ? "Edit link" : "Insert link"}>
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <h2 className="text-[1rem] font-700 text-slate-900">{linkEdit.existing ? "Edit link" : "Insert link"}</h2>
            <label className="mt-4 flex flex-col gap-1.5">
              <span className="text-[0.78rem] font-600 text-slate-700">Address</span>
              <input
                autoFocus
                value={linkEdit.url}
                onChange={(e) => setLinkEdit({ ...linkEdit, url: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyLink(); } }}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[0.85rem] focus:border-[#543CDA] focus:outline-none"
              />
              <span className="text-[0.74rem] text-slate-500">
                A path such as /services links within this site; a full address links out.
              </span>
            </label>
            <label className="mt-3 flex flex-col gap-1.5">
              <span className="text-[0.78rem] font-600 text-slate-700">Text</span>
              <input
                value={linkEdit.text}
                onChange={(e) => setLinkEdit({ ...linkEdit, text: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyLink(); } }}
                placeholder="The words the reader clicks"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[0.85rem] focus:border-[#543CDA] focus:outline-none"
              />
            </label>
            <div className="mt-4 flex items-center justify-between gap-2">
              {linkEdit.existing ? (
                <button type="button" onClick={removeLink}
                  className="rounded-lg border border-[#FCA5A5] px-4 py-2 text-[0.83rem] font-600 text-[#B91C1C] hover:bg-red-50">
                  Remove link
                </button>
              ) : <span />}
              <span className="flex gap-2">
                <button type="button" onClick={() => setLinkEdit(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-[0.83rem] font-600 text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="button" onClick={applyLink}
                  className="rounded-lg bg-[#543CDA] px-5 py-2 text-[0.83rem] font-600 text-white hover:bg-[#4330B8]">
                  {linkEdit.existing ? "Save" : "Insert"}
                </button>
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Review before the picture is placed.
          The file is already uploaded and converted at this point - what is being confirmed is how
          it will be named in the library and what it will say to somebody who cannot see it. */}
      {pending ? (
        <div className="fixed inset-0 z-[200] grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Add image">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <h2 className="text-[1rem] font-700 text-slate-900">Add image</h2>
            <img src={pending.url} alt={pending.alt} className="mt-3 max-h-52 w-full rounded-lg object-contain" />
            <label className="mt-4 flex flex-col gap-1.5">
              <span className="text-[0.78rem] font-600 text-slate-700">File name</span>
              <input
                value={pending.name}
                onChange={(e) => setPending({ ...pending, name: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[0.85rem] focus:border-[#543CDA] focus:outline-none"
              />
              <span className="text-[0.74rem] text-slate-500">How this file is listed in the media library.</span>
            </label>
            <label className="mt-3 flex flex-col gap-1.5">
              <span className="text-[0.78rem] font-600 text-slate-700">Alt text</span>
              <textarea
                rows={3}
                value={pending.alt}
                onChange={(e) => setPending({ ...pending, alt: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[0.85rem] focus:border-[#543CDA] focus:outline-none"
              />
              <span className="text-[0.74rem] text-slate-500">
                Drafted by Oge from the picture itself. Describe what it shows and why it is here.
              </span>
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setPending(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-[0.83rem] font-600 text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button type="button" onClick={() => void confirmPending()}
                className="rounded-lg bg-[#543CDA] px-5 py-2 text-[0.83rem] font-600 text-white hover:bg-[#4330B8]">
                Insert image
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TBtn({ onClick, icon: Icon, title, label, flip }: { onClick: () => void; icon: typeof Rows3; title: string; label?: string; flip?: boolean }): ReactNode {
  return (
    <button type="button" title={title} aria-label={title} onMouseDown={(e) => e.preventDefault()} onClick={onClick}
      className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md border border-[#543CDA]/20 bg-white px-2 hover:bg-[#EEEBFC]">
      <Icon size={13} className={flip ? "-scale-y-100" : ""} />{label ? <span>{label}</span> : null}
    </button>
  );
}
