/**
 * Shared line-icon library for the industry pages. One dictionary of stroked 24x24 glyphs, keyed by
 * a short name, so the server view (problem cards, "what we build" cards, service links) and the
 * client finder can both render the same industry-aligned icons without duplicating SVG. Every glyph
 * is a set of inner <path>/<circle>/<rect> nodes meant to be wrapped in a <svg viewBox="0 0 24 24">
 * with stroke styling supplied by CSS. Brand tokens only; no per-icon colour.
 */
import type { ReactNode } from "react";

export const ICONS: Record<string, ReactNode> = {
  // generic / cross-service
  cube: (
    <>
      <path d="M4 7l8-4 8 4v10l-8 4-8-4z" />
      <path d="M4 7l8 4 8-4M12 11v10" />
    </>
  ),
  chat: (
    <>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M8 9h8M8 12h5" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
    </>
  ),
  cart: (
    <>
      <path d="M3 4h2l2.2 11.2a1.5 1.5 0 0 0 1.5 1.2h8.1a1.5 1.5 0 0 0 1.5-1.2L21 7H6" />
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
    </>
  ),
  chart: <path d="M4 19V5M4 19h16M8 16V9M12 16v-5M16 16v-9" />,
  nodes: (
    <>
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="M8 11l8-4M8 13l8 4" />
    </>
  ),
  db: (
    <>
      <ellipse cx="12" cy="6" rx="8" ry="3" />
      <path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    </>
  ),
  sensor: (
    <>
      <path d="M5 12a10 10 0 0 1 14 0M8 15a6 6 0 0 1 8 0" />
      <circle cx="12" cy="18" r="1.3" />
    </>
  ),
  bank: <path d="M3 9l9-5 9 5M5 9v9M19 9v9M9 18v-6M15 18v-6M3 21h18" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1" />
      <rect x="13" y="4" width="7" height="7" rx="1" />
      <rect x="4" y="13" width="7" height="7" rx="1" />
      <rect x="13" y="13" width="7" height="7" rx="1" />
    </>
  ),
  screen: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </>
  ),
  phone: (
    <>
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <path d="M10.5 18h3" />
    </>
  ),
  coins: (
    <>
      <circle cx="9" cy="9" r="5" />
      <path d="M15 5.2a5 5 0 0 1 0 9.6" />
    </>
  ),
  doc: (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4M9 12h6M9 16h6" />
    </>
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M4 9h16M9 3v4M15 3v4" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M16 6a3 3 0 0 1 0 6M21 20a6 6 0 0 0-4.5-5.8" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),

  // industry-flavoured
  leaf: (
    <>
      <path d="M4 20c0-8 6-14 16-14 0 10-6 14-16 14z" />
      <path d="M5 19c4-6 8-9 12-10" />
    </>
  ),
  cloud: <path d="M6.5 18a4.2 4.2 0 0 1 .5-8.4 5 5 0 0 1 9.6 1.5A3.6 3.6 0 0 1 17.5 18z" />,
  car: (
    <>
      <path d="M4 13l1.8-4.6A2 2 0 0 1 7.7 7h8.6a2 2 0 0 1 1.9 1.4L20 13" />
      <path d="M3 13h18v4H3z" />
      <circle cx="7.5" cy="17.5" r="1.6" />
      <circle cx="16.5" cy="17.5" r="1.6" />
    </>
  ),
  wrench: <path d="M15.5 4.5a4.5 4.5 0 0 0-4 6.6L4 18.6 5.4 20l7.5-7.5a4.5 4.5 0 0 0 6.6-4l-2.8 2.8-2-.6-.6-2z" />,
  gauge: (
    <>
      <path d="M4 16a8 8 0 1 1 16 0" />
      <path d="M12 16l4-3" />
    </>
  ),
  church: (
    <>
      <path d="M12 2v4M10 4h4" />
      <path d="M6 12l6-4 6 4" />
      <path d="M6 12v9h12v-9" />
      <path d="M10 21v-4h4v4" />
    </>
  ),
  heart: <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />,
  hardhat: (
    <>
      <path d="M5 16a7 7 0 0 1 14 0" />
      <path d="M10 9V6h4v3" />
      <path d="M3 16h18v2H3z" />
    </>
  ),
  ruler: (
    <>
      <path d="M4 15.5L15.5 4l4.5 4.5L8.5 20z" />
      <path d="M8 8l2 2M11 5l2 2M6 11l2 2M13.5 10.5l2 2" />
    </>
  ),
  truck: (
    <>
      <path d="M3 6h11v9H3z" />
      <path d="M14 9h4l3 3v3h-7z" />
      <circle cx="7" cy="18" r="1.6" />
      <circle cx="17" cy="18" r="1.6" />
    </>
  ),
  book: (
    <>
      <path d="M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2z" />
      <path d="M4 19a2 2 0 0 1 2-2h13" />
    </>
  ),
  ticket: (
    <>
      <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H6a2 2 0 0 1-2-2 2 2 0 0 0 0-4z" />
      <path d="M14 6.5v11" />
    </>
  ),
  camera: (
    <>
      <rect x="3" y="7" width="18" height="12" rx="2" />
      <circle cx="12" cy="13" r="3.2" />
      <path d="M8.5 7l1.3-2h4.4l1.3 2" />
    </>
  ),
  dumbbell: <path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10" />,
  stethoscope: (
    <>
      <path d="M6 3v5a4 4 0 0 0 8 0V3" />
      <path d="M10 12v3a5 5 0 0 0 10 0v-1" />
      <circle cx="20" cy="10" r="2" />
    </>
  ),
  pulse: <path d="M3 12h4l2.2-5.5 3.6 11L15 12h6" />,
  home: (
    <>
      <path d="M4 11l8-6 8 6" />
      <path d="M6 10v9h12v-9" />
      <path d="M10 19v-5h4v5" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="8" r="4" />
      <path d="M10.8 10.8L20 20M16 16l2.2-2.2M18.4 18.4l2-2" />
    </>
  ),
  star: <path d="M12 3l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8L3.6 9.1l5.8-.8z" />,
  scale: (
    <>
      <path d="M12 4v16M6 20h12" />
      <path d="M12 6l-6 2 3 5a3 3 0 0 1-6 0l3-5M12 6l6 2-3 5a3 3 0 0 0 6 0l-3-5" />
    </>
  ),
  box: (
    <>
      <path d="M12 3l8 4v10l-8 4-8-4V7z" />
      <path d="M4 7l8 4 8-4M12 11v10" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-6-5.5-6-10a6 6 0 0 1 12 0c0 4.5-6 10-6 10z" />
      <circle cx="12" cy="11" r="2.2" />
    </>
  ),
  factory: (
    <>
      <path d="M3 21V10l6 4V10l6 4V7l6 3v11z" />
      <path d="M3 21h18" />
    </>
  ),
  play: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8l6 4-6 4z" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="12" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
    </>
  ),
  utensils: (
    <>
      <path d="M6 3v8a2 2 0 0 0 4 0V3M8 11v10" />
      <path d="M17 3c-2 0-3 2-3 5s1 4 3 4v9" />
    </>
  ),
  tag: (
    <>
      <path d="M3 12V4h8l9 9-8 8z" />
      <circle cx="7.5" cy="7.5" r="1.4" />
    </>
  ),
  sprout: (
    <>
      <path d="M12 21v-9" />
      <path d="M12 13c0-3-2-5-6-5 0 4 3 6 6 5z" />
      <path d="M12 12c0-3 2-5 6-5 0 4-3 6-6 5z" />
    </>
  ),
};

/** Render a library glyph by name inside a standard 24x24 svg. Falls back to the cube glyph. */
export function IndustryIcon({ name }: { name: string }): ReactNode {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {ICONS[name] ?? ICONS.cube}
    </svg>
  );
}
