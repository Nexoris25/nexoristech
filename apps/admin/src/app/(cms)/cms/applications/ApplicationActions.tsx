"use client";
/**
 * The per-application actions: open it, or move it to a stage.
 *
 * The row ended with a "…" button that had no handler, so an application could only be read. These post
 * to /api/cms/applications, which checks the review capability — a Content Writer's move is refused by
 * the server, not merely hidden here.
 *
 * The stage an application is already in is not offered, because moving something to where it already
 * is says nothing.
 */
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { MoreHorizontal, FileText, ArrowRight, X } from "lucide-react";

const STAGES = [
  { id: "reviewed", label: "Reviewed" },
  { id: "interviewed", label: "Interviewed" },
  { id: "rejected", label: "Rejected" },
] as const;

export function ApplicationActions({ id, name, stage }: { id: string; name: string; stage: string }): ReactNode {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent): void => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent): void => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const item = "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[0.82rem] font-500 text-slate-700 hover:bg-slate-100";

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button type="button" aria-label={`Actions for ${name}`} aria-haspopup="menu" aria-expanded={open}
        onClick={() => setOpen((o) => !o)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 hover:bg-slate-100">
        <MoreHorizontal size={16} />
      </button>
      {open ? (
        <div role="menu" className="absolute right-0 z-30 mt-1 w-48 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
          <Link href={`/cms/applications/${id}`} role="menuitem" className={item} onClick={() => setOpen(false)}>
            <FileText size={14} className="text-slate-500" /> Open application
          </Link>
          <div className="my-1 border-t border-slate-100" />
          {STAGES.filter((s) => s.id !== stage).map((s) => (
            <form key={s.id} action="/api/cms/applications" method="post">
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="stage" value={s.id} />
              <input type="hidden" name="back" value="/cms/applications" />
              <button type="submit" role="menuitem"
                className={s.id === "rejected" ? `${item} text-[#B91C1C] hover:bg-red-50` : item}>
                {s.id === "rejected" ? <X size={14} /> : <ArrowRight size={14} className="text-slate-500" />}
                Move to {s.label}
              </button>
            </form>
          ))}
        </div>
      ) : null}
    </div>
  );
}
