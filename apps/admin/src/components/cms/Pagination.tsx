/**
 * Numbered pagination for CMS list screens.
 *
 * The lists previously took a bare `LIMIT` and stopped: Generated Pages showed 15 of 2,460 rows with no
 * way to reach the rest, so most of the content in the system was unreachable through the interface.
 *
 * Server component, driven entirely by the `page` query parameter, so it works without JavaScript and
 * every page is a real, linkable URL. Existing parameters are carried through, so paging never silently
 * drops the filter or search someone is looking at.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageSize } from "./PageSize.js";

/** Page numbers to show, with nulls marking a gap. Always first and last, plus a window around current. */
export function pageWindow(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | null)[] = [1];
  const from = Math.max(2, current - 1);
  const to = Math.min(total - 1, current + 1);
  if (from > 2) out.push(null);
  for (let i = from; i <= to; i++) out.push(i);
  if (to < total - 1) out.push(null);
  out.push(total);
  return out;
}

/** How many rows a list may show at once. */
export const PER_PAGE_OPTIONS = [25, 50, 100] as const;
export const DEFAULT_PER_PAGE = 25;

/** Read a `per` query parameter, falling back to the default when it is absent or not an offered size. */
export function perPageFrom(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? "", 10);
  return (PER_PAGE_OPTIONS as readonly number[]).includes(n) ? n : DEFAULT_PER_PAGE;
}

export interface PaginationProps {
  page: number;
  pageCount: number;
  /** Total rows, so the summary can say what is being looked at. */
  total: number;
  basePath: string;
  /** Current query parameters, carried onto every page link so filters survive paging. */
  params?: Record<string, string | undefined>;
  /** What the rows are, for the summary line. */
  noun?: string;
  /** Rows per page. Omit to hide the size selector. */
  perPage?: number;
}

export function Pagination({ page, pageCount, total, basePath, params = {}, noun = "items", perPage }: PaginationProps): ReactNode {
  // The size selector still shows on a single page: it is how someone asks to see more at once.
  if (pageCount <= 1 && perPage === undefined) return null;

  const href = (p: number, per?: number): string => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "" && k !== "page" && k !== "per") q.set(k, v);
    }
    const size = per ?? perPage;
    if (size !== undefined && size !== DEFAULT_PER_PAGE) q.set("per", String(size));
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  const box = "grid h-8 min-w-8 place-items-center rounded-lg border px-2 text-[0.8rem] font-600";
  const idle = `${box} border-slate-200 bg-white text-slate-700 hover:border-[#543CDA] hover:text-[#543CDA]`;
  const off = `${box} cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400`;

  return (
    <nav aria-label="Pagination" className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-[0.78rem] text-slate-600">
          Page {page} of {pageCount} · {total.toLocaleString("en-NG")} {noun}
        </p>
        {/* A real dropdown rather than a row of numbers: three links looked like pagination sitting
            next to the pagination, and adding a fourth size would have made that worse. Rendered as a
            styled native select so it works without JavaScript and reads correctly on a phone. */}
        {perPage !== undefined ? (
          <PageSize perPage={perPage} options={PER_PAGE_OPTIONS.map((n) => ({ size: n, href: href(1, n) }))} />
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {page > 1
          ? <Link href={href(page - 1)} rel="prev" aria-label="Previous page" className={idle}><ChevronLeft size={15} /></Link>
          : <span className={off} aria-hidden="true"><ChevronLeft size={15} /></span>}

        {pageWindow(page, pageCount).map((p, i) => (
          p === null
            ? <span key={`gap-${i}`} className="px-1 text-[0.8rem] text-slate-400">…</span>
            : p === page
              ? <span key={p} aria-current="page" className={`${box} border-[#543CDA] bg-[#543CDA] text-white`}>{p}</span>
              : <Link key={p} href={href(p)} className={idle}>{p}</Link>
        ))}

        {page < pageCount
          ? <Link href={href(page + 1)} rel="next" aria-label="Next page" className={idle}><ChevronRight size={15} /></Link>
          : <span className={off} aria-hidden="true"><ChevronRight size={15} /></span>}
      </div>
    </nav>
  );
}

/** Clamp a `page` query parameter to something usable. */
export function currentPage(raw: string | undefined, pageCount: number): number {
  const n = Number.parseInt(raw ?? "1", 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return pageCount > 0 ? Math.min(n, pageCount) : 1;
}
