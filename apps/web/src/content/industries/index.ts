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
import { logisticsSoftware } from "./logistics-software.js";
import { fintechSoftware } from "./fintech-software.js";
import { insuranceSoftware } from "./insurance-software.js";
import { manufacturingSoftware } from "./manufacturing-software.js";
import { agritechSoftware } from "./agritech-software.js";
import { professionalServicesSoftware } from "./professional-services-software.js";
import { churchManagementSoftware } from "./church-management-software.js";

export {
  educationSoftware,
  healthcareSoftware,
  hospitalitySoftware,
  restaurantSoftware,
  retailEcommerceSoftware,
  realEstateSoftware,
  logisticsSoftware,
  fintechSoftware,
  insuranceSoftware,
  manufacturingSoftware,
  agritechSoftware,
  professionalServicesSoftware,
  churchManagementSoftware,
};

export const industryPages: MarketingPage[] = [
  educationSoftware,
  healthcareSoftware,
  hospitalitySoftware,
  restaurantSoftware,
  retailEcommerceSoftware,
  realEstateSoftware,
  logisticsSoftware,
  fintechSoftware,
  insuranceSoftware,
  manufacturingSoftware,
  agritechSoftware,
  professionalServicesSoftware,
  churchManagementSoftware,
];
