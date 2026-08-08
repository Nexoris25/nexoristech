"use client";
/**
 * A hover-and-focus readout for the SVG charts.
 *
 * The charts drew a line and a row of date labels underneath and stopped there, so the only way to read
 * a point was to estimate it against the gridlines. This wraps a chart in a transparent layer that
 * tracks the pointer across the plot, snaps to the nearest data point, and shows a guide line with that
 * point's date and every active series value.
 *
 * It is keyboard operable and screen-reader legible on purpose: a chart that can only be read by
 * hovering a mouse is unreadable to anyone who does not use one. Tab focuses the plot, the arrow keys
 * step through points, Home and End jump to the ends, and the readout is announced as it changes.
 *
 * Layout note: the chart itself is drawn with the same horizontal padding (`PAD` of a 600-wide viewBox),
 * so the guide sits exactly on the plotted point rather than near it.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

/** One series' value at a point, ready to render. */
export interface HoverSeries {
  label: string;
  color: string;
  /** Already formatted, because only the caller knows whether this is a count, a percentage or a rank. */
  value: string;
}

export interface HoverPoint {
  label: string;
  series: HoverSeries[];
}

/** Matches the `pad` and viewBox width used by AreaChart, so the guide lands on the point. */
const PAD = 6;
const VIEW_W = 600;

export function ChartHover({
  points,
  height,
  children,
  className = "",
}: {
  points: HoverPoint[];
  height: number;
  children: ReactNode;
  className?: string;
}): ReactNode {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState<number | null>(null);

  // Fraction of the plot width at which each point sits, mirroring the chart's own geometry.
  const fractions = useMemo(() => {
    const n = points.length;
    if (n <= 1) return [0.5];
    return points.map((_, i) => (PAD + (i * (VIEW_W - PAD * 2)) / (n - 1)) / VIEW_W);
  }, [points]);

  const nearest = useCallback((clientX: number): number => {
    const box = ref.current?.getBoundingClientRect();
    if (!box || box.width === 0) return 0;
    const ratio = (clientX - box.left) / box.width;
    let best = 0;
    let bestGap = Infinity;
    for (let i = 0; i < fractions.length; i++) {
      const gap = Math.abs((fractions[i] ?? 0) - ratio);
      if (gap < bestGap) { bestGap = gap; best = i; }
    }
    return best;
  }, [fractions]);

  const onKey = (e: React.KeyboardEvent): void => {
    const last = points.length - 1;
    const cur = index ?? 0;
    if (e.key === "ArrowRight") { e.preventDefault(); setIndex(Math.min(last, cur + 1)); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); setIndex(Math.max(0, cur - 1)); }
    else if (e.key === "Home") { e.preventDefault(); setIndex(0); }
    else if (e.key === "End") { e.preventDefault(); setIndex(last); }
    else if (e.key === "Escape") { setIndex(null); }
  };

  const active = index !== null ? points[index] : undefined;
  const left = index !== null ? (fractions[index] ?? 0) * 100 : 0;
  // Keep the card inside the panel at both ends rather than letting it hang off the edge.
  const anchor = left > 66 ? "right" : left < 34 ? "left" : "center";

  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      style={{ height }}
      tabIndex={points.length > 0 ? 0 : -1}
      role="application"
      aria-label={`Chart with ${points.length} points. Use the arrow keys to read each one.`}
      onPointerMove={(e) => setIndex(nearest(e.clientX))}
      onPointerLeave={() => setIndex(null)}
      onFocus={() => setIndex((i) => i ?? points.length - 1)}
      onBlur={() => setIndex(null)}
      onKeyDown={onKey}
    >
      {children}

      {active ? (
        <>
          <span
            aria-hidden
            className="pointer-events-none absolute top-0 bottom-0 w-px bg-slate-300"
            style={{ left: `${left}%` }}
          />
          <div
            className="pointer-events-none absolute z-10 min-w-[8.5rem] rounded-lg border border-slate-200 bg-white p-2.5 shadow-lg"
            style={{
              left: `${left}%`,
              top: 4,
              transform: anchor === "center" ? "translateX(-50%)" : anchor === "right" ? "translateX(-100%)" : "none",
            }}
          >
            <p className="text-[0.7rem] font-700 text-slate-900">{active.label}</p>
            <ul className="mt-1 flex flex-col gap-0.5">
              {active.series.map((s) => (
                <li key={s.label} className="flex items-center gap-2 text-[0.72rem]">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} />
                  <span className="flex-1 text-slate-600">{s.label}</span>
                  <span className="font-600 text-slate-900">{s.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : null}

      {/* Announced to a screen reader as the selection moves, so the values are readable without sight. */}
      <span aria-live="polite" className="sr-only">
        {active ? `${active.label}: ${active.series.map((s) => `${s.label} ${s.value}`).join(", ")}` : ""}
      </span>
    </div>
  );
}
