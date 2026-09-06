# Typography and presentation correction

User feedback supersedes the earlier oversized studio direction.

- Verified Enyata's live computed styles: DM Sans is used for its heading, body and navigation text. Nexoris now self-hosts the same family, downloaded from Google Fonts, with its SIL Open Font License included. Latin and extended Latin assets total about 55 KB. No external font request is needed at runtime.
- Shared hero headings scale from 32px to 48px. Main section headings scale from 28px to 40px; closing calls to action are capped at 44px. Body text stays 16–18px. Tighter control of weights, line height and letter spacing replaces the previous oversized typography.
- The homepage's key phrase uses a readable white-to-lilac treatment. Hero titles have a brief entrance animation only when reduced motion is not requested. Forced-colour mode uses normal system text colour.
- Removed the 64px offset on GLEEN. Both project cards, their media frames, headings and metadata now align; product interfaces remain contained without distortion. Measured desktop card top and bottom values match exactly.
- Removed the four-image homepage industry grid, five reused service photographs, and repeated team photos on the careers/process pages. Those areas retain their content and links in text-led layouts. Sector heroes, distinct service photography, the About image and the original supplied homepage image remain.
- Simplified shared surfaces and purple accents; both project cards now use the same neutral background. Status and data colours retain their meaning.
- Mobile navigation now closes with Escape, returns focus to its toggle and exposes the controlled navigation element.

## Verification

Responsive visual snapshots use the actual server-rendered pages and their styles at 390px, 768px and 1280px. Temporary local review pages embedded inert HTML snapshots to verify media queries without changing security headers. Scripts were omitted, so these snapshots verify layout rather than application interactions; the temporary pages were removed before publishing. Settled checks for homepage, service and industry templates show no horizontal overflow at all three widths. The JSON includes only settled measurements after styles loaded.

The live desktop project grid was measured directly. Live navigation was checked separately. Original homepage asset and ProductMockup files are unchanged. CMS content and case-study ownership, forms, service-finder scoring and SEO behavior remain intact.

Reference: https://enyata.com/ (computed DM Sans family verified on 6 September 2026). Font distribution: https://fonts.google.com/specimen/DM+Sans. Font source and license: Google Fonts `ofl/dmsans`.

Validation results: 216 web tests passed. Live desktop project boundaries align exactly. Live compact navigation opens, closes with Escape and returns focus. Browser error log was empty during review. The original homepage asset and mockup source have no changes.

Final validation: web lint and production build passed, all 51 public routes returned successfully, sitemap contains all 51 routes without duplicates, and robots/llms/redirect/404 checks passed.
