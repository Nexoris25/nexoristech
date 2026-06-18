/**
 * Hardcoded content modules for the Nexoris Technologies marketing site, generated verbatim
 * from the approved Website Copy. The pages render these modules; the content-fidelity test
 * keeps them byte-faithful to content-source.
 */
export * from "./types.js";
export { home } from "./core/home.js";
export { about } from "./core/about.js";
export { howWeWork } from "./core/how-we-work.js";
export { caseStudies } from "./core/case-studies.js";
export { contact } from "./core/contact.js";
export { servicePages } from "./services/index.js";
export { industryPages } from "./industries/index.js";

import { home } from "./core/home.js";
import { about } from "./core/about.js";
import { howWeWork } from "./core/how-we-work.js";
import { caseStudies } from "./core/case-studies.js";
import { contact } from "./core/contact.js";
import { servicePages } from "./services/index.js";
import { industryPages } from "./industries/index.js";
import type { MarketingPage } from "./types.js";

/** The five hardcoded core marketing pages. */
export const corePages: MarketingPage[] = [
  home,
  about,
  howWeWork,
  caseStudies,
  contact,
];

/** Every hardcoded marketing page (5 core + 11 services + 20 industries = 36). */
export const allHardcodedPages: MarketingPage[] = [
  ...corePages,
  ...servicePages,
  ...industryPages,
];

/** Every hardcoded marketing page keyed by slug, for route lookup. */
export const pagesBySlug: Record<string, MarketingPage> = Object.fromEntries(
  allHardcodedPages.map((page) => [page.meta.slug, page]),
);
