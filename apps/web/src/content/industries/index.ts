/**
 * The 20 hardcoded industry pages, transcribed verbatim from the approved Website Copy
 * (Part 3). Added in batches; the array lists every industry page completed so far.
 */
import type { MarketingPage } from "../types.js";
import { educationSoftware } from "./education-software.js";
import { healthcareSoftware } from "./healthcare-software.js";

export { educationSoftware, healthcareSoftware };

export const industryPages: MarketingPage[] = [
  educationSoftware,
  healthcareSoftware,
];
