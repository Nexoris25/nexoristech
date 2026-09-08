# Nexoris Technologies Platform: Launch Runbook

The deploy sequence for the four apps on the VPS, with the webhooks, DNS, search,
knowledge-base ingest, and the provider-fallback smoke tests (PRD Stage 10). Run the
steps in order. Every secret lives in environment variables, never in the repository.

## 1. Prerequisites

- The VPS PostgreSQL at `194.147.95.7:5435` with the three databases (`nexoris_cms`,
  `nexoris_oge`, `nexoris_admin`) and the `nexoristech` role. pgvector is installed in
  `nexoris_oge`.
- Meilisearch reachable (admin and search keys).
- Node 22 LTS and pnpm 9 on the VPS. A process manager (for example pm2 or systemd) for
  the three long-running Node services.

## 2. Environment

Set these in the deploy environment (see `.env.example` for the full list and where each file
goes). They are the single source of truth; nothing is hardcoded.

This list is the set the code actually reads, checked against it rather than remembered. A
variable not named here is not looked up by anything, and a missing one below fails quietly
rather than loudly, which is why each says what breaks without it.

**Origins.** The two most commonly missed, because nothing errors when they are absent:

- `APP_URL` — this admin's own public origin, e.g. `https://app.nexoristech.com`.
  Invitation and password-reset links are built from it. Unset, the app falls back to the
  request host, which is right behind a proxy that sets `x-forwarded-host` and wrong
  everywhere else: the recipient gets a link they cannot open.
- `WEB_ORIGIN` — the public website, e.g. `https://nexoristech.com`. Publishing in the CMS
  calls its revalidation route. Unset, it falls back to the canonical site origin compiled
  into `packages/seo`, so publishing appears to work and revalidates the wrong host if the
  site is served from anywhere else.
- `OGE_GATEWAY_URL` — where the gateway listens, e.g. `http://127.0.0.1:4000`. Loopback is
  correct when the website and the gateway share a host, which is the intended deployment;
  the browser never calls the gateway directly, so it needs no public port. Unset, every
  caller falls back to `http://localhost:4000`, which is the same thing until the day the
  gateway moves.

The System tab under Settings shows all three as the running process sees them, and marks a
loopback address in production so a development value left behind is visible.

**The rest:**

- `NODE_ENV=production`.
- Databases: `DATABASE_URL_ADMIN`, `DATABASE_URL_CMS`, `DATABASE_URL_OGE`.
- Admin auth and secrets: `ADMIN_SESSION_SECRET` (signs the session cookie),
  `ADMIN_SETTINGS_KEY` (64 hex characters; seals the secrets held in settings — losing it
  makes every sealed value unreadable).
- Shared secrets, generated strong: `REVALIDATION_SECRET`, `OGE_REINGEST_SHARED_SECRET`.
- AI providers (apps/oge only): `GEMINI_API_KEY_PROJECT_A`, `GEMINI_API_KEY_PROJECT_B`,
  `MISTRAL_API_KEY`, `GROQ_API_KEY`.
- Search: `MEILISEARCH_HOST`, `MEILISEARCH_API_KEY`.
- Media: `CMS_MEDIA_BASE` — where uploaded media is served from in production.
- Google, for the SEO screens: `GSC_PROPERTY` (e.g. `sc-domain:nexoristech.com`),
  `GA4_PROPERTY_ID` (the numeric id), and Application Default Credentials on the host. No
  JSON key is downloaded or committed.
- Search engines: `INDEXNOW_KEY`.
- Gateway: `OGE_PORT`.
- Seeding the first administrator, once: `ADMIN_SEED_EMAIL`, `ADMIN_SEED_NAME`,
  `ADMIN_SEED_PASSWORD`.
- e-Invoicing, only when the NRS integration is switched on: `NRS_SIAPP_ENDPOINT`,
  `NRS_SIAPP_BUSINESS_ID`, `NRS_SIAPP_SERVICE_ID`, `NRS_SIAPP_CRYPTO_KEY`.

## 3. Build

From the repo root: `pnpm install` then `pnpm -w run build`. Confirm the gates are green:
`pnpm -w run type-check`, `pnpm -w run test`, `pnpm -w run lint`, `pnpm -w run check:seo`,
`pnpm -w run check:a11y`.

## 4. Databases

1. Oge store and caches: `pnpm --filter @nexoris/oge db:migrate` (creates kb_chunk with
   pgvector, the two caches, the gap report).
2. Admin CRM store: `pnpm --filter @nexoris/oge db:migrate:admin` (the lead table) then
   `pnpm --filter @nexoris/admin db:migrate` (staff, audit log, activity, lead assignment).
3. First admin account:
   `ADMIN_SEED_EMAIL=... ADMIN_SEED_PASSWORD=... pnpm --filter @nexoris/admin db:seed:admin`.
4. The CMS (Strapi) creates and migrates its own tables on first `start`, and grants the
   Public role read access on boot.

## 5. Start the services

- apps/cms (Strapi): `pnpm --filter @nexoris/cms build` then `... start` (port 1337).
- apps/oge (gateway): `pnpm --filter @nexoris/oge build` then `... start` (port 4000).
- apps/admin (dashboard): `pnpm --filter @nexoris/admin build` then `... start` (port 3001).
- apps/web (site): `pnpm --filter @nexoris/web build` then `... start` (port 3000).

Put a reverse proxy in front: the public domain to apps/web, the CMS admin and content API
to apps/cms, and a private route or network for apps/oge and apps/admin.

## 6. Knowledge-base ingest (production)

1. `pnpm --filter @nexoris/web kb:export` writes `artifacts/knowledge-base.json` from the
   hardcoded pages.
2. `pnpm --filter @nexoris/oge kb:ingest` embeds the chunks into pgvector and indexes them in
   Meilisearch. Verify with `pnpm --filter @nexoris/oge kb:retrieve "how much does a website cost"`.
3. Published CMS content re-ingests automatically on publish through the webhook (step 7).

## 7. Webhooks

The CMS calls, on publish/unpublish/delete:

- Revalidate: `POST {WEB_URL}/api/revalidate/` with header `x-revalidate-secret`.
- Re-ingest: `POST {OGE_GATEWAY_URL}/reingest` with header `x-reingest-secret`.

Confirm `REVALIDATION_SECRET` and `OGE_REINGEST_SHARED_SECRET` match across apps/cms,
apps/web, and apps/oge.

## 8. DNS, search, and sitemaps

- Point the apex domain at the apps/web reverse proxy. Confirm HTTPS and that the security
  headers are present (CSP, HSTS, X-Frame-Options, etc.).
- Submit `https://nexoristech.com/sitemap.xml` to Google Search Console and verify the
  property. `robots.txt` and `llms.txt` are served at the root.

## 9. Provider-fallback smoke tests (PRD 10.7)

With the gateway running, confirm each slot answers in isolation by temporarily removing the
slot above it (unset its key) and asking a question:

- Website bot: Gemini Flash, then Llama 4 Scout (Groq), then Ministral 8B; with all three down,
  the chat shows the extractive handoff panel and no stack trace.
- Embeddings: Mistral Embed, then Gemini Embeddings (1024 dimensions).
- CRM Worker draft and scoring: Mistral Large, then Gemini Flash, then GPT-OSS 120B (Groq).

Also confirm: the pricing question returns no invented figure; an off-topic request gets a
one-sentence decline; a re-asked question hits the cache; the Contact form delivers a scored
lead to the CRM; and the rate limits return a graceful message rather than an error.

## 10. Post-launch

Pre-warm the exact-match cache from the gap report, watch the SLA board, and grow the
Insights and programmatic layers one data-complete page at a time (Stage 11).
