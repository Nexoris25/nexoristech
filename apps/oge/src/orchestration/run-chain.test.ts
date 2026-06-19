import { describe, it, expect, vi } from "vitest";
import { runChain } from "./run-chain.js";
import { WEBSITE_BOT_MODELS } from "../config/models.js";
import {
  ChainExhaustedError,
  ProviderUnavailableError,
  RateLimitError,
  SchemaValidationError,
} from "../providers/errors.js";

// A full set of keys so no slot is skipped for a missing key.
const fullEnv = {
  GEMINI_API_KEY_PROJECT_A: "a",
  GEMINI_API_KEY_PROJECT_B: "b",
  GROQ_API_KEY: "g",
  MISTRAL_API_KEY: "m",
};

describe("runChain", () => {
  it("returns the primary result and never calls a backup on success", async () => {
    const call = vi.fn().mockResolvedValue("primary answer");
    const result = await runChain(WEBSITE_BOT_MODELS, fullEnv, call);

    expect(result.value).toBe("primary answer");
    expect(result.slot).toBe(WEBSITE_BOT_MODELS.primary);
    expect(call).toHaveBeenCalledTimes(1);
  });

  it("advances past a rate-limited slot to the next, invisibly to the caller", async () => {
    const call = vi
      .fn()
      .mockRejectedValueOnce(new RateLimitError("429", "gemini:flash"))
      .mockResolvedValueOnce("backup 1 answer");

    const result = await runChain(WEBSITE_BOT_MODELS, fullEnv, call);

    expect(result.value).toBe("backup 1 answer");
    expect(result.slot).toBe(WEBSITE_BOT_MODELS.backups[0]);
    expect(call).toHaveBeenCalledTimes(2);
  });

  it("treats an outage and a schema-validation failure as advance signals", async () => {
    const call = vi
      .fn()
      .mockRejectedValueOnce(new ProviderUnavailableError("503", "a"))
      .mockRejectedValueOnce(new SchemaValidationError("bad json", "b"))
      .mockResolvedValueOnce("backup 2 answer");

    const result = await runChain(WEBSITE_BOT_MODELS, fullEnv, call);

    expect(result.value).toBe("backup 2 answer");
    expect(result.slot).toBe(WEBSITE_BOT_MODELS.backups[1]);
    expect(call).toHaveBeenCalledTimes(3);
  });

  it("throws ChainExhaustedError listing every attempt when all slots fail", async () => {
    const call = vi
      .fn()
      .mockRejectedValue(new RateLimitError("429", "any"));

    await expect(runChain(WEBSITE_BOT_MODELS, fullEnv, call)).rejects.toThrow(
      ChainExhaustedError,
    );
    expect(call).toHaveBeenCalledTimes(3);
  });

  it("skips slots whose API key is not configured and reports the skip", async () => {
    // Only the Groq key is present, so the chain skips straight to the Groq backup.
    const env = { GROQ_API_KEY: "g" };
    const call = vi.fn().mockResolvedValue("groq answer");
    const onSkip = vi.fn();

    const result = await runChain(WEBSITE_BOT_MODELS, env, call, { onSkip });

    expect(result.slot).toBe(WEBSITE_BOT_MODELS.backups[0]);
    expect(call).toHaveBeenCalledTimes(1);
    expect(onSkip).toHaveBeenCalledWith(
      WEBSITE_BOT_MODELS.primary,
      "missing-key",
    );
  });

  it("surfaces a non-retriable error unchanged rather than advancing", async () => {
    const bug = new TypeError("a real bug, not a provider limit");
    const call = vi.fn().mockRejectedValue(bug);

    await expect(runChain(WEBSITE_BOT_MODELS, fullEnv, call)).rejects.toBe(bug);
    expect(call).toHaveBeenCalledTimes(1);
  });

  it("exhausts immediately, calling nothing, when no key is configured", async () => {
    const call = vi.fn();
    let exhausted: ChainExhaustedError | undefined;
    try {
      await runChain(WEBSITE_BOT_MODELS, {}, call);
    } catch (error) {
      exhausted = error as ChainExhaustedError;
    }
    expect(exhausted).toBeInstanceOf(ChainExhaustedError);
    expect(exhausted?.attempted).toEqual([]);
    expect(call).not.toHaveBeenCalled();
  });
});
