# content-source

The approved Website Copy, the read-only source of truth for page text across the platform.

- `00-overview-and-voice.md` — the voice rules and the document overview.
- `01-core-pages.md` — Part 1, Core Pages (Home, About, How We Work, Contact, Case
  Studies, Insights, Careers, and the global navigation and footer copy).
- `02-service-pages.md` — Part 2, the 11 Service Pages.
- `03-industry-pages.md` — Part 3, the 20 Industry Pages.
- `04-legal-pages.md` — Part 4, the Legal Pages (Privacy Policy, Terms of Service, Cookie
  Policy).

## Rules

Render this copy verbatim. Never rewrite, shorten, paraphrase, or improve it. The hardcoded
content modules in `apps/web` are generated from these files and verified against them by the
content-fidelity byte-diff test.

Items in `[square brackets]` are dynamic placeholders pulled from the CMS, not text to
render, with one exception: the date tokens `[year]`, `[month]`, and `[month-year]` render the
current date at view time in the Africa/Lagos timezone.
