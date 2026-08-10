# Nexoris Technologies Digital Platform

A pnpm and Turborepo monorepo holding the public website, the internal admin platform, and the AI
gateway that serves both.

## Applications

| Path         | What it is                                                                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/web`   | The marketing site. Next.js App Router, built with webpack. Hardcoded pages transcribed from the approved design handoff, plus Insights, case studies, careers, legal pages and programmatic SEO pages read from the CMS database. |
| `apps/admin` | The internal platform: CRM, Finance, HR, Payroll, NRS e-invoicing, and the CMS. Next.js App Router.                                                                   |
| `apps/oge`   | The Oge AI gateway. NestJS. The only process holding AI provider keys, and the only one that talks to the knowledge base.                                             |

## Shared packages

| Path                 | What it is                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------ |
| `packages/seo`       | Metadata, canonicals, Open Graph and X cards, schema.org, sitemap and robots, and the `check:seo` gate. |
| `packages/ui`        | Shared primitives and the self-hosted font faces.                                                  |
| `packages/pseo`      | The programmatic-SEO proof ladder and publish quality gate.                                        |
| `packages/recommend` | The deterministic service and industry matching behind the Solution Finder.                        |
| `packages/kb`        | Knowledge-base source extraction for the gateway.                                                  |
| `packages/brand`     | Brand assets, including the font files each app serves from `/fonts`.                              |
| `packages/config`    | Shared TypeScript, ESLint and Tailwind configuration.                                              |

## The CMS

The CMS is a module inside `apps/admin`, under the `(cms)` route group. It is not a separate
application and not Strapi: Strapi was removed, and an earlier version of this file still described
it. Content lives in the `nexoris_cms` PostgreSQL database, which `apps/web` queries directly rather
than through a content API.

It covers Insights, categories, authors and their bios, case studies, testimonials, jobs, legal
pages, media, redirects, the review queue, SEO operations including Search Console and programmatic
pages, and the Oge editorial assistant that drafts metadata, summaries, FAQs, author bios, alt text
and internal-link suggestions for an editor to approve. Nothing it drafts publishes itself.

Publishing an item revalidates the affected website routes, the sitemap and `llms.txt`, and submits
the URL to IndexNow.

## Databases

Three PostgreSQL databases on one server: `nexoris_cms`, `nexoris_admin` and `nexoris_oge`. There is
no Docker Compose and no local database service; connection strings point at the PostgreSQL instance
directly. See `.env.example`, which also covers the one thing that changes when the code is deployed
onto the same machine as PostgreSQL.

## Requirements

- Node 22
- pnpm 9

## Getting started

```bash
pnpm install
cp .env.example .env    # then fill in real values
pnpm dev
```

`apps/admin` and `apps/web` also read their own `.env.local`, because Next.js does not look above the
app directory. `.env.example` lists which values belong in which file.

## Commands

| Command            | What it does                                                        |
| ------------------ | ------------------------------------------------------------------- |
| `pnpm dev`         | Run every app in development.                                       |
| `pnpm build`       | Build the whole workspace.                                          |
| `pnpm lint`        | Lint every package and app.                                         |
| `pnpm type-check`  | Type-check every package and app.                                   |
| `pnpm test`        | Run every test suite.                                               |
| `pnpm check:seo`   | The SEO gate over every route: canonicals, metadata, schema, robots. |
| `pnpm check:a11y`  | The static accessibility gate.                                      |

Two more run from `apps/web`, against a built site in a real browser:

```bash
pnpm --filter @nexoris/web test:a11y    # axe over every route
pnpm --filter @nexoris/web lhci         # Lighthouse budgets
```

CI runs all of these on every push and pull request to `main`.

## A note on the build

Both Next.js apps build with `next build --webpack`, and this is deliberate. The source uses `.js`
specifiers that resolve to TypeScript files, which relies on webpack's `extensionAlias`. Turbopack
does not apply that mapping, so switching the build over silently breaks module resolution.
