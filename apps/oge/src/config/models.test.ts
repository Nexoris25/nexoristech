import { describe, it, expect } from "vitest";
import {
  WEBSITE_BOT_MODELS,
  CRM_WORKER_MODELS,
  CMS_AI_MODELS,
  SERVICE_RECOMMENDER_MODELS,
  EMBEDDING_MODELS,
  GENERATION_GROUPS,
  apiKeyEnvVar,
  resolveModelId,
  chainFor,
  apiKeyFor,
  type GenerationGroup,
  type ModelSlot,
} from "./models.js";

const allGroups: GenerationGroup[] = [
  WEBSITE_BOT_MODELS,
  CRM_WORKER_MODELS,
  CMS_AI_MODELS,
  SERVICE_RECOMMENDER_MODELS,
];

const allSlots: ModelSlot[] = [
  ...allGroups.flatMap(chainFor),
  EMBEDDING_MODELS.primary,
  EMBEDDING_MODELS.fallback,
];

describe("the pinned provider stack (DECISIONS D-012)", () => {
  it("matches the product owner's per-group assignment", () => {
    expect(chainFor(WEBSITE_BOT_MODELS).map((s) => s.label)).toEqual([
      "Gemini Flash",
      "Llama 4 Scout (Groq)",
      "Ministral 8B",
    ]);
    expect(chainFor(CRM_WORKER_MODELS).map((s) => s.label)).toEqual([
      "Mistral Large",
      "Gemini Flash",
      "GPT-OSS 120B (Groq)",
    ]);
    expect(chainFor(CMS_AI_MODELS).map((s) => s.label)).toEqual([
      "Mistral Large",
      "Gemini Flash",
      "Qwen 3 32B (Groq)",
    ]);
    expect(chainFor(SERVICE_RECOMMENDER_MODELS).map((s) => s.label)).toEqual([
      "Gemini Flash",
      "Qwen 3 32B (Groq)",
      "Ministral 8B",
    ]);
    expect([
      EMBEDDING_MODELS.primary.label,
      EMBEDDING_MODELS.fallback.label,
    ]).toEqual(["Mistral Embed", "Gemini Embeddings"]);
  });

  it("has fully removed SambaNova from every slot", () => {
    for (const slot of allSlots) {
      expect(slot.provider).not.toBe("sambanova");
      expect(`${slot.label} ${slot.model}`.toLowerCase()).not.toContain(
        "sambanova",
      );
    }
  });

  it("only uses the three approved providers", () => {
    for (const slot of allSlots) {
      expect(["gemini", "groq", "mistral"]).toContain(slot.provider);
    }
  });
});

describe("chain integrity", () => {
  it("gives every generation group a primary plus two backups", () => {
    for (const group of allGroups) {
      expect(group.backups).toHaveLength(2);
      expect(chainFor(group)).toHaveLength(3);
    }
  });

  it("never repeats a provider+model within a single chain", () => {
    for (const group of allGroups) {
      const keys = chainFor(group).map((s) => `${s.provider}:${s.model}`);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it("registers exactly the four generation groups by id", () => {
    expect(Object.keys(GENERATION_GROUPS).sort()).toEqual([
      "cms-ai",
      "crm-worker",
      "service-recommender",
      "website-bot",
    ]);
  });

  it("gives every slot a unique override variable name", () => {
    const overrides = allSlots.map((s) => s.envOverride);
    expect(new Set(overrides).size).toBe(overrides.length);
  });
});

describe("API key routing", () => {
  it("routes visitor-facing Gemini slots to Project A and backend ones to Project B", () => {
    expect(apiKeyEnvVar(WEBSITE_BOT_MODELS.primary)).toBe(
      "GEMINI_API_KEY_PROJECT_A",
    );
    expect(apiKeyEnvVar(SERVICE_RECOMMENDER_MODELS.primary)).toBe(
      "GEMINI_API_KEY_PROJECT_A",
    );
    expect(apiKeyEnvVar(CRM_WORKER_MODELS.backups[0]!)).toBe(
      "GEMINI_API_KEY_PROJECT_B",
    );
    expect(apiKeyEnvVar(CMS_AI_MODELS.backups[0]!)).toBe(
      "GEMINI_API_KEY_PROJECT_B",
    );
  });

  it("routes Groq and Mistral to their single keys", () => {
    expect(apiKeyEnvVar(WEBSITE_BOT_MODELS.backups[0]!)).toBe("GROQ_API_KEY");
    expect(apiKeyEnvVar(EMBEDDING_MODELS.primary)).toBe("MISTRAL_API_KEY");
  });

  it("returns the configured key, or undefined so the caller can skip the slot", () => {
    const env = { MISTRAL_API_KEY: "secret-value" };
    expect(apiKeyFor(EMBEDDING_MODELS.primary, env)).toBe("secret-value");
    expect(apiKeyFor(WEBSITE_BOT_MODELS.backups[0]!, env)).toBeUndefined();
  });
});

describe("model identifier resolution", () => {
  it("prefers a non-empty deploy override, otherwise the pinned default", () => {
    const slot = WEBSITE_BOT_MODELS.primary;
    expect(resolveModelId(slot, {})).toBe(slot.model);
    expect(resolveModelId(slot, { [slot.envOverride]: "" })).toBe(slot.model);
    expect(
      resolveModelId(slot, { [slot.envOverride]: "gemini-2.5-flash" }),
    ).toBe("gemini-2.5-flash");
  });
});

describe("embeddings share one pgvector dimension", () => {
  it("pins 1024 dimensions for both the primary and the fallback", () => {
    expect(EMBEDDING_MODELS.dimensions).toBe(1024);
    expect(EMBEDDING_MODELS.primary.provider).toBe("mistral");
    expect(EMBEDDING_MODELS.fallback.provider).toBe("gemini");
  });
});
