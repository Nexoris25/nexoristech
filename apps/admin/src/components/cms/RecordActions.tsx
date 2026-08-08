"use client";
/**
 * The row actions menu for the CMS's supporting records: authors, categories, departments, templates
 * and redirects.
 *
 * These lists each ended their last column with a "…" button that had no handler at all, so none of
 * these records could be edited or removed from the list, and a mistyped category stayed forever.
 * RowActions covers `cms_content`; this is the same interaction for the tables that are not content.
 *
 * Edit is a link. Delete is a native form post to /api/cms/records, which refuses a record that other
 * rows still depend on and says why, rather than orphaning them.
 */
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";

export function RecordActions({ entity, id, editHref, viewHref, back, label, readOnly = false }: {
  /** Which table this row belongs to. Must be a key of ENTITIES in the route. */
  entity: "author" | "category" | "department" | "template" | "redirect";
  id: string;
  editHref: string;
  /** An optional public page for this record. */
  viewHref?: string;
  /** Where to return after the delete, so the list keeps its filters. */
  back: string;
  /** The record's name, so the menu button and the confirmation say which row is meant. */
  label?: string;
  /** Hide Delete. For rows whose removal belongs on another screen, such as a staff account. */
  readOnly?: boolean;
}): ReactNode {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent): void => { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setConfirming(false); } };
    const onKey = (e: KeyboardEvent): void => { if (e.key === "Escape") { setOpen(false); setConfirming(false); } };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const item = "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[0.82rem] font-500 text-slate-700 hover:bg-slate-100";
  const hidden = (name: string, value: string): ReactNode => <input type="hidden" name={name} value={value} />;

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button type="button" aria-label={label ? `Actions for ${label}` : "Actions"} aria-haspopup="menu" aria-expanded={open}
        onClick={() => setOpen((o) => !o)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 hover:bg-slate-100">
        <MoreHorizontal size={16} />
      </button>
      {open ? (
        <div role="menu" className="absolute right-0 z-30 mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
          <a href={editHref} role="menuitem" className={item}><Pencil size={14} className="text-slate-500" /> Edit</a>
          {viewHref ? <a href={viewHref} target="_blank" rel="noreferrer" role="menuitem" className={item}><Eye size={14} className="text-slate-500" /> View</a> : null}
          {readOnly ? null : <div className="my-1 border-t border-slate-100" />}
          {readOnly ? null : confirming ? (
            <form action="/api/cms/records" method="post" className="px-1 py-1">
              {hidden("entity", entity)}{hidden("id", id)}{hidden("back", back)}
              <p className="px-1.5 pb-1.5 text-[0.72rem] text-slate-500">Delete permanently?</p>
              <div className="flex gap-1.5">
                <button type="submit" className="flex-1 rounded-lg bg-[#DC2626] px-2 py-1.5 text-[0.76rem] font-600 text-white hover:bg-[#B91C1C]">Delete</button>
                <button type="button" onClick={() => setConfirming(false)} className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-[0.76rem] font-600 text-slate-600 hover:bg-slate-50">Cancel</button>
              </div>
            </form>
          ) : (
            <button type="button" role="menuitem" onClick={() => setConfirming(true)} className={`${item} text-[#DC2626] hover:bg-red-50`}><Trash2 size={14} /> Delete</button>
          )}
        </div>
      ) : null}
    </div>
  );
}
