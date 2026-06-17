# Nexoris Technologies Digital Platform: Build Progress

A human-readable log of what was done, decisions made, and open questions. The
authoritative machine-readable checklist lives in `build-state.json`.

## Current position

- **Stage:** Stage 0, monorepo scaffold (in progress).
- **Next action:** Create the monorepo root config, shared packages, app scaffolds,
  docker-compose, and `.env.example`, then place the PRD and the approved Website Copy.

## Log

### 2026-06-17

- Initialised a standalone git repository at `nexoristech` on the `main` branch. This is the
  monorepo root, confirmed by the product owner.
- Created the `/.nexoris/` control system: `build-state.json` (seeded with the eleven
  delivery stages and their tasks), `BUILD_PROGRESS.md`, and `DECISIONS.md`.
- Created the directory skeleton: `apps/{web,cms,oge,admin}`,
  `packages/{ui,seo,config,kb,brand}`, `content-source`, `infra`, `ci`, `docs`.

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
