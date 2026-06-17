/**
 * Hardcoded content modules for the Nexoris Technologies marketing site, generated verbatim
 * from the approved Website Copy. The pages render these modules; the content-fidelity test
 * keeps them byte-faithful to content-source.
 */
export * from "./types.js";
export { home } from "./core/home.js";

import { home } from "./core/home.js";
import type { MarketingPage } from "./types.js";

/** Every hardcoded core marketing page, keyed by slug. */
export const corePages: Record<string, MarketingPage> = {
  [home.meta.slug]: home,
};
