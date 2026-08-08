"use client";
/**
 * Google Search Console performance panel (the standard GSC pattern): four metric tiles — Clicks,
 * Impressions, CTR, Average position — that toggle their series on the chart, each on its own scale
 * (GSC's dual-axis behaviour). A Compare toggle overlays the previous equal-length period as a dashed
 * line on each metric's own scale and switches the tile deltas to period-over-period. The date range
 * itself is chosen with the RangeFilter in the header (7d…12m), which re-queries the server.
 *
 * Hovering or focusing the plot reads out the exact figures for that day. Before, the chart drew a line
 * and a row of dates and nothing else, so a point could only be estimated against the gridlines.
 */
import { useState } from "react";
import type { ReactNode } from "react";
import { TrendingUp, TrendingDown, GitCompareArrows } from "lucide-react";
import { AreaChart } from "../charts.js";
import { ChartHover, type HoverPoint } from "../ChartHover.js";

export interface GscMetric { key: string; label: string; color: string; value: string; delta: number; compareValue: string; compareDelta: number }
export interface GscDay { label: string; clicks: number; impressions: number; ctr: number; position: number }

function Trend({ d }: { d: number }): ReactNode {
  const up = d >= 0;
  return <span className={`inline-flex items-center gap-0.5 text-[0.72rem] font-600 ${up ? "text-[#15803D]" : "text-[#B91C1C]"}`}>{up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{Math.abs(d).toFixed(1)}%</span>;
}
const val = (d: GscDay, key: string): number => Number(d[key as keyof GscDay]);

/** How each Search Console metric reads: counts whole, CTR as a percentage, position to one decimal. */
function format(key: string, n: number): string {
  if (key === "ctr") return `${n.toFixed(2)}%`;
  if (key === "position") return n.toFixed(1);
  return Math.round(n).toLocaleString("en-NG");
}

export function SearchConsolePanel({ metrics, days, prevDays, compareLabel }: { metrics: GscMetric[]; days: GscDay[]; prevDays: GscDay[]; compareLabel: string }): ReactNode {
  const [active, setActive] = useState<string[]>(["clicks", "impressions"]);
  const [compare, setCompare] = useState(false);
  const canCompare = prevDays.length === days.length && prevDays.length > 0;
  const toggle = (key: string): void => setActive((cur) => (cur.includes(key) ? (cur.length > 1 ? cur.filter((k) => k !== key) : cur) : [...cur, key]));
  const series = (d: GscDay[], key: string): number[] => d.map((x) => val(x, key));
  const activeMetrics = metrics.filter((m) => active.includes(m.key));
  // For comparison, current and previous share a per-metric scale so a lower previous reads as a lower line.
  const domain = (key: string): { domainMin: number; domainMax: number } => {
    const all = [...series(days, key), ...series(prevDays, key)];
    return { domainMin: Math.min(0, ...all), domainMax: Math.max(1, ...all) };
  };

  // One readout entry per day, carrying only the metrics currently drawn, plus the comparison value
  // when Compare is on so the two periods can be read against each other at the same point.
  const hoverPoints: HoverPoint[] = days.map((d, i) => ({
    label: d.label,
    series: [
      ...activeMetrics.map((m) => ({ label: m.label, color: m.color, value: format(m.key, val(d, m.key)) })),
      ...(compare && prevDays[i]
        ? activeMetrics.map((m) => ({ label: `${m.label} (previous)`, color: "#94A3B8", value: format(m.key, val(prevDays[i]!, m.key)) }))
        : []),
    ],
  }));

  // Roughly a dozen visible ticks whatever the range, so a 90-day chart is not a smear of dates.
  const tickEvery = Math.max(1, Math.ceil(days.length / 12));

  return (
    <div>
      <div className="mb-3 flex items-center justify-end">
        <button type="button" onClick={() => setCompare((c) => !c)} disabled={!canCompare} aria-pressed={compare}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[0.76rem] font-600 transition disabled:cursor-not-allowed disabled:opacity-40 ${compare ? "border-[#543CDA] bg-[#EEEBFC] text-[#543CDA]" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
          <GitCompareArrows size={14} /> Compare{compare ? " on" : ""}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {metrics.map((m) => {
          const on = active.includes(m.key);
          return (
            <button key={m.key} type="button" onClick={() => toggle(m.key)} aria-pressed={on}
              className={`rounded-xl border p-3 text-left transition ${on ? "border-transparent bg-slate-50/70" : "border-slate-200 opacity-60 hover:opacity-100"}`}
              style={on ? { boxShadow: `inset 0 0 0 1.5px ${m.color}` } : undefined}>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 shrink-0 rounded-full" style={{ background: on ? m.color : "#CBD5E1" }} /><span className="truncate text-[0.72rem] text-slate-500">{m.label}</span></span>
              <p className="mt-1 text-[1.15rem] font-700 text-slate-900">{m.value}</p>
              {compare ? (
                <span className="flex flex-wrap items-center gap-1"><Trend d={m.compareDelta} /><span className="text-[0.64rem] text-slate-500">vs {m.compareValue}</span></span>
              ) : <Trend d={m.delta} />}
            </button>
          );
        })}
      </div>

      <ChartHover points={hoverPoints} height={180} className="mt-4">
        {compare ? activeMetrics.map((m) => (
          <div key={`${m.key}-prev`} className="absolute inset-0">
            <AreaChart values={series(prevDays, m.key)} color={m.color} height={180} fill={false} dashed {...domain(m.key)} />
          </div>
        )) : null}
        {activeMetrics.map((m, i) => (
          <div key={m.key} className="absolute inset-0">
            <AreaChart values={series(days, m.key)} color={m.color} height={180} fill={i === 0 && !compare} gridlines={i === 0 ? 4 : 0} endDot {...(compare ? domain(m.key) : {})} />
          </div>
        ))}
      </ChartHover>
      {/* A label per day is unreadable over a long range, so only a handful are drawn; the hover readout
          is what names the exact day. */}
      <div className="mt-1.5 flex justify-between text-[0.66rem] text-slate-500">
        {days.map((d, i) => (
          <span key={i} className={tickEvery > 1 && i % tickEvery !== 0 && i !== days.length - 1 ? "sr-only" : ""}>{d.label}</span>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[0.76rem]">
        <span className="text-slate-500">
          {compare ? `Solid = current, dashed = previous (${compareLabel}). Tap a metric to add or remove it.` : "Tap a metric to add or remove its line."}
          {/* Google finalises a day two to three days later, so the newest bar is rarely yesterday.
              Saying which days these are stops the freshest figures being misdated. */}
          {days.length > 0 ? ` Showing ${days[0]!.label} to ${days[days.length - 1]!.label}, the most recent days Search Console has reported.` : ""}
        </span>
        <span className="flex flex-wrap items-center gap-3">{activeMetrics.map((m) => <span key={m.key} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: m.color }} /> {m.label}</span>)}</span>
      </div>
    </div>
  );
}
