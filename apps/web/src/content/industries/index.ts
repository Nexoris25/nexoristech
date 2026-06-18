/**
 * The 20 hardcoded industry pages, transcribed verbatim from the approved Website Copy
 * (Part 3). Added in batches; the array lists every industry page completed so far.
 */
import type { MarketingPage } from "../types.js";
import { educationSoftware } from "./education-software.js";
import { healthcareSoftware } from "./healthcare-software.js";
import { hospitalitySoftware } from "./hospitality-software.js";
import { restaurantSoftware } from "./restaurant-software.js";
import { retailEcommerceSoftware } from "./retail-ecommerce-software.js";
import { realEstateSoftware } from "./real-estate-software.js";

export {
  educationSoftware,
  healthcareSoftware,
  hospitalitySoftware,
  restaurantSoftware,
  retailEcommerceSoftware,
  realEstateSoftware,
};

export const industryPages: MarketingPage[] = [
  educationSoftware,
  healthcareSoftware,
  hospitalitySoftware,
  restaurantSoftware,
  retailEcommerceSoftware,
  realEstateSoftware,
];
