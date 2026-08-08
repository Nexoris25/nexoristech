"use client";
/**
 * The row actions menu for CMS content lists: View (opens the public/editor page), Edit, Publish or
 * Unpublish depending on the current status, and Delete (with a confirm step). Publish/Unpublish/Delete
 * post to /api/cms/content; Edit is a normal link. The menu closes on outside click and Escape.
 *
 * The menu renders in a portal on document.body rather than inside the row. Every list here sits in an
 * `overflow-x-auto` wrapper, and an overflow container clips its descendants: no z-index escapes a
 * clipping ancestor, so an anchored menu was cut off at the container edge on the lower rows. A portal
 * with fixed coordinates is outside that container and cannot be clipped or stacked over.
 *
 * It flips above the button when there is not enough room below, so the last row behaves like the first,
 * and it follows the button on scroll and resize.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { MoreHorizontal, Pencil, Eye, Trash2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

export function RowActions({ id, kind, editHref, viewHref, status, back, label }: {
  id: string; kind: string; editHref: string; viewHref?: string; status: string; back: string; label?: string;
}): ReactNode {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  // Portals need the document, which does not exist during the server render.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isPublished = status === "published";

  const MENU_WIDTH = 176; // w-44
  /**
   * Position the menu against the button in viewport coordinates. Right-aligned to the button, flipped
   * above it when the space below is too small, and clamped so it can never sit off-screen on a narrow
   * viewport.
   */
  const place = useCallback((): void => {
    const b = buttonRef.current?.getBoundingClientRect();
    if (!b) return;
    const height = menuRef.current?.offsetHeight ?? 220;
    const below = window.innerHeight - b.bottom;
    const top = below < height + 12 && b.top > height + 12 ? b.top - height - 4 : b.bottom + 4;
    const left = Math.min(
      Math.max(8, b.right - MENU_WIDTH),
      Math.max(8, window.innerWidth - MENU_WIDTH - 8),
    );
    setCoords({ top, left });
  }, []);

  // Measured after the menu exists, so the flip decision uses its real height.
  useLayoutEffect(() => { if (open) place(); }, [open, confirming, place]);

  // Fixed coordinates do not follow the page, so recompute while the menu is open. Capture catches
  // scrolling in the table wrapper as well as the window.
  useEffect(() => {
    if (!open) return;
    const onMove = (): void => place();
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent): void => {
      const t = e.target as Node;
      // The menu lives on document.body now, so a click inside it is not inside `ref`.
      if (ref.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
      setConfirming(false);
    };
    const onKey = (e: KeyboardEvent): void => { if (e.key === "Escape") { setOpen(false); setConfirming(false); } };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const item = "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[0.82rem] font-500 text-slate-700 hover:bg-slate-100";
  const hidden = (name: string, value: string): ReactNode => <input type="hidden" name={name} value={value} />;

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button ref={buttonRef} type="button" aria-label={label ? `Actions for ${label}` : "Actions"} aria-haspopup="menu" aria-expanded={open}
        onClick={() => setOpen((o) => !o)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 hover:bg-slate-100">
        <MoreHorizontal size={16} />
      </button>
      {open && mounted ? createPortal(
        <div
          ref={menuRef}
          role="menu"
          style={{ position: "fixed", top: coords?.top ?? -9999, left: coords?.left ?? -9999, width: MENU_WIDTH }}
          // z-[70] clears the CMS shell's sticky header and sidebar; being in a portal means it only
          // has to beat what is on document.body.
          className="z-[70] rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
        >
          <a href={editHref} role="menuitem" className={item}><Pencil size={14} className="text-slate-500" /> Edit</a>
          {viewHref ? <a href={viewHref} target="_blank" rel="noreferrer" role="menuitem" className={item}><Eye size={14} className="text-slate-500" /> View</a> : null}
          <form action="/api/cms/content" method="post">
            {hidden("id", id)}{hidden("kind", kind)}{hidden("back", back)}
            {isPublished ? (
              <>{hidden("action", "unpublish")}<button type="submit" role="menuitem" className={item}><ArrowDownCircle size={14} className="text-slate-500" /> Unpublish</button></>
            ) : (
              <>{hidden("action", "publish")}<button type="submit" role="menuitem" className={item}><ArrowUpCircle size={14} className="text-[#15803D]" /> Publish</button></>
            )}
          </form>
          <div className="my-1 border-t border-slate-100" />
          {confirming ? (
            <form action="/api/cms/content" method="post" className="px-1 py-1">
              {hidden("id", id)}{hidden("kind", kind)}{hidden("back", back)}{hidden("action", "delete")}
              <p className="px-1.5 pb-1.5 text-[0.72rem] text-slate-500">Delete permanently?</p>
              <div className="flex gap-1.5">
                <button type="submit" className="flex-1 rounded-lg bg-[#DC2626] px-2 py-1.5 text-[0.76rem] font-600 text-white hover:bg-[#DC2626]">Delete</button>
                <button type="button" onClick={() => setConfirming(false)} className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-[0.76rem] font-600 text-slate-600 hover:bg-slate-50">Cancel</button>
              </div>
            </form>
          ) : (
            <button type="button" role="menuitem" onClick={() => setConfirming(true)} className={`${item} text-[#DC2626] hover:bg-red-50`}><Trash2 size={14} /> Delete</button>
          )}
        </div>,
        document.body,
      ) : null}
    </div>
  );
}
