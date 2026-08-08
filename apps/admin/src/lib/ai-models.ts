/**
 * The Oge AI model registry, mirrored from apps/oge/src/config/models.ts (the upstream source of truth,
 * PRD §10.1). The gateway runs a two-tier architecture (Website Bot + CRM Worker) plus a CMS AI group, a
 * Service Recommender, and an embeddings group, each with a primary model and a two-level fallback chain.
 * The AI Configuration and Analytics screens read from THIS module so what the CMS shows matches what the
 * gateway actually calls. Keep in sync with apps/oge/src/config/models.ts when models change.
 */
export interface ModelSlot { provider: "gemini" | "groq" | "mistral"; model: string; label: string }
export interface ModelGroup { id: string; name: string; purpose: string; primary: ModelSlot; backups: ModelSlot[] }

export const MODEL_GROUPS: ModelGroup[] = [
  {
    id: "website-bot", name: "Website Bot",
    purpose: "Visitor-facing assistant on nexoristech.com: fast, friendly, grounded in the knowledge base.",
    primary: { provider: "gemini", model: "gemini-2.0-flash", label: "Gemini Flash" },
    backups: [
      { provider: "groq", model: "meta-llama/llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout (Groq)" },
      { provider: "mistral", model: "ministral-8b-latest", label: "Ministral 8B" },
    ],
  },
  {
    id: "crm-worker", name: "CRM Worker",
    purpose: "Backend CRM workflows: lead scoring, qualification, and outreach drafting with strict JSON.",
    primary: { provider: "mistral", model: "mistral-large-latest", label: "Mistral Large" },
    backups: [
      { provider: "gemini", model: "gemini-2.0-flash", label: "Gemini Flash" },
      { provider: "groq", model: "openai/gpt-oss-120b", label: "GPT-OSS 120B (Groq)" },
    ],
  },
  {
    id: "cms-ai", name: "CMS AI",
    purpose: "CMS editorial helpers: SEO metadata, internal links, summaries, FAQs, and content analysis.",
    primary: { provider: "mistral", model: "mistral-large-latest", label: "Mistral Large" },
    backups: [
      { provider: "gemini", model: "gemini-2.0-flash", label: "Gemini Flash" },
      { provider: "groq", model: "qwen/qwen3-32b", label: "Qwen 3 32B (Groq)" },
    ],
  },
  {
    id: "service-recommender", name: "Service Recommender",
    purpose: "Personalised explanation text for the deterministic Solution Finder matches.",
    primary: { provider: "gemini", model: "gemini-2.0-flash", label: "Gemini Flash" },
    backups: [
      { provider: "groq", model: "qwen/qwen3-32b", label: "Qwen 3 32B (Groq)" },
      { provider: "mistral", model: "ministral-8b-latest", label: "Ministral 8B" },
    ],
  },
  {
    id: "embeddings", name: "Embeddings",
    purpose: "Knowledge-base indexing, semantic search, RAG retrieval, and the semantic cache (1024 dims).",
    primary: { provider: "mistral", model: "mistral-embed", label: "Mistral Embed" },
    backups: [{ provider: "gemini", model: "gemini-embedding-001", label: "Gemini Embeddings" }],
  },
];

export const PROVIDER_META: Record<ModelSlot["provider"], { label: string; color: string }> = {
  gemini: { label: "Google AI Studio", color: "#4285F4" },
  groq: { label: "Groq", color: "#F55036" },
  mistral: { label: "Mistral AI", color: "#FF7000" },
};

/** The CMS editorial features Oge powers (PRD Part Two), used by the AI dashboard and analytics. */
export const AI_FEATURES = ["SEO Generator", "TL;DR", "Excerpt", "FAQs", "Author Bio", "Internal Links"] as const;
