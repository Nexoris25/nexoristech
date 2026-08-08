"use client";
/**
 * Narrow Search Console figures to one country or one page.
 *
 * Every reader on this screen asked Google for the whole property, so the numbers were always the
 * site-wide totals — useful, but not answerable questions like "how is Nigeria doing" or "what is this
 * one article doing". The narrowing is applied in the API request, not to the rows that came back:
 * filtering the top ten afterwards would only ever re-rank ten rows that were themselves chosen from
 * the unfiltered property.
 *
 * The country list is built from the countries the property has actually recorded traffic for, so it
 * never offers a choice that returns nothing.
 */
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { Globe, FileText, X } from "lucide-react";

export interface CountryOption { code: string; label: string }

export function GscScopeFilter({ countries }: { countries: CountryOption[] }): ReactNode {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [page, setPage] = useState(params.get("page") ?? "");

  useEffect(() => setPage(params.get("page") ?? ""), [params]);

  function apply(param: string, value: string): void {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(param, value);
    else next.delete(param);
    router.push(`${pathname}?${next.toString()}`);
  }

  const scoped = Boolean(params.get("country") || params.get("page"));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Globe size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <select
          value={params.get("country") ?? ""}
          onChange={(e) => apply("country", e.target.value)}
          aria-label="Filter by country"
          className="cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-[0.8rem] font-600 text-slate-600 focus:border-[#543CDA] focus:outline-none"
        >
          <option value="">All countries</option>
          {countries.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
        </select>
      </div>

      <div className="relative">
        <FileText size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={page}
          onChange={(e) => setPage(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") apply("page", page.trim()); }}
          onBlur={() => { if ((params.get("page") ?? "") !== page.trim()) apply("page", page.trim()); }}
          placeholder="Any page path…"
          aria-label="Filter by page path"
          className="w-44 rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-[0.8rem] text-slate-700 placeholder:text-slate-400 focus:border-[#543CDA] focus:outline-none"
        />
      </div>

      {scoped ? (
        <button
          type="button"
          onClick={() => {
            const next = new URLSearchParams(params.toString());
            next.delete("country");
            next.delete("page");
            router.push(`${pathname}?${next.toString()}`);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[0.8rem] font-600 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          <X size={13} /> All data
        </button>
      ) : null}
    </div>
  );
}
