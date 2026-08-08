"use client";
/**
 * A functional duration filter. Selecting a range writes it to the URL (`?range=`), which re-runs the
 * server component so the screen re-queries for that window. The current value is read back from the URL,
 * so the control and the data always agree. Reused across dashboards for one consistent, working control.
 */
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, Check } from "lucide-react";

export interface RangeOption { value: string; label: string }
export const DEFAULT_RANGES: RangeOption[] = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "12m", label: "Last 12 months" },
];

export function RangeFilter({ options = DEFAULT_RANGES, param = "range", defaultValue }: { options?: RangeOption[]; param?: string; defaultValue?: string }): ReactNode {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = search.get(param) ?? defaultValue ?? options[0]?.value ?? "";
  const label = options.find((o) => o.value === current)?.label ?? options[0]?.label ?? "";

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent): void => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent): void => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const choose = (value: string): void => {
    setOpen(false);
    const params = new URLSearchParams(Array.from(search.entries()));
    params.set(param, value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[0.82rem] font-600 text-slate-700 hover:bg-slate-50">
        {label} <ChevronDown size={14} className={`text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div role="listbox" className="absolute right-0 z-30 mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
          {options.map((o) => (
            <button key={o.value} type="button" role="option" aria-selected={o.value === current} onClick={() => choose(o.value)}
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[0.82rem] font-500 ${o.value === current ? "bg-[#EEEBFC] text-[#543CDA]" : "text-slate-600 hover:bg-slate-100"}`}>
              <span className="min-w-0 flex-1 truncate">{o.label}</span>{o.value === current ? <Check size={13} className="text-[#543CDA]" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
