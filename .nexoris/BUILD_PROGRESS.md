# Nexoris Technologies Digital Platform: Build Progress

A human-readable log of what was done, decisions made, and open questions. The
authoritative machine-readable checklist lives in `build-state.json`.

## Current position

- **Stage:** Stage 4, the 33 hardcoded marketing pages (in progress, foundation complete).
- **Done in Stage 4 so far:** the Next.js App Router app renders all 36 hardcoded pages
  (catch-all route, `trailingSlash: true`), the PageRenderer for every section kind, the real
  Nexoris Technologies logo and the favicon/PWA icon set, the catalogue-driven mega-flyout
  header (Services, Industries, Company, scroll state, mobile drawer) and the five-column
  footer, the SEO build manifest with `check:seo` validating all 36 real routes (zero issues),
  `/sitemap.xml`, `/robots.txt`, `/llms.txt`, and the branded `/api/og` card. Whole workspace
  green: type-check, test, lint, build, check:seo, check:a11y.
- **Remaining in Stage 4:** the home filterable industries grid and Solution Finder section
  shell; Lighthouse CI / Core Web Vitals budgets; route-level Playwright axe; and the
  content-API proof bands (empty until the CMS in Stage 7). Re-export a crisp vector logo and
  pull the Covyvo/GLEEN mockups and section photography when the Figma quota resets.

### 2026-06-19: credentials received; Stage 6 model registry

- **Secrets received and stored** in the gitignored `.env` only (never committed): the three
  PostgreSQL strings (`nexoris_cms`, `nexoris_oge`, `nexoris_admin`), the Gemini Project A and B
  keys, the Mistral key, the Groq key, and the VPS media disk path. `.env.example` keeps
  placeholders, with `SAMBANOVA_API_KEY` replaced by `MISTRAL_API_KEY`. Recorded as
  DECISIONS D-012, with two data issues flagged: the `nexoris_oge` URL was sent with a
  duplicated port (`:5435:5435`), corrected to `:5435` and confirmed by the product owner; and
  only the media disk path was supplied, so `VPS_MEDIA_BASE_URL` stays provisional.
- **GitHub**: `origin` set to https://github.com/Nexoris25/nexoristech.git and `main` pushed
  (confirmed by the product owner). `.env` is gitignored, so no secret left the machine.
- **AI provider stack change** (SambaNova removed, Mistral added) applied to the model
  registry: `apps/oge/src/config/models.ts` pins the five functional groups (Website Bot, CRM
  Worker, CMS AI, Service Recommender, and Embeddings) with their primary and two-level
  backup chains, pure key-routing and override helpers, and 12 tests. Model identifiers are
  provisional defaults, overridable by env, flagged to verify against provider docs before
  production. apps/oge is now a real ESM package; the whole workspace stays green
  (type-check 11, test 10, lint 11, build 7).
- **Still to build in Stage 6** (now unblocked): the NestJS HTTP runtime, the provider clients
  walking each chain, embedding + pgvector storage in `nexoris_oge`, hybrid (vector +
  Meilisearch) retrieval, the two cache layers and quota governor, the grounded chat SSE
  endpoint with the verbatim Oge system prompt, Oge lead capture, the Solution Finder
  rationale under strict JSON, and the extractive fallback with handoff.

### 2026-06-18 (later): no-secret work between stages

- **Home industries grid** built (filterable, the `#industries` anchor target); committed.
- **The branded `/api/og` card** added; committed.
- **packages/kb** built beyond the stub (no secrets): the deterministic block-aware chunker
  (about 800 tokens, 100 overlap, never splitting a paragraph, FAQ pair, or answer block) and
  `buildKnowledgeBase` carrying source URLs, plus `apps/web` `hardcodedKbSources` flattening
  all 36 pages into KB sources. 9 + 4 tests. This is the Stage 6 knowledge-base foundation; the
  embedding, pgvector storage, and re-ingestion need apps/oge, the `nexoris_oge` database, and
  the AI keys.
- **404 and error pages** added in the house voice.
- The whole workspace stays green: type-check, test, lint, build, check:seo, check:a11y.
- **Waiting on the product owner** for DB credentials before wiring the Solution Finder and
  Contact form (Stage 5), and the AI provider keys before the Oge ingestion (Stage 6).
- **Stage 3 complete:** the content-module system, the content-fidelity test, all 5 core pages,
  all 11 service pages, and all 20 industry pages, transcribed verbatim from `content-source`
  and verified by 40 passing fidelity tests with every meta within limits. All 36 hardcoded
  pages exist as typed content modules, aggregated in `apps/web/src/content` as
  `corePages`, `servicePages`, `industryPages`, `allHardcodedPages`, and `pagesBySlug`.
- **Next action:** Scaffold `apps/web` as a Next.js App Router app (`trailingSlash: true`),
  wire the design-system styles and self-hosted fonts, build the section renderers for each
  content-module section kind, the header, footer, and shell with the catalogue, and generate
  routes from `pagesBySlug` using `buildMetadata` and `buildPageGraph`. Pull the Nexoris
  Technologies logo from the Figma file for the header, favicon, and the OG card renderer.

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
