/**
 * A small real-data sparkline for KPI cards, rendered server-side as an SVG polyline in the brand
 * purple. Values are scaled to the drawing box; a flat series renders as a midline rather than
 * dividing by zero.
 */
import type { ReactNode } from "react";

export function Sparkline({ values }: { values: number[] }): ReactNode {
  if (values.length < 2) return null;
  const w = 64;
  const h = 20;
  const pad = 2;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min;
  const points = values
    .map((v, i) => {
      const x = pad + (i * (w - pad * 2)) / (values.length - 1);
      const y =
        span === 0 ? h / 2 : h - pad - ((v - min) * (h - pad * 2)) / span;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-5 w-16" fill="none" aria-hidden="true">
      <polyline
        points={points}
        stroke="#543CDA"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
