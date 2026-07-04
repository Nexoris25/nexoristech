"use client";
/**
 * Managed Technology Operations hero widget. A live platform-health console: an uptime pill, three
 * stats, and a streaming activity log where new lines (backup verified, patch applied, incident
 * resolved, spend trimmed) arrive at the top and older ones roll off. Ported from the approved
 * handoff. Respects prefers-reduced-motion (static log, no stream). Styling: styles/ops-widget.css.
 */
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

type Dot = "ok" | "warn" | "inc";
interface LogItem {
  dot: Dot;
  time: string;
  msg: string;
}

const LOG: LogItem[] = [
  { dot: "ok", time: "09:31", msg: "Nightly backup verified · db-1, db-2" },
  { dot: "ok", time: "09:30", msg: "Security patch applied · no downtime" },
  { dot: "inc", time: "02:18", msg: "Incident resolved · <b>4m</b> · users unaffected" },
  { dot: "inc", time: "02:14", msg: "Disk latency on db-2 · auto-failover triggered" },
  { dot: "warn", time: "Mon", msg: "Cloud spend trimmed · 2 idle instances stopped" },
  { dot: "ok", time: "Mon", msg: "Quarterly improvements shipped · +14% faster" },
];

const STATS = [
  { sv: "99.98%", sl: "Uptime, last 30 days" },
  { sv: "4m", sl: "Avg incident response" },
  { sv: "12", sl: "Patches this month" },
];

const MAX = 5;

const reduceMotion = (): boolean =>
  typeof window !== "undefined" &&
  !!window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function OpsConsole(): ReactNode {
  // Seed with the first five entries, newest first.
  const seed = LOG.slice(0, MAX)
    .map((item, i) => ({ ...item, id: i }))
    .reverse();
  const [lines, setLines] = useState<(LogItem & { id: number })[]>(seed);
  const idx = useRef(MAX);
  const nextId = useRef(MAX);

  useEffect(() => {
    if (reduceMotion()) return;
    const t = setInterval(() => {
      const item = LOG[idx.current % LOG.length]!;
      idx.current += 1;
      const id = nextId.current++;
      setLines((prev) => [{ ...item, id }, ...prev].slice(0, MAX));
    }, 2600);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="opsw reveal" aria-label="Live operations console">
      <div className="opsw-head">
        <span className="live" />
        <b>Platform health · live</b>
        <span className="up">99.98% uptime</span>
      </div>

      <div className="opsw-stats">
        {STATS.map((s) => (
          <div className="opsw-stat" key={s.sl}>
            <div className="sv">{s.sv}</div>
            <div className="sl">{s.sl}</div>
          </div>
        ))}
      </div>

      <div className="opsw-log">
        {lines.map((l) => (
          <div className="opsw-line" key={l.id}>
            <span className={`od ${l.dot}`} />
            <span className="ot">{l.time}</span>
            <span className="om" dangerouslySetInnerHTML={{ __html: l.msg }} />
          </div>
        ))}
      </div>

      <div className="opsw-foot">
        <svg viewBox="0 0 24 24">
          <path d="M4 12l5 5L20 6" />
        </svg>
        <span>
          <b>02:14 incident</b> caught and resolved before any user noticed.
        </span>
      </div>
    </div>
  );
}
