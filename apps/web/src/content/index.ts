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

import { home } from "./core/home.js";
import { about } from "./core/about.js";
import { howWeWork } from "./core/how-we-work.js";
import { caseStudies } from "./core/case-studies.js";
import { contact } from "./core/contact.js";
import type { MarketingPage } from "./types.js";

/** Every hardcoded core marketing page, keyed by slug. */
export const corePages: Record<string, MarketingPage> = {
  [home.meta.slug]: home,
  [about.meta.slug]: about,
  [howWeWork.meta.slug]: howWeWork,
  [caseStudies.meta.slug]: caseStudies,
  [contact.meta.slug]: contact,
};
