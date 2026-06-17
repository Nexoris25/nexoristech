/**
 * The 11 hardcoded service pages, transcribed verbatim from the approved Website Copy
 * (Part 2). Added in batches; the array lists every service page completed so far.
 */
import type { MarketingPage } from "../types.js";
import { aiProductDevelopment } from "./ai-product-development.js";
import { aiChatbotsVirtualAssistants } from "./ai-chatbots-virtual-assistants.js";
import { businessProcessAutomation } from "./business-process-automation.js";

export {
  aiProductDevelopment,
  aiChatbotsVirtualAssistants,
  businessProcessAutomation,
};

export const servicePages: MarketingPage[] = [
  aiProductDevelopment,
  aiChatbotsVirtualAssistants,
  businessProcessAutomation,
];
