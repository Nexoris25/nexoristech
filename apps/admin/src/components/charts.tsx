/**
 * Lightweight, dependency-free SVG charts for the dashboards: an area/line chart, a donut, a
 * circular progress ring, and a horizontal bar. Pure server components; colours come from the brand
 * violet/slate palette. Sized with a viewBox so they scale to their container.
 */
import type { ReactNode } from "react";

/**
 * Smooth-ish area + line chart. `values` are plotted left to right against their own min/max. Optional
 * horizontal gridlines and an end-point dot make it readable without any overlapping floating tooltip.
 */
export function AreaChart({
  values,
  color = "#543CDA",
  height = 200,
  className = "",
  gridlines = 0,
  endDot = false,
  fill = true,
  dashed = false,
  domainMin,
  domainMax,
}: {
  values: number[];
  color?: string;
  height?: number;
  className?: string;
  gridlines?: number;
  endDot?: boolean;
  fill?: boolean;
  dashed?: boolean;
  domainMin?: number;
  domainMax?: number;
}): ReactNode {
  const w = 600;
  const h = height;
  const pad = 6;
  const max = domainMax ?? Math.max(...values, 1);
  const min = domainMin ?? Math.min(...values, 0);
  const span = max - min || 1;
  const step = values.length > 1 ? (w - pad * 2) / (values.length - 1) : 0;
  const pts = values.map((v, i) => {
    const x = pad + i * step;
    const y = h - pad - ((v - min) / span) * (h - pad * 2);
    return [x, y] as const;
  });
  // Draw through the points with a monotone cubic, the way a charting library does. Straight segments
  // meeting at sharp angles are what make a hand-rolled chart look synthetic; the tangent is damped at
  // each point so the curve stays faithful to the data and never overshoots into invented peaks.
  const line = ((): string => {
    if (pts.length < 2) return pts.length === 1 ? `M ${pts[0]![0].toFixed(1)} ${pts[0]![1].toFixed(1)}` : "";
    const d: string[] = [`M ${pts[0]![0].toFixed(1)} ${pts[0]![1].toFixed(1)}`];
    for (let i = 0; i < pts.length - 1; i += 1) {
      const p0 = pts[i === 0 ? 0 : i - 1]!;
      const p1 = pts[i]!;
      const p2 = pts[i + 1]!;
      const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1]!;
      const t = 0.2; // damping: lower is tighter to the data
      const c1x = p1[0] + (p2[0] - p0[0]) * t;
      const c1y = p1[1] + (p2[1] - p0[1]) * t;
      const c2x = p2[0] - (p3[0] - p1[0]) * t;
      const c2y = p2[1] - (p3[1] - p1[1]) * t;
      d.push(`C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`);
    }
    return d.join(" ");
  })();
  const area = `${line} L ${pad + (values.length - 1) * step} ${h - pad} L ${pad} ${h - pad} Z`;
  const id = `g${color.replace("#", "")}`;
  const last = pts[pts.length - 1];
  const rows = gridlines > 0 ? Array.from({ length: gridlines }, (_, i) => pad + (i * (h - pad * 2)) / (gridlines - 1)) : [];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={`w-full ${className}`} style={{ height }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {rows.map((y, i) => <line key={i} x1={pad} y1={y} x2={w - pad} y2={y} stroke="#EEF2F7" strokeWidth="1" vectorEffect="non-scaling-stroke" />)}
      {fill ? <path d={area} fill={`url(#${id})`} /> : null}
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" {...(dashed ? { strokeDasharray: "5 4", strokeOpacity: 0.55 } : {})} />
      {endDot && last ? <circle cx={last[0]} cy={last[1]} r="3.5" fill={color} stroke="#fff" strokeWidth="2" vectorEffect="non-scaling-stroke" /> : null}
    </svg>
  );
}

/** Donut chart with a centred label. */
export function Donut({
  segments,
  size = 170,
  thickness = 22,
  centerTop,
  centerBottom,
}: {
  segments: { value: number; color: string }[];
  size?: number;
  thickness?: number;
  centerTop: ReactNode;
  centerBottom: ReactNode;
}): ReactNode {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EEF2F7" strokeWidth={thickness} />
        {segments.map((seg, i) => {
          const len = (seg.value / total) * c;
          const dash = `${len} ${c - len}`;
          const offset = -acc;
          acc += len;
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeDasharray={dash}
              strokeDashoffset={offset}
              strokeLinecap="butt"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-mono text-[1.5rem] font-700 leading-none text-slate-900">{centerTop}</div>
          <div className="mt-1 text-[0.66rem] text-slate-500">{centerBottom}</div>
        </div>
      </div>
    </div>
  );
}

/** Circular progress ring with a centred value. */
export function ProgressRing({
  value,
  size = 120,
  thickness = 12,
  color = "#543CDA",
  children,
}: {
  value: number;
  size?: number;
  thickness?: number;
  color?: string;
  children?: ReactNode;
}): ReactNode {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const len = (Math.min(100, Math.max(0, value)) / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EEF2F7" strokeWidth={thickness} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeDasharray={`${len} ${c - len}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

/** A labelled horizontal bar for rankings (services, sources, clients). */
export function Bar({ pct, color = "#543CDA" }: { pct: number; color?: string }): ReactNode {
  return (
    <span className="block h-1.5 overflow-hidden rounded-full bg-slate-100">
      <span className="block h-full rounded-full" style={{ width: `${Math.min(100, Math.max(2, pct))}%`, background: color }} />
    </span>
  );
}
