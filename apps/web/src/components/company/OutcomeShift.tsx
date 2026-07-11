"use client";
/**
 * "What changes" illustration. A small, brand-consistent interactive widget that sits beside the
 * outcomes copy on the industry pages. It contrasts how an operation runs Before working with us
 * (late, jagged, guessed) with After (steady, rising, acted on), using an abstract signal line, not
 * numbers, so it illustrates the shift without implying any fabricated metric. A Before / After
 * toggle switches which line is emphasised and updates a short qualitative caption. Purely visual
 * and ephemeral.
 */
import { useState } from "react";
import type { ReactNode } from "react";

type Phase = "before" | "after";

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

      <svg className="osx-svg" viewBox="0 0 340 180" role="img" aria-label="Illustration comparing an unpredictable operation before, with a steadier, rising one after">
        <defs>
          <linearGradient id="osxFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#6A55F2" stopOpacity="0.26" />
            <stop offset="1" stopColor="#6A55F2" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line className="osx-base" x1="18" y1="156" x2="322" y2="156" />
        {/* before: jagged and flat, no clear direction */}
        <path
          className="osx-before"
          d="M20 118 L58 104 L96 132 L134 108 L172 128 L210 106 L248 130 L286 112 L322 122"
        />
        {/* after: smooth, rising and steadying */}
        <path
          className="osx-area"
          d="M20 140 C74 138 116 120 168 96 C214 74 274 54 322 46 L322 156 L20 156 Z"
        />
        <path
          className="osx-after"
          d="M20 140 C74 138 116 120 168 96 C214 74 274 54 322 46"
        />
        <circle className="osx-dot" cx="322" cy="46" r="4.6" />
      </svg>

      <p className="osx-cap">
        {phase === "before"
          ? "Before: run on memory, paperwork, and guesswork, with problems noticed too late."
          : "After: run on clear data, caught early and acted on, so the operation holds and improves."}
      </p>
    </div>
  );
}
