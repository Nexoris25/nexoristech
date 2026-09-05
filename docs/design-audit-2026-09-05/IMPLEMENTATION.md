# Website refinement implementation

5 September 2026. Target branch: `dev`. Public website scope; admin and Oge services remain running for preview.

## What changed

The shared visual system now uses quieter surfaces, restrained borders and shadows, stronger readable typography, tighter content widths, clearer section hierarchy, and better mobile spacing. The original homepage image and ProductMockup component are retained. No testimonials were added.

Twenty-two contextual AI-generated photographs are shipped as optimized WebP assets (about 2.4 MB in total). Twenty industry heroes each have their own relevant workplace scene. Services use contextual photographs alongside their scope; company/process/careers layouts also use the product-team scene. New photographs show Black African people and have visible illustrative captions. They do not represent actual employees or client projects. The real founder portrait and existing product screenshots remain.

Unsupported homepage example metrics and empty “verified case study” placeholders are replaced with honest presentations of the available work. Interactive service examples are labelled as sample data. Existing calculators, tabs, finder, contact form, navigation, and Oge entry points retain their behavior. Contact CTA hierarchy, article reading layout, repeated author credits, legal contents numbering, and Oge's customer-facing content are refined.

## Content ownership

| Content | Owner | Implementation |
| --- | --- | --- |
| Case-study title, summary, cover, body, publication state | Admin CMS | Read from published CMS records; never invented or hardcoded |
| Service case-study relationships | Admin CMS | Existing service relationship lookup retained |
| Industry case-study relationships | Admin CMS | Published records matched by whole industry labels/aliases; empty sections omitted |
| Homepage selected case studies | Admin CMS | Published records only; honest product link when empty |
| Service/industry descriptions and interactive demonstrations | Existing code/content modules | Original business content and interactions retained |
| Contextual sector photographs and page composition | Website design | Versioned local assets and shared presentation components |
| Insights, author details, vacancies, legal copy, generated pages | Admin CMS | Existing publication and editing workflow retained |
| Article cover selection and images embedded in article HTML | Admin CMS | Preserved; not overridden with a hardcoded slug-to-image map |

## SEO and discovery

Page graphs include shared site identity and a real organization logo. Service nodes connect to their page; generated pages have complete page graphs; job templates include page and breadcrumb context. Author profile graphs share a single page identity. Organization fallback authors are no longer mislabeled as people. FAQ schema uses the questions actually rendered. Case-study metadata uses supported image properties and absolute media URLs.

The sitemap and llms.txt use uncapped published/indexable CMS discovery entries, include Oge, and refresh after CMS revalidation. Sitemap duplicates are removed and the root canonical is normalized. `/llm.txt` redirects to `/llms.txt`. Existing robots rules remain valid. Case-study detail pages retain the repository's deliberate noindex policy and are excluded from discovery files.

## Verification and limits

- Web tests: 214 passed. Shared SEO tests: 102 passed.
- Web lint passed. Final production build passed, including TypeScript and 58 generated build routes.
- HTTP verification: all 51 currently published content routes return 200 with one H1, metadata, correct canonical, parseable page schema, and organization identity. Sitemap: 51 unique URLs, no missing published routes. Robots and llms return 200; singular llm alias returns 308; an unknown route returns 404 with noindex. See `http-verification.json`.
- All 51 routes were checked at 1440 × 900 and 390 × 844. One article's long reference URL caused mobile overflow; the shared prose wrapping was corrected and rechecked at 375 px document width within the 390 px viewport. Desktop/mobile checks, including the original failure and corrected result, are recorded in `page-checks.json`; screenshots are under `after/`. These are viewport and layout checks, not a claim of exhaustive assistive-technology certification.
- The CMS currently has no published case-study detail, vacancy detail, or generated SEO page. Their templates were reviewed and compiled; they cannot be claimed as live populated-page browser tests.
- The existing post-build SEO manifest covers 45 routes. The separate HTTP verifier intentionally covers the full 51-route public inventory, including the six standalone routes that manifest omits.
- No contact messages, applications, newsletter registrations, or Oge conversations were submitted during QA.
- No live CMS records were edited. Replacing existing editorial covers, rewriting article claims, or supplying client evidence remains editorial work; see the per-page audit. Frontend changes alone cannot truthfully complete those content recommendations.

Run the full-route check from the repository root with `node apps/web/scripts/verify-public-web.mjs` while web runs on port 3000. `WEB_VERIFY_ORIGIN` can select another local server.

## Review artifacts

`routes.json` is the complete published inventory. `observations.json` records the original page outlines and imagery. `image-prompts.json` records image-generation provenance; `image-assets.json` records optimized assets. Original screenshots are under `evidence/`; implementation screenshots are under `after/`.
