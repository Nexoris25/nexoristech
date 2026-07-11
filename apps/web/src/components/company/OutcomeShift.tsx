"use client";
/**
 * "What changes" illustration. A small, brand-consistent interactive chart that sits beside the
 * outcomes copy on the industry pages. It shows two genuinely different series and only the selected
 * one at a time, so the contrast is unmistakable: Before is a volatile line that swings and does not
 * grow; With Nexoris Technologies is a steady line that trends up and holds. Rendered as a realistic
 * mini analytics chart (axes, gridlines, plotted points, area fill) but with no numbers, so it
 * illustrates the shift honestly without implying a fabricated metric. Purely visual and ephemeral.
 */
import { useState } from "react";
import type { ReactNode } from "react";

type Phase = "before" | "after";

// Plot points in the 340x200 viewBox. Higher on screen = better (lower y).
const BEFORE: [number, number][] = [
  [30, 100],
  [66, 70],
  [102, 126],
  [138, 84],
  [174, 132],
  [210, 96],
  [246, 138],
  [282, 108],
  [316, 122],
];
const AFTER: [number, number][] = [
  [30, 150],
  [66, 140],
  [102, 122],
  [138, 106],
  [174, 88],
  [210, 70],
  [246, 56],
  [282, 46],
  [316, 38],
];

const line = (pts: [number, number][]): string => pts.map((p) => p.join(",")).join(" ");
const area = (pts: [number, number][]): string =>
  `M${pts[0]![0]} ${pts[0]![1]} ` +
  pts
    .slice(1)
    .map((p) => `L${p[0]} ${p[1]}`)
    .join(" ") +
  " L316 160 L30 160 Z";

export function OutcomeShift(): ReactNode {
  const [phase, setPhase] = useState<Phase>("after");

  return (
    <div className={`osx osx-${phase}`}>
      <span className="osx-hint">Tap to compare</span>
      <div className="osx-toggle" role="group" aria-label="Compare before and after">
        <button
          type="button"
          className={phase === "before" ? "on" : ""}
          aria-pressed={phase === "before"}
          onClick={() => setPhase("before")}
        >
          Before
        </button>
        <button
          type="button"
          className={phase === "after" ? "on" : ""}
          aria-pressed={phase === "after"}
          onClick={() => setPhase("after")}
        >
          With Nexoris Technologies
        </button>
      </div>

      <svg
        className="osx-svg"
        viewBox="0 0 340 200"
        role="img"
        aria-label={
          phase === "before"
            ? "Chart showing volatile, non-growing results before working with Nexoris Technologies"
            : "Chart showing steady, rising results with Nexoris Technologies"
        }
      >
        <defs>
          <linearGradient id="osxFillA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#6A55F2" stopOpacity="0.3" />
            <stop offset="1" stopColor="#6A55F2" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="osxFillB" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#6E6A7C" stopOpacity="0.16" />
            <stop offset="1" stopColor="#6E6A7C" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* grid + axes */}
        <line className="osx-grid" x1="30" y1="52" x2="316" y2="52" />
        <line className="osx-grid" x1="30" y1="90" x2="316" y2="90" />
        <line className="osx-grid" x1="30" y1="128" x2="316" y2="128" />
        <line className="osx-axis" x1="30" y1="24" x2="30" y2="160" />
        <line className="osx-axis" x1="30" y1="160" x2="316" y2="160" />

        {/* Before: volatile, no growth */}
        <g className="osx-g-before">
          <path className="osx-area osx-area-b" d={area(BEFORE)} />
          <polyline className="osx-line osx-line-b" points={line(BEFORE)} />
          {BEFORE.map(([x, y], i) => (
            <circle key={i} className="osx-pt osx-pt-b" cx={x} cy={y} r="3" />
          ))}
        </g>

        {/* With Nexoris Technologies: steady rise */}
        <g className="osx-g-after">
          <path className="osx-area osx-area-a" d={area(AFTER)} />
          <polyline className="osx-line osx-line-a" points={line(AFTER)} />
          {AFTER.map(([x, y], i) => (
            <circle key={i} className="osx-pt osx-pt-a" cx={x} cy={y} r="3.2" />
          ))}
        </g>

        <text className="osx-xlab" x="30" y="177" textAnchor="start">
          Then
        </text>
        <text className="osx-xlab" x="316" y="177" textAnchor="end">
          Now
        </text>
      </svg>

      <p className="osx-cap">
        {phase === "before"
          ? "Before: results swing on guesswork, with surprises and losses caught only after the fact."
          : "With Nexoris Technologies: steadier output that trends up and holds, because problems are caught early."}
      </p>
    </div>
  );
}
