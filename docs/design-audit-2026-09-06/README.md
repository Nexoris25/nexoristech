# Nexoris refinement — 6 September 2026

Continues the September 5 work on `dev`. References reviewed: [Enyata](https://enyata.com/) and [Special Man Global Solution](https://specialmansolution.com/). Their homepages and section layouts were inspected visually. Enyata informed clear delivery-stage hierarchy; Special Man informed business-oriented grouping and image-led routing. Nexoris retains its own palette, content, imagery and product identity.

## Delivered

- All 20 industry Before/After sections now use a full-width desktop comparison with aligned operational stages. The preceding heading and explanation sit in a balanced two-column introduction. Mobile retains the Before/With Nexoris switch, pressed states, keyboard interaction and 44px controls. The diagrams describe capabilities, not measured client results.
- A registry assigns 20 different industry glyphs and 11 different service glyphs. Related industry links use the industry registry; service links and industry finders use the service registry. Ambiguous keyword-selected icons on detailed problem, solution and AI cards are replaced by ordered typography. Repeated arrows and checks retain their consistent navigation/status meaning.
- The homepage industry groups now include relevant commerce, finance, community and manufacturing photography. All twenty destinations remain available. Original homepage hero imagery and ProductMockup are unchanged.
- Five focused service photographs complete the pending pass: customer support, business analytics, search/content planning, workflow approval and data preparation. The last two were generated in this pass, inspected, and optimized to 1200px WebP (approximately 142 KB together). Full prompts and source paths are recorded in `image-manifest.json` and the September 5 image manifest.
- Existing Covyvo and GLEEN images now fit inside the product showcase without cropping the interfaces. The cards link to the existing in-house product descriptions. Client case studies remain CMS-controlled. No testimonials were added.

## Validation

- All three development apps started: web 3000, admin 3001, Oge gateway 4000. HTTP responses are 200; gateway health reports database connectivity. Admin preview shows login; Oge has its public preview at `/oge/`.
- Web tests: 216 passed, including coverage of all 20 industry workflows and uniqueness of 31 navigation icons.
- Web lint and production build passed.
- Public HTTP checks: 51 routes passed; all 20 comparisons rendered; no obsolete AI-image captions.
- Sitemap: 51 URLs, no duplicates or missing routes. Robots and llms return 200, the llm alias redirects to llms, and unknown routes return 404 with noindex.
- Desktop visual checks: hospitality comparison, retail hero, home industry groups, product image fitting. Compact preview: hospitality comparison tested at 465px, including keyboard selection, pressed state, 44px controls and no horizontal overflow. Exact 390px resizing was unreliable in the browser tooling; screenshots record actual observed dimensions, not requested dimensions.
- Original homepage image and ProductMockup have no Git diff. CMS records, submission behavior and recommendation scoring were not changed.

September 5 screenshots and JSON are historical evidence for the preceding refinement. This report describes the final desktop comparison, which supersedes its narrower single-state illustration. No populated client case-study or job detail could be visually verified because the CMS has no published records for those templates. Remaining editorial work includes CMS article cover selection and shortening the longest approved introductions.
