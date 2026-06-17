# Nexoris Technologies Digital Platform: Build Progress

A human-readable log of what was done, decisions made, and open questions. The
authoritative machine-readable checklist lives in `build-state.json`.

## Current position

- **Stage:** Stage 1, packages/seo and the check:seo gate (in progress).
- **Next action:** Implement the `buildMetadata` helper (title within 60 characters,
  description 155 to 160 with 160 the hard maximum, trailing-slash-consistent canonical and
  Open Graph URLs) with unit tests, then the JSON-LD `@graph` builders for every node and
  route class with the NG locale facts and omission rules.

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
