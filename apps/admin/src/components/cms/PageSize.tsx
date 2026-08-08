"use client";
/**
 * The rows-per-page control, sitting with the pagination summary.
 *
 * It used to be three inline links — 25 50 100 — rendered immediately beside the numbered page links,
 * so a row of small numbers meant "go to page N" and the row of small numbers next to it meant
 * "show N rows". This is a dropdown, which says what it is.
 *
 * Changing the size always returns to page 1: the old page number means nothing once the rows per page
 * change, and landing past the end would show an empty table.
 *
 * The options carry precomputed URLs rather than a callback, because a function cannot cross the
 * server/client boundary — passing one renders the whole list screen as a server error.
 */
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export interface PageSizeOption { size: number; href: string }

export function PageSize({ perPage, options }: { perPage: number; options: PageSizeOption[] }): ReactNode {
  const router = useRouter();
  const hrefFor = (n: number): string => options.find((o) => o.size === n)?.href ?? "";
  return (
    <label className="flex items-center gap-1.5 text-[0.78rem] text-slate-600">
      <span>Rows per page</span>
      <span className="relative">
        <select
          value={perPage}
          onChange={(e) => router.push(hrefFor(Number(e.target.value)))}
          aria-label="Rows per page"
          className="cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-1.5 pl-2.5 pr-7 text-[0.78rem] font-600 text-slate-800 hover:border-[#543CDA] focus:border-[#543CDA] focus:outline-none focus:ring-2 focus:ring-[#543CDA]/15"
        >
          {options.map((o) => <option key={o.size} value={o.size}>{o.size}</option>)}
        </select>
        <ChevronDown size={13} aria-hidden className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500" />
      </span>
    </label>
  );
}
