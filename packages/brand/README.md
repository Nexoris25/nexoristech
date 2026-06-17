# @nexoris/brand

Brand asset sources for the Nexoris Technologies platform.

This package holds the master logo sources and the assets derived from them, used
consistently across all three surfaces: the website (`apps/web`), the internal admin
dashboard including its CRM module (`apps/admin`), and the Strapi admin (`apps/cms`).

## Planned contents (built in Stage 2, from the logo the product owner provides)

- `assets/logo/` — the Nexoris Technologies logo with the background removed, in a white
  version and a purple version (`#543CDA`), as transparent PNG and, where the source
  allows, clean SVG.
- `assets/favicon/` — `favicon.svg`, `favicon.ico`, the 192px and 512px manifest PNGs, and
  the apple-touch icon, generated once and shared across all three surfaces.
- `assets/og/` — the branded Open Graph card template rendered at 1200x630 PNG.

## Logo usage rule (PRD and build prompt Section 3)

- White logo on dark surfaces: the dark hero and the ink-950 footer.
- Purple or dark logo on light surfaces, choosing per placement whichever gives the cleaner,
  higher-contrast result.
- The header logo switches with the header state: white over the transparent dark hero, then
  the dark or purple version once the header turns solid white on scroll.

## Status

Awaiting the logo source files, to be pulled from the Figma file via the Figma connection
when Stage 2 (branding and design system) begins.
