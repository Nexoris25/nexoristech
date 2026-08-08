"use client";
/**
 * The per-proposal actions: approve it into a draft page, or reject it.
 *
 * The row ended with a "…" button that had no handler, while /api/cms/proposals already accepted both
 * actions — the endpoint existed and nothing called it. A proposal that has already been decided shows
 * the remaining action only, so approving something twice is not offered.
 */
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { MoreHorizontal, Check, X, FileText } from "lucide-react";

export function ProposalActions({ id, keyword, status }: { id: string; keyword: string; status: string }): ReactNode {
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
      <button type="button" aria-label={`Actions for ${keyword}`} aria-haspopup="menu" aria-expanded={open}
        onClick={() => setOpen((o) => !o)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 hover:bg-slate-100">
        <MoreHorizontal size={16} />
      </button>
      {open ? (
        <div role="menu" className="absolute right-0 z-30 mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
          <Link href={`/cms/proposals/${id}`} role="menuitem" className={item} onClick={() => setOpen(false)}>
            <FileText size={14} className="text-slate-500" /> Open
          </Link>
          {status !== "Approved" ? (
            <form action="/api/cms/proposals" method="post">
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="action" value="approve" />
              <button type="submit" role="menuitem" className={item}>
                <Check size={14} className="text-[#15803D]" /> Approve
              </button>
            </form>
          ) : null}
          {status !== "Rejected" ? (
            <form action="/api/cms/proposals" method="post">
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="action" value="reject" />
              <button type="submit" role="menuitem" className={`${item} text-[#B91C1C] hover:bg-red-50`}>
                <X size={14} /> Reject
              </button>
            </form>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
