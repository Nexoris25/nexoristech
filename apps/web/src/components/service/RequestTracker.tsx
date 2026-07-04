"use client";
/**
 * GovTech Platforms hero widget. A citizen service-request tracker: the same "Business permit
 * renewal" moving through five timeline steps, switchable between "On the portal" (fast, the active
 * step sweeps down and completes) and "At the counter" (stuck at desk 3). Auto-cycles the two
 * views, pausing on click. Ported from the approved handoff. Respects prefers-reduced-motion.
 * Styling: styles/govtech-widget.css.
 */
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

type ViewId = "portal" | "counter";
type StepState = "done" | "active" | "stuck" | "pending";

const STEP_LABELS = [
  "Application submitted",
  "Documents verified",
  "Officer review",
  "Approved",
  "Certificate issued",
];

const TIMES: Record<ViewId, string[]> = {
  portal: ["09:14 · today", "09:15 · auto-checked", "11:40 · today", "tomorrow, 10:02", "tomorrow, 10:05"],
  counter: ["Mon · form collected", "+4 days · re-queued", "at desk 3 · 6 days waiting", "not started", "not started"],
};

const COUNTER_STATES: StepState[] = ["done", "done", "stuck", "pending", "pending"];

const reduceMotion = (): boolean =>
  typeof window !== "undefined" &&
  !!window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function RequestTracker(): ReactNode {
  const [view, setView] = useState<ViewId>("portal");
  // For the portal animation: how far the sweep has advanced (0..5; 5 = all done).
  const [portalStep, setPortalStep] = useState(5);
  const paused = useRef(false);
  const resumeRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const reduce = reduceMotion();

    if (view === "portal") {
      if (reduce) {
        setPortalStep(5);
        return;
      }
      setPortalStep(0);
      for (let i = 0; i <= 5; i++) {
        timers.current.push(setTimeout(() => setPortalStep(i), 300 + i * 700));
      }
      // advance to the counter view once the sweep has finished and held a moment
      timers.current.push(
        setTimeout(() => {
          if (!paused.current) setView("counter");
        }, 300 + 5 * 700 + 1900),
      );
    } else {
      if (reduce) return;
      timers.current.push(
        setTimeout(() => {
          if (!paused.current) setView("portal");
        }, 4200),
      );
    }

    return () => {
      timers.current.forEach(clearTimeout);
    };
  }, [view]);

  useEffect(
    () => () => {
      clearTimeout(resumeRef.current);
      timers.current.forEach(clearTimeout);
    },
    [],
  );

  function pick(id: ViewId): void {
    paused.current = true;
    setView(id);
    clearTimeout(resumeRef.current);
    resumeRef.current = setTimeout(() => {
      paused.current = false;
      setView((v) => (v === "portal" ? "counter" : "portal"));
    }, 12000);
  }

  const stepState = (i: number): StepState => {
    if (view === "counter") return COUNTER_STATES[i]!;
    if (i < portalStep) return "done";
    if (i === portalStep) return "active";
    return "pending";
  };

  const pill = view === "portal" ? { text: "In progress", cls: "ok" } : { text: "Stuck at desk 3", cls: "warn" };
  const footTime = view === "portal" ? "about 2 days" : "about 3 weeks";

  return (
    <div className="trkw reveal" aria-label="Citizen service request demo">
      <div className="trkw-tabs" role="tablist" aria-label="Request channel">
        {(
          [
            ["counter", "At the counter"],
            ["portal", "On the portal"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={view === id}
            className={`trkw-tab${view === id ? " on" : ""}`}
            onClick={() => pick(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="trkw-head">
        <span className="doc">
          <svg viewBox="0 0 24 24">
            <path d="M14 3v5h5" />
            <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M9 13h6M9 16h4" />
          </svg>
        </span>
        <div className="hx">
          <b>Business permit renewal</b>
          <span className="ref">Ref NX-4821</span>
        </div>
        <span className={`pill ${pill.cls}`}>{pill.text}</span>
      </div>

      <div className="trkw-steps">
        {STEP_LABELS.map((label, i) => (
          <div className={`trkw-step ${stepState(i)}`} key={label}>
            <span className="td">
              <svg viewBox="0 0 24 24">
                <path d="M5 12l4 4L19 7" />
              </svg>
            </span>
            <div>
              <span className="tl">{label}</span>
              <span className="tm">{TIMES[view][i]}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="trkw-foot">
        <svg viewBox="0 0 24 24">
          <path d="M12 8v4l3 2" />
          <circle cx="12" cy="12" r="9" />
        </svg>
        <span>
          Typical time end to end: <b>{footTime}</b>
        </span>
      </div>
    </div>
  );
}
