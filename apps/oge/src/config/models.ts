/**
 * The pinned AI model registry for the Oge gateway (PRD 10.1, and the product owner's
 * 2026-06-19 provider update recorded in DECISIONS D-012). This is the single place model
 * identifiers live; nothing else in apps/oge hardcodes a model string.
 *
 * SambaNova Cloud was removed and Mistral AI added across the stack. The system is organised
 * into five functional groups, each generation group having a primary model and a two-level
 * fallback chain, plus the embedding group with a single fallback. No visitor or salesperson ever
 * sees a broken AI feature because the caller walks the chain on a rate limit or outage.
 *
 * Provider keys live only here, read from the environment at call time, never committed:
 *   - GEMINI_API_KEY_PROJECT_A  Google AI Studio, the visitor-facing projects (website bot,
 *                               service recommender) so the visitor quota is independent.
 *   - GEMINI_API_KEY_PROJECT_B  Google AI Studio, a separate Google Cloud project for the
 *                               backend projects (CRM worker, CMS AI) so backend batch work
 *                               does not eat into the visitor quota.
 *   - GROQ_API_KEY              Groq.
 *   - MISTRAL_API_KEY           Mistral AI (Mistral Large, Ministral 8B, Mistral Embed).
 *
 * Every `model` string below was verified against the provider's own models endpoint on 2026-08-01,
 * and any identifier can still be overridden at deploy time with the `envOverride` variable named on
 * the slot, without a code change.
 *
 * Two had been decommissioned by Groq: `meta-llama/llama-4-scout-17b-16e-instruct` and
 * `qwen/qwen3-32b`. The second was the last slot in the CMS AI chain, so every editorial request ended
 * in a 404 from the provider once the two slots ahead of it were unavailable.
 *
 * Every Groq slot is now `llama-3.3-70b-versatile`, chosen by testing rather than by size. The two
 * larger options both fail at the job these groups do: `openai/gpt-oss-120b` returns empty message
 * content because it writes to a separate reasoning field, and `qwen/qwen3.6-27b` prefixes every reply
 * with its thinking, which lands verbatim in an excerpt. A model that cannot answer plainly is not a
 * usable fallback however capable it is.
 *
 * Re-verify after any provider deprecation notice; a pinned identifier is only as good as the day it
 * was checked.
 */

/** The AI providers Oge can call. The browser never calls any of these directly. */
export type ProviderId = "gemini" | "groq" | "mistral";

/**
 * Which Google AI Studio project a Gemini slot bills to. Project A is visitor-facing so its
 * quota stays free for chat; Project B is a separate Cloud project for backend batch work.
 */
export type GeminiProject = "A" | "B";

/** One model in a chain: the provider, the identifier, and where to read its key and override. */
export interface ModelSlot {
  /** The provider that serves this model. */
  readonly provider: ProviderId;
  /** The provider-specific model identifier. Provisional; verify before production. */
  readonly model: string;
  /** The human-facing name from the provider stack spec, for logs and the gap report. */
  readonly label: string;
  /** Environment variable that overrides `model` at deploy time without a code change. */
  readonly envOverride: string;
  /** For Gemini only: which Google project key to use. */
  readonly geminiProject?: GeminiProject;
}

/** A generation group: a primary model and an ordered list of backups (PRD 10.2). */
export interface GenerationGroup {
  /** Stable identifier used by callers and the quota governor. */
  readonly id: string;
  /** What this group does, in plain language. */
  readonly purpose: string;
  /** The first model tried on a cache miss. */
  readonly primary: ModelSlot;
  /** Tried in order when the slot before it hits a rate limit or is unavailable. */
  readonly backups: readonly ModelSlot[];
}

/** The embedding group: a primary and a single fallback, sharing one vector dimension. */
export interface EmbeddingGroup {
  readonly id: "embeddings";
  readonly purpose: string;
  readonly primary: ModelSlot;
  readonly fallback: ModelSlot;
  /**
   * The pgvector column dimension every stored embedding must match. Mistral Embed returns
   * 1024 dimensions; the Gemini fallback must be called with an output dimension of 1024 so
   * both providers write vectors that share one index. Do not mix dimensions in one column.
   */
  readonly dimensions: 1024;
}

/**
 * Tier 1, Website Bot (serves nexoristech.com visitors). Fast token streaming, friendly tone,
 * grounded in the knowledge base. Gemini on the visitor-facing Project A key.
 */
/*
 * A note on model ids rotting, because all of these had.
 *
 * Checked against the providers on 2026-08-29, every generation model this file named was gone:
 * gemini-2.0-flash answered 404 "no longer available", llama-3.3-70b-versatile 404 "does not exist
 * or you do not have access", and mistral-large-latest 403 "not available in your subscription
 * tier". Ten slots across every chain. The embedding models were the only ones still alive, which is
 * why retrieval kept working and hid how much else did not.
 *
 * Two things let that sit unnoticed. A 403 was not classified as retriable, so a chain stopped dead
 * on its first slot instead of moving on; and no caller ever passed the onRetriableError hook, so
 * the reason a slot failed was discarded. Both are fixed: a refusal now advances the chain, and each
 * failure is logged by the chain itself rather than by whoever remembered to ask.
 *
 * Names are pinned rather than aliased on purpose here. gemini-flash-latest is the durable-looking
 * choice and answered 503 on four consecutive attempts, so it is not usable. The protection against
 * the next retirement is not the name anyway, it is that the next one will be loud: the chain falls
 * through to a working provider and logs exactly which slot refused and why.
 *
 * The Gemini slot is gemini-3.1-flash-lite on measurement, not preference. Timed twice each against
 * the same prompt: groq gpt-oss-120b 673 and 789ms, gemini-3.1-flash-lite 837 and 804ms,
 * ministral-8b 828 and 880ms, mistral-medium 1120 and 960ms, and gemini-3-flash-preview 2567 and
 * 1578ms. The preview model was briefly the primary here and took first-token latency on the chat
 * widget from about two seconds to six and a half. It is also a stable id rather than a preview one,
 * so it is the better choice twice over.
 */
export const WEBSITE_BOT_MODELS: GenerationGroup = {
  id: "website-bot",
  purpose:
    "Website virtual assistant, FAQ responses, knowledge-base search and retrieval, service discovery guidance, and general visitor engagement.",
  primary: {
    provider: "gemini",
    model: "gemini-3.1-flash-lite",
    label: "Gemini Flash",
    envOverride: "OGE_WEBSITE_BOT_PRIMARY_MODEL",
    geminiProject: "A",
  },
  backups: [
    {
      provider: "groq",
      model: "openai/gpt-oss-120b",
      label: "Llama 3.3 70B (Groq)",
      envOverride: "OGE_WEBSITE_BOT_BACKUP_1_MODEL",
    },
    {
      provider: "mistral",
      model: "ministral-8b-latest",
      label: "Ministral 8B",
      envOverride: "OGE_WEBSITE_BOT_BACKUP_2_MODEL",
    },
  ],
};

/**
 * Tier 2, CRM Worker (serves the admin dashboard CRM module, backend workflows only). Deep
 * context, strong structured-output reliability, flawless JSON. Gemini on the backend Project B
 * key so it never competes with visitor chat.
 */
export const CRM_WORKER_MODELS: GenerationGroup = {
  id: "crm-worker",
  purpose:
    "Lead scoring, lead qualification, opportunity analysis, follow-up email drafting, CRM insights and recommendations, and customer engagement summaries.",
  primary: {
    provider: "mistral",
    model: "mistral-medium-latest",
    label: "Mistral Large",
    envOverride: "OGE_CRM_WORKER_PRIMARY_MODEL",
  },
  backups: [
    {
      provider: "gemini",
      model: "gemini-3.1-flash-lite",
      label: "Gemini Flash",
      envOverride: "OGE_CRM_WORKER_BACKUP_1_MODEL",
      geminiProject: "B",
    },
    {
      provider: "groq",
      model: "openai/gpt-oss-120b",
      label: "Llama 3.3 70B (Groq)",
      envOverride: "OGE_CRM_WORKER_BACKUP_2_MODEL",
    },
  ],
};

/**
 * CMS AI services (backend, runs at publish or off-peak, never on a visitor request). SEO and
 * content intelligence for Strapi. Gemini on the backend Project B key.
 */
export const CMS_AI_MODELS: GenerationGroup = {
  id: "cms-ai",
  purpose:
    "Internal linking recommendations, SEO optimisation suggestions, metadata generation, content categorisation and tagging, related content recommendations, content summaries, programmatic SEO content assistance, and content quality analysis.",
  primary: {
    provider: "mistral",
    model: "mistral-medium-latest",
    label: "Mistral Large",
    envOverride: "OGE_CMS_AI_PRIMARY_MODEL",
  },
  backups: [
    {
      provider: "gemini",
      model: "gemini-3.1-flash-lite",
      label: "Gemini Flash",
      envOverride: "OGE_CMS_AI_BACKUP_1_MODEL",
      geminiProject: "B",
    },
    {
      provider: "groq",
      model: "openai/gpt-oss-120b",
      label: "Llama 3.3 70B (Groq)",
      envOverride: "OGE_CMS_AI_BACKUP_2_MODEL",
    },
  ],
};

/**
 * Service Recommender (Solution Finder). The core recommendation is deterministic: user inputs
 * are matched against versioned business rules and service mappings, so there is no
 * hallucination risk in the match itself. AI writes only the short, personalised explanation.
 * Visitor-facing, so Gemini uses the Project A key.
 */
export const SERVICE_RECOMMENDER_MODELS: GenerationGroup = {
  id: "service-recommender",
  purpose:
    "Personalised explanation text for the deterministic service and industry-page recommendations. The match itself is rule-based, not a model call.",
  primary: {
    provider: "gemini",
    model: "gemini-3.1-flash-lite",
    label: "Gemini Flash",
    envOverride: "OGE_SERVICE_RECOMMENDER_PRIMARY_MODEL",
    geminiProject: "A",
  },
  backups: [
    {
      provider: "groq",
      model: "openai/gpt-oss-120b",
      label: "Llama 3.3 70B (Groq)",
      envOverride: "OGE_SERVICE_RECOMMENDER_BACKUP_1_MODEL",
    },
    {
      provider: "mistral",
      model: "ministral-8b-latest",
      label: "Ministral 8B",
      envOverride: "OGE_SERVICE_RECOMMENDER_BACKUP_2_MODEL",
    },
  ],
};

/**
 * Embeddings, consolidated in the Mistral ecosystem with a Gemini fallback. Used for
 * knowledge-base indexing, semantic search, RAG retrieval, related-content discovery, internal
 * linking intelligence, and the semantic cache. Chunk embeddings are computed once at
 * ingestion. The fallback must be called at 1024 output dimensions to match the column.
 */
export const EMBEDDING_MODELS: EmbeddingGroup = {
  id: "embeddings",
  purpose:
    "Knowledge-base indexing, semantic search, RAG retrieval, related-content discovery, internal linking intelligence, and semantic caching.",
  primary: {
    provider: "mistral",
    model: "mistral-embed",
    label: "Mistral Embed",
    envOverride: "OGE_EMBEDDING_PRIMARY_MODEL",
  },
  fallback: {
    provider: "gemini",
    model: "gemini-embedding-001",
    label: "Gemini Embeddings",
    envOverride: "OGE_EMBEDDING_FALLBACK_MODEL",
    geminiProject: "A",
  },
  dimensions: 1024,
};

/** Every generation group, keyed by id, for callers and the quota governor. */
export const GENERATION_GROUPS = {
  [WEBSITE_BOT_MODELS.id]: WEBSITE_BOT_MODELS,
  [CRM_WORKER_MODELS.id]: CRM_WORKER_MODELS,
  [CMS_AI_MODELS.id]: CMS_AI_MODELS,
  [SERVICE_RECOMMENDER_MODELS.id]: SERVICE_RECOMMENDER_MODELS,
} as const satisfies Record<string, GenerationGroup>;

export type GenerationGroupId = keyof typeof GENERATION_GROUPS;

/** A read-only view of the environment, so helpers stay pure and testable. */
export type Env = Readonly<Record<string, string | undefined>>;

/**
 * The environment variable holding the API key for a slot. Gemini reads Project A or B by the
 * slot's `geminiProject`; the other providers each have one key.
 */
export function apiKeyEnvVar(slot: ModelSlot): string {
  switch (slot.provider) {
    case "gemini":
      return slot.geminiProject === "B"
        ? "GEMINI_API_KEY_PROJECT_B"
        : "GEMINI_API_KEY_PROJECT_A";
    case "groq":
      return "GROQ_API_KEY";
    case "mistral":
      return "MISTRAL_API_KEY";
  }
}

/**
 * Resolve the model identifier for a slot: the deploy-time override if set, otherwise the pinned
 * default. Verify the resolved string against the provider's documentation before production.
 */
export function resolveModelId(slot: ModelSlot, env: Env): string {
  const override = env[slot.envOverride];
  return override && override.length > 0 ? override : slot.model;
}

/** The ordered chain for a generation group: the primary first, then each backup. */
export function chainFor(group: GenerationGroup): readonly ModelSlot[] {
  return [group.primary, ...group.backups];
}

/**
 * The API key for a slot, or undefined when the key is not configured. The caller skips a slot
 * whose key is missing rather than failing the whole chain.
 */
export function apiKeyFor(slot: ModelSlot, env: Env): string | undefined {
  return env[apiKeyEnvVar(slot)];
}
