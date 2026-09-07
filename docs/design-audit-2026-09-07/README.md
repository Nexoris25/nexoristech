# Grouped industries and clearer comparisons

Revision requested after the searchable directory review. DM Sans is retained, with 600-weight headings at 1.12 line height, body paragraphs at 16–18px / 1.65, and primary navigation/buttons at 14px / 1.4.

- Homepage industries are four coloured cards with distinct group icons. Native disclosure controls reveal individual sector links only when requested. All twenty existing destinations remain available in server-rendered HTML. Normal scrolling is retained; no scroll trapping or mandatory sequence.
- Before/After now explains each workflow step with the problem and improvement together. The first step starts open; all steps can be expanded independently using keyboard or touch. Desktop pairs are side by side and mobile pairs stack. A brief reveal on the improved state supports the directional relationship; reduced-motion preferences disable it. Replay and separate Before/After modes are removed.
- FAQ introductory paragraphs are removed from homepage, contact and all service templates. Industry and author FAQ headings already have no introductory paragraph. Answers and schema content are unchanged.
- About values use numbered editorial rows. Careers has a shorter hero, clearer culture/benefit presentation and an authentic contextual photograph within the body. The licensed photograph was moved from product development to Careers to avoid repeating it across pages; attribution remains in the photography credits. Other existing service body photographs remain.
- Original homepage image, CMS-controlled case studies and job listings, finder logic, and contact/Oge integrations are preserved.

## Checks

216 regression tests pass. ESLint passes. Production build and 51-route HTTP/SEO checks pass, including canonical URLs, metadata, schema presence, sitemap, robots.txt and llms.txt discovery.

All 51 public routes were checked at 280px using inert SSR copies with actual site CSS/assets. No page-level horizontal overflow. Homepage, About, product-development and restaurant layouts also checked at 768px and 1280px without page overflow. Wide CMS tables retain their own scrolling container. Expanded industry and comparison disclosures additionally checked at 280px. These are layout checks, not exhaustive testing of every interactive state or unpublished CMS detail page.

Live browser checks covered industry expansion and step disclosure. Native details controls work without client JavaScript. Screenshots and measurements accompany this report. Temporary review fixtures were removed before the build.
