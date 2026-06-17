/**
 * Nexoris Technologies design tokens.
 *
 * The single source of truth for the design system described in the Product Requirements
 * Document, Part One, Section 14. Encoded once here and consumed by the Tailwind brand
 * preset so tokens never drift across the website, the CMS admin, and the internal admin
 * dashboard.
 *
 * Colour principle: purple is the voltage, not the wallpaper. Roughly 80 percent neutral
 * surfaces, 15 percent ink, 5 percent purple. One purple element per viewport.
 */

/** Colour system around the primary purple #543CDA, with verified contrast (PRD 14.5). */
export const colors = {
  // Primary purple. Buttons, links, active states, key icons.
  // White text on it 6.9:1 (AA at every size); as text or icons on white 6.9:1 (AA).
  purple: {
    100: "#EEEBFC", // Tinted section backgrounds and tag pills. Ink-950 text on it above 17:1.
    200: "#DCD6F9", // Borders and dividers on tinted surfaces. Decorative.
    500: "#6A55F2", // Gradient partner, focus rings, chart accents on dark.
    600: "#543CDA", // Primary.
    700: "#4330B8", // Hover and pressed. White on it 9.3:1 (AAA).
  },
  // Ink. Dark surfaces and headline text on light.
  ink: {
    800: "#1C1438", // Cards and secondary surfaces on dark sections. White on it above 15:1.
    950: "#0D0A1C", // Hero and footer backgrounds, headline text on light. White on it 19.5:1.
  },
  neutral: {
    50: "#FAFAFC", // Default page background.
    600: "#555269", // Secondary text on light, a violet-tinted grey. On white 7.2:1 (AA).
  },
  // Success states and live metrics. Dark surfaces only. On ink-950 12:1.
  // Never used as text on white, and never the only carrier of meaning.
  mint: {
    400: "#2EE6A8",
  },
  white: "#FFFFFF",
} as const;

/**
 * Single 4px-based spacing scale, used everywhere, with no arbitrary values (PRD 14.3).
 * Section padding is 120px desktop and 64px mobile.
 */
export const spacing = {
  0: "0px",
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  6: "24px",
  8: "32px",
  12: "48px",
  16: "64px",
  24: "96px",
  30: "120px",
} as const;

/** Card radius is 12px throughout (PRD 14.4). */
export const radius = {
  card: "12px",
} as const;

/**
 * One restrained, layered shadow system tinted with purple at about 4 percent opacity
 * rather than grey, in three steps only (PRD 14.4). No hard black drop shadows.
 */
export const shadows = {
  subtle: "0 1px 2px rgba(84, 60, 218, 0.04), 0 2px 8px rgba(84, 60, 218, 0.04)",
  medium: "0 4px 12px rgba(84, 60, 218, 0.04), 0 8px 24px rgba(84, 60, 218, 0.04)",
  prominent: "0 8px 24px rgba(84, 60, 218, 0.04), 0 16px 48px rgba(84, 60, 218, 0.04)",
} as const;

/**
 * Typography by context (PRD 14.1). All fonts are free, self-hosted as variable woff2 with
 * font-display swap and size-adjusted fallbacks so nothing shifts on load.
 */
export const fontFamilies = {
  // Marketing pages: hero headlines and feature subheads.
  jakarta: ["Plus Jakarta Sans", "ui-sans-serif", "system-ui", "sans-serif"],
  // Marketing body, and all dashboard text.
  inter: ["Inter", "system-ui", "sans-serif"],
  // Articles: headline and body, chosen for long-form reading comfort.
  lora: ["Lora", "Georgia", "ui-serif", "serif"],
  // API codes, IDs, and money amounts in dashboards.
  mono: ["JetBrains Mono", "ui-monospace", "monospace"],
} as const;

/** A Tailwind font-size entry: a [size, configuration] tuple. */
export type FontSizeValue = [string, { lineHeight: string; letterSpacing?: string }];

/**
 * Fluid responsive type scales using clamp, all in rem so user font-size settings are
 * respected and layouts hold at 200 percent browser zoom (PRD 14.2).
 */
export const fontSize: Record<string, FontSizeValue> = {
  // Marketing pages.
  hero: ["clamp(2.125rem, 1.55rem + 2.6vw, 4rem)", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
  section: [
    "clamp(1.625rem, 1.3rem + 1.5vw, 2.5rem)",
    { lineHeight: "1.2", letterSpacing: "-0.01em" },
  ],
  subhead: ["clamp(1.25rem, 1.1rem + 0.7vw, 1.75rem)", { lineHeight: "1.3" }],
  body: ["clamp(1rem, 0.96rem + 0.2vw, 1.125rem)", { lineHeight: "1.65" }],
  label: ["0.875rem", { lineHeight: "1.4" }],

  // Articles.
  "article-h1": [
    "clamp(2rem, 1.5rem + 2.2vw, 3rem)",
    { lineHeight: "1.2", letterSpacing: "-0.01em" },
  ],
  "article-h2": ["clamp(1.5rem, 1.25rem + 1vw, 2rem)", { lineHeight: "1.25" }],
  "article-h3": ["clamp(1.25rem, 1.1rem + 0.6vw, 1.5rem)", { lineHeight: "1.3" }],
  "article-body": ["clamp(1.0625rem, 1rem + 0.25vw, 1.25rem)", { lineHeight: "1.75" }],
  eyebrow: ["0.8125rem", { lineHeight: "1.4", letterSpacing: "0.06em" }],

  // Dashboards (CMS admin and the internal admin dashboard).
  "dash-title": ["clamp(1.5rem, 1.3rem + 0.8vw, 1.875rem)", { lineHeight: "1.2" }],
  "dash-section": ["1.25rem", { lineHeight: "1.3" }],
  "dash-table-header": ["0.8125rem", { lineHeight: "1.4", letterSpacing: "0.02em" }],
  "dash-data": ["0.875rem", { lineHeight: "1.5" }],
};

/** Maximum line length on article body, for comfortable long-form reading (PRD 14.2). */
export const measure = {
  article: "68ch",
} as const;

/**
 * The signature motion: a thin purple line that traces along section dividers as the page
 * scrolls (PRD 14.6). The single motion idea on the site, off entirely under
 * prefers-reduced-motion.
 */
export const motion = {
  dividerTraceDurationMs: 600,
} as const;

export const breakpoints = {
  // The site and all dashboards are usable and correct down to 280px (PRD 14.7).
  xs: "320px",
  sm: "414px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1440px",
} as const;
