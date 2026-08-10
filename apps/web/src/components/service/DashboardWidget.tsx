"use client";
/**
 * Data Dashboards & Predictive Analytics hero widget. A live dashboard preview: a natural-language
 * ask bar that rotates through questions and answers, KPI tiles, and a bar chart with actual and
 * dashed forecast bars that re-grow on a loop. Ported from the approved handoff. Respects
 * prefers-reduced-motion (no rotation, bars at rest). Styling: styles/dashboard-widget.css.
 */
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import "../../styles/dashboard-widget.css";

const ASKS: { q: string; a: string }[] = [
  { q: "How did Abuja do last month against target?", a: "104% · ahead by ₦3.1m" },
  { q: "Which product line grew fastest in Q2?", a: "Cold chain · +21%" },
  { q: "When does cash runway dip below 6 months?", a: "October · plan ahead" },
];

const KPIS: { label: string; value: string; delta: string; dir: "up" | "dn" }[] = [
  { label: "REVENUE", value: "₦48.2m", delta: "↑ 12% MoM", dir: "up" },
  { label: "ORDERS", value: "3,180", delta: "↑ 8%", dir: "up" },
  { label: "CASH RUNWAY", value: "7.4 mo", delta: "↓ dip ahead", dir: "dn" },
];

const BARS: { h: number; fc?: boolean }[] = [
  { h: 48 },
  { h: 60 },
  { h: 52 },
  { h: 74 },
  { h: 68 },
  { h: 86 },
  { h: 78, fc: true },
  { h: 92, fc: true },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];

export function DashboardWidget(): ReactNode {
  const [ask, setAsk] = useState(0);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const askTimer = setInterval(() => setAsk((a) => (a + 1) % ASKS.length), 4200);
    const barTimer = setInterval(() => setCycle((c) => c + 1), 7000);
    return () => {
      clearInterval(askTimer);
      clearInterval(barTimer);
    };
  }, []);

  const current = ASKS[ask]!;

  return (
    <div className="dashw reveal" aria-label="Live dashboard preview">
      <div className="dashw-ask">
        <svg viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <span>
          &ldquo;<b>{current.q}</b>&rdquo; · {current.a}
        </span>
      </div>

      <div className="dashw-kpis">
        {KPIS.map((k) => (
          <div className="dashw-kpi" key={k.label}>
            <div className="kl">{k.label}</div>
            <div className="kv">{k.value}</div>
            <div className={`kd ${k.dir}`}>{k.delta}</div>
          </div>
        ))}
      </div>

      <div className="dashw-chart">
        <div className="dashw-ct">
          <b>Sales · actual and forecast</b>
          <span className="leg">
            <i />
            Actual <i className="f" />
            Forecast
          </span>
        </div>
        <div className="dashw-bars" key={cycle}>
          {BARS.map((b, i) => (
            <div
              className={`bar${b.fc ? " fc" : ""}`}
              key={i}
              style={{ ["--h" as string]: `${b.h}%` }}
            />
          ))}
        </div>
        <div className="dashw-xax">
          {MONTHS.map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
