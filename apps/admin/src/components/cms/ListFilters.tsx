"use client";
/**
 * The search-and-filter bar for CMS list screens.
 *
 * Every list had one of these already and not one of them did anything: a search box with no `name` and
 * no handler, next to selects whose options were decorative. Typing in them changed nothing, and the
 * only way to find out was to try. A control that looks operable and is not is worse than no control,
 * because it costs the reader the time to discover it is a prop.
 *
 * This drives the same query parameters the pagination already uses, so a filtered list is a real,
 * linkable URL and the server does the filtering. Changing a filter resets to page one — staying on
 * page 7 of a result set that now has two pages is how a filter appears to return nothing.
 *
 * Search submits on Enter or blur rather than on every keystroke: each change is a server round trip,
 * and a request per character is neither faster nor kinder to the database.
 */
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { Search, ChevronDown, X } from "lucide-react";

export interface FilterSelect {
  /** Query-parameter name, e.g. "status". */
  param: string;
  /** Shown when nothing is selected, e.g. "All statuses". */
  allLabel: string;
  options: { value: string; label: string }[];
}

export function ListFilters({
  searchPlaceholder,
  selects = [],
}: {
  searchPlaceholder: string;
  selects?: FilterSelect[];
}): ReactNode {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  // Keep the box in step when the URL changes underneath it — a back button, or a cleared filter.
  useEffect(() => setQ(params.get("q") ?? ""), [params]);

  /** Apply one parameter, dropping it when empty, and return to the first page. */
  function apply(param: string, value: string): void {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(param, value);
    else next.delete(param);
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  }

  const active = [...params.keys()].some((k) => k === "q" || selects.some((s) => s.param === k));

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3">
      <div className="relative min-w-0 flex-1 sm:max-w-sm">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") apply("q", q.trim()); }}
          onBlur={() => { if ((params.get("q") ?? "") !== q.trim()) apply("q", q.trim()); }}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-[0.83rem] focus:border-[#543CDA] focus:bg-white focus:outline-none"
        />
      </div>

      {selects.map((s) => (
        <div key={s.param} className="relative">
          <select
            value={params.get(s.param) ?? ""}
            onChange={(e) => apply(s.param, e.target.value)}
            aria-label={s.allLabel}
            className="cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-[0.8rem] font-600 text-slate-600 focus:border-[#543CDA] focus:outline-none"
          >
            <option value="">{s.allLabel}</option>
            {s.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
        </div>
      ))}

      {active ? (
        <button
          type="button"
          onClick={() => router.push(pathname)}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[0.8rem] font-600 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          <X size={13} /> Clear
        </button>
      ) : null}
    </div>
  );
}
