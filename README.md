# Nexoris Technologies Digital Platform

The monorepo for the Nexoris Technologies digital platform: the public marketing site, the
content platform, the Oge AI gateway, and the internal admin dashboard with its CRM module.

Nexoris Technologies designs and builds websites, web applications, mobile apps, and
business systems for companies in Nigeria and abroad. This platform is itself an example of
that work.

## Applications

| Path         | What it is                                                                               |
| ------------ | ---------------------------------------------------------------------------------------- |
| `apps/web`   | Marketing site (Next.js App Router). Hardcoded pages, programmatic SEO, and ISR content. |
| `apps/cms`   | Content platform (Strapi v5). Insights, authors, careers, legal, proof, pSEO drafts.     |
| `apps/oge`   | Oge AI gateway (NestJS). The only component that calls an AI provider.                   |
| `apps/admin` | Internal admin dashboard. Modular shell plus the CRM module.                             |

## Shared packages

| Path              | What it is                                                               |
| ----------------- | ------------------------------------------------------------------------ |
| `packages/config` | TypeScript, ESLint, Prettier, fonts, and the Tailwind brand preset.      |
| `packages/ui`     | The design system components.                                            |
| `packages/seo`    | Schema builders, metadata, the OG card generator, sitemaps, `check:seo`. |
| `packages/kb`     | The knowledge-base builder and ingestion pipeline.                       |
| `packages/brand`  | Logo, favicon, and Open Graph card sources.                              |
| `content-source`  | The approved Website Copy, read-only source of truth for page text.      |

## Requirements

- Node 22 LTS and pnpm 9.
- Docker, for the local PostgreSQL (with pgvector) and Meilisearch services.

## Getting started

```bash
pnpm install
cp .env.example .env          # fill in real values for local development
docker compose -f infra/docker-compose.yml up -d
pnpm dev
```

## Workspace commands

| Command           | What it does                                        |
| ----------------- | --------------------------------------------------- |
| `pnpm dev`        | Run every app in development.                       |
| `pnpm build`      | Build the whole workspace.                          |
| `pnpm lint`       | Lint every package and app.                         |
| `pnpm type-check` | Type-check every package and app.                   |
| `pnpm test`       | Run all tests.                                      |
| `pnpm check:seo`  | The SEO gate over every route.                      |
| `pnpm check:a11y` | The accessibility gate (axe-core) over every route. |

## Build state

This platform is built and committed stage by stage. The authoritative progress record lives in
`.nexoris/build-state.json`, with a human-readable log in `.nexoris/BUILD_PROGRESS.md` and
a dated decision log in `.nexoris/DECISIONS.md`.

## Domain and contact

- Website: `https://nexoristech.com`
- General: `hello@nexoristech.com`
- New business: `business@nexoristech.com`
- Careers: `careers@nexoristech.com`
