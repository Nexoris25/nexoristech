# CI

The runnable CI workflow lives at `.github/workflows/ci.yml`, because GitHub Actions only
reads workflow files from `.github/workflows/`. This directory holds CI documentation and any
supporting scripts that are not themselves GitHub workflow files.

## Gates (all block a merge)

- `pnpm lint`, `pnpm type-check`, `pnpm test`, `pnpm build` across the workspace.
- `pnpm check:seo`: the SEO gate over every route (built in Stage 1; a failing stub until then).
- `pnpm check:a11y`: the accessibility gate, axe-core over every route (built in Stage 2; a
  failing stub until then).

Lighthouse CI budget checks and the content-fidelity byte-diff are added in their stages
(Stage 4 and Stage 3 respectively).
