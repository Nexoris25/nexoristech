"use client";
/**
 * Proof stats with a count-up animation that fires when the section scrolls into view (respecting
 * prefers-reduced-motion, which shows the final value immediately). Uses the design .stat markup
 * and lucide-react icons. The figures are the design's example outcomes; real project figures come
 * from the CMS in production.
 */
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { TrendingUp, Clock, ArrowUpRight } from "lucide-react";

interface StatDef {
  icon: typeof TrendingUp;
  tag: string;
  prefix?: string;
  target: number;
  decimals: number;
  unit: string;
  label: string;
}

const STATS: StatDef[] = [
  {
    icon: TrendingUp,
    tag: "Manual work removed",
    prefix: "−",
    target: 71,
    decimals: 0,
    unit: "%",
    label: "Data entry removed across a logistics operation's daily workflow.",
  },
  {
    icon: Clock,
    tag: "First response",
    prefix: "<",
    target: 1,
    decimals: 0,
    unit: "day",
    label: "Average first reply to inbound enquiries, down from a full working day.",
  },
  {
    icon: ArrowUpRight,
    tag: "Qualified leads",
    target: 3.2,
    decimals: 1,
    unit: "×",
    label: "More qualified leads reaching the sales team after intake was automated.",
  },
];

function useCountUp(target: number, decimals: number, run: boolean): string {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(target);
      return;
    }
    const duration = 1100;
    let raf = 0;
    let start = 0;
    const tick = (t: number): void => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setN(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setN(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run]);
  return n.toFixed(decimals);
}

function Stat({ def, run }: { def: StatDef; run: boolean }): ReactNode {
  const display = useCountUp(def.target, def.decimals, run);
  const Icon = def.icon;
  return (
    <div className="stat">
      <div className="stop">
        <span className="mic">
          <Icon size={20} strokeWidth={1.8} />
        </span>
        <span className="stag">{def.tag}</span>
      </div>
      <div className="fig">
        {def.prefix ? <em>{def.prefix}</em> : null}
        {display}
        <span className="u">{def.unit}</span>
      </div>
      <div className="lbl">{def.label}</div>
    </div>
  );
}

export function ProofStats(): ReactNode {
  const ref = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setRun(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div className="stats reveal" ref={ref}>
      {STATS.map((s) => (
        <Stat key={s.tag} def={s} run={run} />
      ))}
    </div>
  );
}
