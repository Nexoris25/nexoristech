# Architecture and Product Decisions

An append-only, dated log of architecture and product decisions, and a record of which
assets and credentials the product owner provided. Secret values are never written here,
only the fact that they were received.

---

## 2026-06-17

### D-001: Repository location and version control

The monorepo root is `C:\Users\CNED\Desktop\nexoristech`. A fresh standalone git
repository was initialised here on the `main` branch. The folder previously sat inside a git
repository rooted at the user's home folder; that repository is left untouched and is not used
for this project. Confirmed by the product owner.

### D-002: Trailing slash on every URL

The product owner requires the server to automatically append a trailing slash to every URL,
for example `nexoristech.com/about-us/` rather than `nexoristech.com/about-us`. This is
implemented with Next.js `trailingSlash: true`. To stay consistent with the SEO rules, the
canonical, Open Graph, sitemap, and `metadataBase` URLs all use the trailing-slash form for
content pages, while the site root canonical remains `https://nexoristech.com` (the bare root,
which has no path segment to slash). This keeps `og:url` equal to the canonical on every
page, as the SEO gate requires.

### D-003: Package manager and toolchain

pnpm 9.15.9 (installed via npm at the user level, since Corepack could not write to the
Node install directory). Node v22.14.0 LTS. Turborepo for the monorepo task graph.

### D-004: Docker not present on the build machine

Docker is not installed locally. `infra/docker-compose.yml` is authored and committed using
official, pinned images (PostgreSQL with pgvector, Meilisearch), but local services cannot
run until Docker is installed. Recorded so a later stage that needs running services knows to
prompt for this.

### D-005: Brand and contact assets received from the product owner

The following were provided and will be used for the footer, the Organization `sameAs`
schema, and contact details:

- LinkedIn: https://www.linkedin.com/company/nexoris-technologies
- Instagram: https://www.instagram.com/nexoristechnologies/
- Facebook: https://web.facebook.com/people/Nexoris-Technologies/61575547172687/
- X: https://x.com/Nexoristech
- TikTok: https://www.tiktok.com/@nexoristechnologies
- Threads: https://www.threads.com/@nexoristechnologies
- Phone and WhatsApp: +2349138133224
- Founder LinkedIn (Chinedu Nwogu): https://www.linkedin.com/in/chinedu-nwogu/
- Covyvo and GLEEN mockups: to be pulled from the Figma demo site via the Figma
  connection (node referenced by the product owner).

Note: the Website Copy footer (Part One, Section 7.8) lists WhatsApp, LinkedIn, X,
Instagram, and YouTube. The product owner supplied TikTok and Threads and did not
supply a YouTube link. The footer will use the verified handles provided; the YouTube link is
omitted until one is provided, and TikTok and Threads are added since they were supplied.
This is recorded as a copy-vs-asset reconciliation to confirm with the product owner.

### D-009: Two interim hrefs to confirm

Two CTA targets in the approved core-page copy do not map to an existing route or a supplied
asset. The label text is rendered verbatim; the link target is interim and flagged for the
product owner:

- How We Work, hero secondary CTA "Download the service catalogue": no catalogue PDF has
  been supplied and no route exists. Interim `href` is `#service-catalogue`. Needs either the
  PDF asset or a decision to drop the CTA.
- Home, services footer link "See everything we do": there is no services index route (services
  are flat and reached via the flyout). Interim `href` is the on-page `#services` anchor.

The Covyvo and GLEEN "Visit the ... website" outbound links are intentionally omitted per PRD
1.7 (the sites are not live yet); they are added when the sites go live.

### D-008: Self-hosted variable fonts

The four required families (Plus Jakarta Sans, Inter, Lora, JetBrains Mono, PRD 14.1) are all
licensed under the SIL Open Font License 1.1. The variable `woff2` builds were fetched from
the Fontsource distribution on the official jsDelivr CDN and stored in
`packages/brand/assets/fonts`, then served self-hosted from each app's `/fonts` so the site
does not depend on a third-party font CDN at runtime. Licence and source are recorded in the
fonts README.

### D-007: Open Graph card rendering split

The branded Open Graph card (1200x630 PNG, PRD 9.3) has two parts. The content model and
the brand spec (colours, dimensions, layout intent) live in `packages/seo` (`og.ts`) so every
surface and any future property reuses one consistent card. The actual PNG rendering depends
on the brand fonts and the logo, which arrive with the Stage 2 branding work, so it is wired in
the `apps/web` `opengraph-image` route then. This keeps the engine framework-agnostic and
avoids shipping a renderer before its assets exist. The `defaultOgImage` in `metadata.ts`
already points each page at its `opengraph-image` route, so no metadata changes are needed
when the renderer lands.

### D-006: Pending credentials and assets

Not yet provided (recorded as open questions in `BUILD_PROGRESS.md`, none blocking Stage
0): GitHub repository URL, the three PostgreSQL connection sets, the VPS media path and
public base URL, and the four AI provider keys. These will be requested when the stage that
needs them begins.
