# Nexoris Technologies Digital Platform: Build Progress

A human-readable log of what was done, decisions made, and open questions. The
authoritative machine-readable checklist lives in `build-state.json`.

## Current position

- **Stage:** Stage 3, hardcoded content modules (in progress).
- **Done so far:** the content-module system and content-fidelity test; all 5 core pages; all 11
  service pages; 2 of 20 industry pages (Education, Healthcare). 18 of 36 hardcoded pages
  complete, every one passing the fidelity check.
- **Next action:** Continue the industry pages verbatim from
  `content-source/03-industry-pages.md` in batches (next: Hospitality, Restaurants, Retail &
  E-Commerce, Real Estate), each added to `industries/index.ts` and confirmed by the fidelity
  test, until all 20 are done. Then mark Stage 3 complete and advance to Stage 4 (rendering the
  pages with Next.js), where the Figma logo, favicon, and OG card renderer are produced.

## Log

### 2026-06-17

- Initialised a standalone git repository at `nexoristech` on the `main` branch. This is the
  monorepo root, confirmed by the product owner.
- Created the `/.nexoris/` control system: `build-state.json` (seeded with the eleven
  delivery stages and their tasks), `BUILD_PROGRESS.md`, and `DECISIONS.md`.
- Created the directory skeleton: `apps/{web,cms,oge,admin}`,
  `packages/{ui,seo,config,kb,brand}`, `content-source`, `infra`, `ci`, `docs`.
- **Stage 0 complete.** Scaffolded the pnpm and Turborepo workspace: root config
  (`package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.gitignore`, `.gitattributes`,
  `.npmrc`, `.nvmrc`, `.env.example`, root ESLint and Prettier). Built `packages/config` with
  the design tokens and the Tailwind brand preset encoding PRD Part One, Section 14.
  Scaffolded `packages/{ui,seo,kb,brand}` and the four apps. Added
  `infra/docker-compose.yml` (PostgreSQL with pgvector and Meilisearch, pinned tags) and a
  database init script. Wired the CI workflow and the `check:seo` and `check:a11y` failing
  stubs. Placed the PRD at `docs/PRD.md` and the approved copy at `content-source/`.
  Verified: `pnpm type-check`, `lint`, `test`, `build`, and `format:check` all green; the two
  gates fail by design. Committed at `3b05ffb`.
- **Stage 1 complete.** Built `packages/seo` before any page. Added the locale and entity
  constants, the trailing-slash-consistent URL helpers, and the `buildMetadata` helper
  enforcing the meta limits. Added the JSON-LD `@graph` builders (site-wide Organization,
  ProfessionalService, WebSite with SearchAction, founder Person; WebPage subtypes;
  BreadcrumbList; ImageObject; Service; FAQPage; Article and BlogPosting with author and
  reviewer; ProfilePage; JobPosting; case study) with the `prune` omission rule, assembled
  per page by `buildPageGraph`. Added split sitemaps, robots.txt, and llms.txt. Built the real
  `check:seo` gate: a rule engine covering every PRD 9.11 rule plus no-duplicate-slugs, with a
  CLI that crawls the build manifest, anchored to the workspace root, passing with zero routes
  and turning red on any real violation. The framework-agnostic OG card model is in place; the
  PNG renderer lands with brand assets (decision D-007). Verified: 60 unit tests pass; the
  gate correctly passes an empty manifest and fails a broken one; type-check, lint, and build
  green. The `check:a11y` gate remains a failing stub until Stage 2.
- **Stage 2 complete.** Built `packages/ui` as a React and Tailwind design system consuming
  the brand preset. Added the global focus ring, reduced-motion rules, and skip link; the
  three font contexts with self-hosted OFL variable woff2 in `packages/brand`; the
  foundational primitives (Button, Container, Section, SkipLink, VisuallyHidden); the four data
  states; the responsive table (stacked-card and frozen-first-column patterns); the
  keyboard-correct Flyout disclosure with MegaMenu; the MobileNav drawer with AccordionItem
  and a focus trap; and the mobile FloatingTableOfContents. Replaced the `check:a11y` stub
  with a real axe-core gate (serious and critical block). Verified: both root gates
  (`check:seo`, `check:a11y`) now pass, and the full workspace is green. The route-level
  Playwright axe pass (including colour contrast) is added in Stage 4. The header logo, favicon,
  and OG card PNG are produced from the Figma logo when the pages are built (Stage 4).

## Open questions for the product owner

These are recorded so the build can pause at the right moment rather than fabricate values.
None block Stage 0 scaffolding, which uses placeholder `.env.example` values only.

1. **GitHub repository URL** and the default branch, needed before the first push.
2. **PostgreSQL credentials** for `nexoris_cms`, `nexoris_oge`, and `nexoris_admin`
   (host, port, user, password, database name for each), needed when services run.
3. **VPS media details**: the path on disk and the public base URL the VPS serves files
   from, needed for the media pipeline.
4. **AI provider keys**: `GEMINI_API_KEY_PROJECT_A`, `GEMINI_API_KEY_PROJECT_B`,
   `GROQ_API_KEY`, and `SAMBANOVA_API_KEY`, needed from Stage 6 onward. All live only
   in `apps/oge`.
5. **Logo source files**: to be pulled from the Figma file via the Figma connection when
   branding begins (Stage 2).

## Tooling notes

- Node v22.14.0 (LTS), npm 11.16.0, git 2.46.0.
- pnpm 9.15.9 installed at the user level via npm.
- Docker is not installed on this machine. The `infra/docker-compose.yml` is written and
  committed, but running local PostgreSQL and Meilisearch will require Docker to be
  installed before those services can start.
