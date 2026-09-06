# Industry and imagery refinement

User direction: improve the industry “What changes” illustration, remove the generated-image captions, assess hero layouts honestly, and improve contextual alignment. The supplied homepage image remains unchanged.

## Implemented

- Replaced the generic rising chart with an industry-specific workflow comparison for all 20 industries. Each shows three real operational stages, their manual handoffs, and the corresponding connected workflow. No numerical performance claims are introduced.
- Retained the Before/With Nexoris interaction. Buttons expose pressed state and the controlled panel; the summary announces changes politely. Controls have 44-pixel minimum height, visible keyboard focus, and reduced-motion support.
- Removed the “Illustrative scenario · AI-generated image” captions from the shared photograph component and removed obsolete chart styles. Image-generation provenance remains in the repository manifests.
- Added three purpose-made service photographs: a support specialist handling conversations; operations analysts reviewing a dashboard; and search/content specialists planning topic groups. These replace the reused hospitality, fintech, and product-design photographs on the respective service pages.
- Preserved CMS case-study ownership, existing forms, finder recommendations, homepage imagery, and Oge behavior.

## Hero recommendation

Two columns are the stronger default for the current service and industry copy: long headings and explanatory text remain readable without obscuring the photograph. A full-width image overlay can be excellent when copy is brief and the photograph is composed with deliberate text space. It is not automatically more premium. Do not change every hero to that pattern simply for visual scale.

## Highest-value remaining improvements

1. Edit the longest hero introductions to one concise proposition, moving supporting detail into the following section. This needs copy decisions rather than smaller type.
2. Replace the remaining CMS-owned neon and text-heavy article graphics with relevant editorial photography and accessible native charts where there is sourced data.
3. Add authentic published client evidence as it becomes available through CMS. Stock or generated imagery should not stand in for actual project evidence.
4. Continue varying the middle-page compositions around the content: use process sequences for workflows and clear comparisons for service options, while keeping the shared typography and spacing consistent.

## Validation

Web regression tests: 215 passed, including coverage of all 20 workflow definitions. Web lint and the production build passed. Desktop and mobile browser checks cover the comparison layout, state changes, touch-target dimensions, and caption removal; detailed results are in `refinement-checks.json`. Screenshots are under `refinement/`. Development-server initialization can precede client interactivity; settled results are distinguished from preliminary reads in the check record.
