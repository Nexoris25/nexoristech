/**
 * The Oge avatar mark, transcribed from the design handoff's oge.js (window.OgeMark). Oge is the
 * Nexoris Technologies website assistant; this is its single source avatar. Decorative.
 */
import type { ReactNode } from "react";

export function OgeMark({ size = 40, className }: { size?: number; className?: string }): ReactNode {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id="oge-mark-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6A55F2" />
          <stop offset="1" stopColor="#4330B8" />
        </linearGradient>
        <clipPath id="oge-mark-clip">
          <rect x="1.5" y="1.5" width="37" height="37" rx="12" />
        </clipPath>
      </defs>
      <g clipPath="url(#oge-mark-clip)">
        <rect x="1.5" y="1.5" width="37" height="37" fill="url(#oge-mark-g)" />
        <ellipse cx="20" cy="15.5" rx="12" ry="11.6" fill="#1d1233" />
        <path d="M4 38.5c0-6.7 6-10.3 16-10.3s16 3.6 16 10.3z" fill="#cdbffb" />
        <path d="M16.6 23.4h6.8v6.4h-6.8z" fill="#7c4a2a" />
        <ellipse cx="20" cy="18.4" rx="6.9" ry="7.7" fill="#8b5634" />
        <circle cx="12.8" cy="19.2" r="1.7" fill="#8b5634" />
        <circle cx="27.2" cy="19.2" r="1.7" fill="#8b5634" />
        <circle cx="12.8" cy="21.7" r="1.35" fill="none" stroke="#f4c95d" strokeWidth="1" />
        <circle cx="27.2" cy="21.7" r="1.35" fill="none" stroke="#f4c95d" strokeWidth="1" />
        <path
          d="M13.2 13.4C14.8 11.1 17.2 9.9 20 9.9s5.2 1.2 6.8 3.5c-2-1.1-4.3-1.6-6.8-1.6s-4.8.5-6.8 1.6z"
          fill="#1d1233"
        />
        <ellipse cx="17.2" cy="18.3" rx="0.95" ry="1.2" fill="#2a1622" />
        <ellipse cx="22.8" cy="18.3" rx="0.95" ry="1.2" fill="#2a1622" />
        <path
          d="M15.7 15.9c.8-.6 1.9-.6 2.7 0M21.6 15.9c.8-.6 1.9-.6 2.7 0"
          stroke="#2a1622"
          strokeWidth="0.7"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M17.5 21.6c1.5 1.3 3.5 1.3 5 0"
          stroke="#5a2f1a"
          strokeWidth="1.1"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
