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
import type { ClipboardEvent, ReactNode } from "react";
import {
  Bold, Italic, Underline, List, ListOrdered, Quote, Indent, Outdent, Link2,
  Image as ImageIcon, Table as TableIcon, Eraser, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Rows3, Columns3, Trash2, PanelTop, PanelLeft, MoreHorizontal,
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
export function RichTextEditor({ name, initialHtml, onChange, registerApi, allowImages = false, keepHeadingLevels = false }: { name: string; initialHtml?: string; onChange?: (html: string) => void; registerApi?: (api: RichTextApi) => void; allowImages?: boolean; keepHeadingLevels?: boolean }): ReactNode {
  const ref = useRef<HTMLDivElement>(null);
  const cellRef = useRef<HTMLTableCellElement | null>(null);
  const [html, setHtml] = useState(initialHtml ?? "");
  const [inTable, setInTable] = useState(false);
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
    let tag = "P";
    let foundTag = false;
    while (node && node !== ref.current) {
      if (!cell && node instanceof HTMLTableCellElement) cell = node;
      if (!foundTag && node instanceof HTMLElement && BLOCK_TAGS.has(node.tagName)) { tag = node.tagName; foundTag = true; }
      node = node.parentNode;
    }
    cellRef.current = cell;
    setInTable(Boolean(cell));
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

  const insertLink = (): void => { const url = window.prompt("Link URL", "https://"); if (url) { cmd("createLink", url); afterEdit(); } };
  /*
   * A picture from the machine, carried inside the document.
   *
   * Not a web address: a document is generated on the server and sent to a client, and an image that
   * lives at a URL is one the server would have to go and fetch, from wherever the address points.
   * Reading the file here means the picture travels with the document and nothing is fetched at all.
   */
  const insertImage = (): void => {
    if (!allowImages) { const url = window.prompt("Image URL", "https://"); if (url) { cmd("insertImage", url); afterEdit(); } return; }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/gif,image/webp";
    input.onchange = (): void => {
      const file = input.files?.[0];
      if (!file) return;
      if (file.size > 3_000_000) { window.alert("That image is larger than 3 MB. Export it smaller and try again."); return; }
      const reader = new FileReader();
      reader.onload = (): void => {
        const src = typeof reader.result === "string" ? reader.result : "";
        if (!src.startsWith("data:image/")) return;
        const figure = document.createElement("figure");
        const img = document.createElement("img");
        img.src = src;
        img.alt = file.name.replace(/\.[a-z0-9]+$/i, "");
        const caption = document.createElement("figcaption");
        caption.textContent = "Caption";
        figure.append(img, caption);
        const after = document.createElement("p");
        after.appendChild(document.createElement("br"));
        insertAtCaret(figure, after);
      };
      reader.readAsDataURL(file);
    };
    input.click();
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

  const Btn = ({ onClick, title, children }: { onClick: () => void; title: string; children: ReactNode }): ReactNode => (
    <button type="button" title={title} aria-label={title} onMouseDown={(e) => e.preventDefault()} onClick={onClick}
      className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-[#543CDA]">{children}</button>
  );
  const Sep = (): ReactNode => <span className="mx-0.5 h-5 w-px shrink-0 bg-slate-200" />;
  const selectCls = "h-8 shrink-0 cursor-pointer rounded-md border border-slate-200 bg-white px-2 text-[0.8rem] font-600 text-slate-700 focus:border-[#543CDA] focus:outline-none";

  // The twelve tools that earn their place on the toolbar, in the order writers reach for them. Every
  // remaining tool lives behind the thirteenth control, "More", so the row never overflows.
  const primary: { title: string; icon: typeof Quote; onClick: () => void }[] = [
    { title: "Bold", icon: Bold, onClick: run("bold") },
    { title: "Italic", icon: Italic, onClick: run("italic") },
    { title: "Underline", icon: Underline, onClick: run("underline") },
    { title: "Bulleted list", icon: List, onClick: run("insertUnorderedList") },
    { title: "Numbered list", icon: ListOrdered, onClick: run("insertOrderedList") },
    { title: "Align left", icon: AlignLeft, onClick: () => align("justifyLeft") },
    { title: "Align center", icon: AlignCenter, onClick: () => align("justifyCenter") },
    { title: "Align right", icon: AlignRight, onClick: () => align("justifyRight") },
    { title: "Justify", icon: AlignJustify, onClick: () => align("justifyFull") },
    { title: "Insert link", icon: Link2, onClick: insertLink },
    { title: "Quote", icon: Quote, onClick: () => setBlock("BLOCKQUOTE") },
    { title: "Insert image", icon: ImageIcon, onClick: insertImage },
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
            <Btn title={t.title} onClick={t.onClick}><t.icon size={16} /></Btn>
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
        onInput={afterEdit} onBlur={sync} onKeyUp={trackCell} onMouseUp={trackCell} onPaste={onPaste}
        className="cms-rte min-h-[min(26rem,calc(100vh-14rem))] max-h-[calc(100vh-14rem)] overflow-y-auto px-5 py-4 text-[0.92rem] leading-relaxed text-slate-800 focus:outline-none"
        data-placeholder="Start writing..." />
      <input type="hidden" name={name} value={html} />
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
