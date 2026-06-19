/**
 * The provider-agnostic fallback orchestrator (PRD 10.2). Given a generation group, it walks the
 * chain primary first, then each backup: it skips any slot whose API key is not configured, calls
 * the slot, returns on the first usable result, and advances on a retriable error (rate limit,
 * outage, or schema-validation failure). When every slot is spent it throws ChainExhaustedError
 * so the caller can run its own last resort (the extractive handoff, or queue plus a rule-based
 * baseline). This file makes no network calls; the per-slot work is injected as `call`.
 */
import {
  apiKeyFor,
  chainFor,
  resolveModelId,
  type Env,
  type GenerationGroup,
  type ModelSlot,
} from "../config/models.js";
import { ChainExhaustedError, isRetriable } from "../providers/errors.js";

/** The work to run against a single slot: the resolved model id, the slot, and its API key. */
export type SlotCall<T> = (input: {
  slot: ModelSlot;
  modelId: string;
  apiKey: string;
}) => Promise<T>;

/** A successful chain result and which slot produced it, for logging and the gap report. */
export interface ChainResult<T> {
  readonly value: T;
  readonly slot: ModelSlot;
  readonly modelId: string;
}

/** Optional hook so the quota governor and logs can observe each attempt. */
export interface RunChainHooks {
  /** Called when a slot is skipped because its API key is not configured. */
  readonly onSkip?: (slot: ModelSlot, reason: "missing-key") => void;
  /** Called when a slot fails with a retriable error before the chain advances. */
  readonly onRetriableError?: (slot: ModelSlot, error: unknown) => void;
}

/**
 * Walk the chain and return the first usable result. Throws the slot's error unchanged if it is
 * not retriable (so genuine bugs surface), and ChainExhaustedError once the chain is spent.
 */
export async function runChain<T>(
  group: GenerationGroup,
  env: Env,
  call: SlotCall<T>,
  hooks: RunChainHooks = {},
): Promise<ChainResult<T>> {
  const attempted: string[] = [];

  for (const slot of chainFor(group)) {
    const modelId = resolveModelId(slot, env);
    const identifier = `${slot.provider}:${modelId}`;

    const apiKey = apiKeyFor(slot, env);
    if (apiKey === undefined || apiKey.length === 0) {
      hooks.onSkip?.(slot, "missing-key");
      continue;
    }

    attempted.push(identifier);
    try {
      const value = await call({ slot, modelId, apiKey });
      return { value, slot, modelId };
    } catch (error) {
      if (isRetriable(error)) {
        hooks.onRetriableError?.(slot, error);
        continue;
      }
      throw error;
    }
  }

  throw new ChainExhaustedError(
    `Every slot in the ${group.id} chain was exhausted or skipped.`,
    attempted,
  );
}
