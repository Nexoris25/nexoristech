/**
 * Registry of fully ported service pages (design-handoff fidelity), keyed by route slug. The
 * catch-all renders ServiceView from this map; services not yet ported fall back to the generic
 * PageRenderer. Metadata and JSON-LD still come from each service's content module.
 */
import type { ServiceContent } from "../../components/service/ServiceView.js";
import { aiProductDevelopment } from "./ai-product-development.js";
import { aiSeoGeo } from "./ai-seo-geo.js";
import { aiChatbotsVirtualAssistants } from "./ai-chatbots-virtual-assistants.js";
import { businessProcessAutomation } from "./business-process-automation.js";
import { aiEcommerceDevelopment } from "./ai-ecommerce-development.js";
import { aiSystemsIntegration } from "./ai-systems-integration.js";
import { dataDashboardsPredictiveAnalytics } from "./data-dashboards-predictive-analytics.js";
import { dataInfrastructureAiReadiness } from "./data-infrastructure-ai-readiness.js";
import { govtechPlatforms } from "./govtech-platforms.js";

export const servicePages: Record<string, ServiceContent> = {
  "/ai-product-development": aiProductDevelopment,
  "/ai-seo-geo": aiSeoGeo,
  "/ai-chatbots-virtual-assistants": aiChatbotsVirtualAssistants,
  "/business-process-automation": businessProcessAutomation,
  "/ai-ecommerce-development": aiEcommerceDevelopment,
  "/ai-systems-integration": aiSystemsIntegration,
  "/data-dashboards-predictive-analytics": dataDashboardsPredictiveAnalytics,
  "/data-infrastructure-ai-readiness": dataInfrastructureAiReadiness,
  "/govtech-platforms": govtechPlatforms,
};
