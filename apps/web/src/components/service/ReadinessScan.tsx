"use client";
/**
 * Data Infrastructure & AI Readiness hero widget. A data-health scan with a conic-gradient
 * readiness gauge, a verdict, and dimension rows with progress bars and good/bad chips, switchable
 * between "Before audit" and "After Nexoris". The score counts up and the gauge sweeps on change.
 * Auto-cycles the two states, pausing on click. Ported from the approved handoff. Respects
 * prefers-reduced-motion. Styling: styles/readiness-widget.css.
 */
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import "../../styles/readiness-widget.css";

type StateId = "before" | "after";
type Chip = "bad" | "good";

interface ScanState {
  score: number;
  ring: string;
  verdict: string;
  vsub: string;
  foot: string;
  footState: Chip;
  rows: { name: string; pct: number; note: string; chip: Chip }[];
}

const STATES: Record<StateId, ScanState> = {
  before: {
    score: 34,
    ring: "#6A55F2",
    verdict: "Not ready to build on",
    vsub: "4 systems, no single source of truth",
    foot: "3 systems disagree on the same 1,204 customers",
    footState: "bad",
    rows: [
      { name: "CRM", pct: 58, note: "1,204 records", chip: "bad" },
      { name: "Spreadsheets", pct: 30, note: "40 files · 18% duplicates", chip: "bad" },
      { name: "Accounting", pct: 46, note: "names do not match CRM", chip: "bad" },
      { name: "Website leads", pct: 38, note: "no owner assigned", chip: "bad" },
    ],
  },
  after: {
    score: 92,
    ring: "#1FA97E",
    verdict: "Ready to build on",
    vsub: "One governed store, one source of truth",
    foot: "One trusted view · reports agree on the first pass",
    footState: "good",
    rows: [
      { name: "CRM", pct: 96, note: "deduplicated", chip: "good" },
      { name: "Spreadsheets", pct: 93, note: "merged into the store", chip: "good" },
      { name: "Accounting", pct: 98, note: "matched to CRM", chip: "good" },
      { name: "Website leads", pct: 95, note: "owned & governed", chip: "good" },
    ],
  },
};

const ORDER: StateId[] = ["before", "after"];

const FOOT_ICON: Record<Chip, ReactNode> = {
  bad: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4M12 16h.01" />
    </>
  ),
  good: <path d="M4 12l5 5L20 6" />,
};

export function ReadinessScan(): ReactNode {
  const [active, setActive] = useState<StateId>("before");
  const [display, setDisplay] = useState(STATES.before.score);
  const paused = useRef(false);
  const resumeRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const rafRef = useRef<number | undefined>(undefined);

  const s = STATES[active];

  // Auto-cycle between the two states.
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setDisplay(s.score);
      return;
    }
    const t = setTimeout(() => {
      if (!paused.current) setActive((a) => ORDER[(ORDER.indexOf(a) + 1) % ORDER.length]!);
    }, 3400);
    return () => clearTimeout(t);
  }, [active, s.score]);

  // Count the score up/down to the active target.
  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setDisplay(s.score);
      return;
    }
    const start = display;
    const target = s.score;
    const t0 = performance.now();
    const dur = 750;
    const step = (now: number): void => {
      const k = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      setDisplay(Math.round(start + (target - start) * e));
      if (k < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // Deliberately keyed on `active` alone: the animation restarts only when the scan does.
  }, [active]);

  useEffect(
    () => () => {
      clearTimeout(resumeRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  function pick(id: StateId): void {
    paused.current = true;
    setActive(id);
    clearTimeout(resumeRef.current);
    resumeRef.current = setTimeout(() => {
      paused.current = false;
      setActive((a) => ORDER[(ORDER.indexOf(a) + 1) % ORDER.length]!);
    }, 12000);
  }

  return (
    <div
      className="scanw reveal"
      aria-label="Data health scan"
      style={{ ["--scanw-ring" as string]: s.ring }}
    >
      <div className="scanw-tabs" role="tablist" aria-label="Scan state">
        {(
          [
            ["before", "Before audit"],
            ["after", "After Nexoris"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active === id}
            className={`scanw-tab${active === id ? " on" : ""}`}
            onClick={() => pick(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="scanw-head">
        <div className="scanw-gauge" style={{ ["--scanw-p" as string]: s.score }}>
          <div className="inner">
            <span className="sv">{display}</span>
            <i>/ 100</i>
          </div>
        </div>
        <div className="scanw-meta">
          <span className="sk">AI readiness score</span>
          <span className="verdict">{s.verdict}</span>
          <span className="vsub">
            <span className="vd" />
            {s.vsub}
          </span>
        </div>
      </div>

      <div className="scanw-rows">
        {s.rows.map((r) => (
          <div className="scanw-row" key={r.name}>
            <span className="sn">{r.name}</span>
            <span className="sbar">
              <i style={{ ["--w" as string]: `${r.pct}%` }} />
            </span>
            <span className={`schip ${r.chip}`}>{r.note}</span>
          </div>
        ))}
      </div>

      <div className="scanw-foot">
        <svg viewBox="0 0 24 24">{FOOT_ICON[s.footState]}</svg>
        <span>{s.foot}</span>
      </div>
    </div>
  );
}
