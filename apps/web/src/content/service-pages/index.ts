/**
 * Registry of fully ported service pages (design-handoff fidelity), keyed by route slug. The
 * catch-all renders ServiceView from this map; services not yet ported fall back to the generic
 * PageRenderer. Metadata and JSON-LD still come from each service's content module.
 */
import type { ServiceContent } from "../../components/service/ServiceView.js";
import { aiProductDevelopment } from "./ai-product-development.js";
import { aiSeoGeo } from "./ai-seo-geo.js";

export const servicePages: Record<string, ServiceContent> = {
  "/ai-product-development": aiProductDevelopment,
  "/ai-seo-geo": aiSeoGeo,
};
