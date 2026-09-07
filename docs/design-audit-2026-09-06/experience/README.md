# Experience refinement — 7 September 2026

Implemented on `dev` after the typography pass.

- Homepage industries now uses a searchable, filterable directory. Copy explicitly presents the sectors as examples, without limiting Nexoris to twenty industries. All existing sector links remain in the initial server-rendered HTML and use the established distinct sector icons.
- Finder results use separated actions: 20px horizontal spacing, 14px vertical spacing, with restart on its own row. At narrow widths all actions stack and their labels wrap.
- Industry problem and service discovery sections use quieter, numbered rows with improved reading space.
- Industry Before/After comparisons retain aligned desktop columns and compact-screen switching. A replay button triggers staggered flow animation; reduced-motion preferences disable it.
- About has a contextual authentic photograph, simpler commitments, restrained heading colour, and a story layout pairing the supplied founder portrait with clearly separated paragraphs. The portrait appears once on the page.
- A second authentic photograph supports the product-development service. Sources and licences are recorded in `apps/web/public/images/photography/CREDITS.md`. New photographs are contextual stock, not claimed as Nexoris staff or client evidence. Previously approved generated sector imagery remains separate.
- Small-screen heading sizes, controls, directory rows and comparison spacing are adjusted. Careers cards no longer have a minimum width larger than the screen; long article-summary and FAQ words wrap.

## Verification

- 216 regression tests pass; ESLint and production build pass.
- HTTP checks pass on all 51 currently published public routes: one H1, metadata, canonical URL, page and organization schema, unique schema IDs. Sitemap includes all 51 routes with no duplicates. Robots and llms.txt return 200; llm.txt redirects to llms.txt; missing pages return 404 with noindex.
- All 51 routes were checked at a 280px viewport using inert copies of server-rendered HTML with the site's real CSS, fonts and images. Content width is 265px because of the 15px scrollbar. No page-level horizontal overflow remains. These are layout checks, not a claim that every interactive state was tested at 280px.
- Homepage, About, product development and restaurant page layouts also pass at 768px and 1280px. Detailed measurements accompany this report.
- Live browser checks: directory category filtering, empty search, reset to all sectors; five-question finder completion and restart; 20px result action separation; comparison replay animation on desktop; Before/After visibility switching at 659px.
- The rendered completed finder was additionally checked at 280px: buttons wrap, stack with 14px gaps and do not overflow.
- Wide CMS tables remain scrollable inside their own containers. No populated case-study or job detail pages are published in the current CMS, so those content states were not visually verified.

The supplied homepage image, product mockup, finder scoring, contact/Oge actions and CMS-controlled case-study rendering are preserved. No testimonials were added. Temporary review pages were removed.
