/**
 * Embeddings for the knowledge base and the semantic cache (PRD 10.3, 10.4). Walks the
 * EMBEDDING_MODELS chain: Mistral Embed first, the Gemini embeddings model as the fallback,
 * both over REST so no provider SDK is needed. Every vector is 1024 dimensions to match the
 * pgvector columns; the Gemini call requests 1024 output dimensions so the two providers stay
 * interchangeable in one index. A rate limit or outage advances to the fallback; a configuration
 * error (bad key, bad request) surfaces so it gets fixed rather than silently masked.
 */
import {
  EMBEDDING_MODELS,
  apiKeyFor,
  resolveModelId,
  type Env,
  type ModelSlot,
} from "../config/models.js";
import {
  ChainExhaustedError,
  ProviderError,
  ProviderUnavailableError,
  RateLimitError,
} from "./errors.js";

const DIMENSIONS = EMBEDDING_MODELS.dimensions;

/** Map an HTTP failure to the retriable taxonomy: 429 and 5xx advance the chain. */
async function httpError(
  response: Response,
  source: string,
): Promise<ProviderError> {
  const body = await response.text().catch(() => "");
  const detail = `${source} returned ${response.status} ${response.statusText}: ${body.slice(0, 300)}`;
  if (response.status === 429) return new RateLimitError(detail, source);
  if (response.status >= 500) return new ProviderUnavailableError(detail, source);
  return new ProviderError(detail, source);
}

function assertDimensions(vectors: number[][], source: string): number[][] {
  for (const vector of vectors) {
    if (vector.length !== DIMENSIONS) {
      throw new ProviderError(
        `Expected ${DIMENSIONS}-dimension embeddings but ${source} returned ${vector.length}.`,
        source,
      );
    }
  }
  return vectors;
}

async function mistralEmbed(
  modelId: string,
  apiKey: string,
  texts: string[],
): Promise<number[][]> {
  const source = `mistral:${modelId}`;
  let response: Response;
  try {
    response = await fetch("https://api.mistral.ai/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: modelId, input: texts }),
    });
  } catch (cause) {
    throw new ProviderUnavailableError(`${source} request failed`, source, {
      cause,
    });
  }
  if (!response.ok) throw await httpError(response, source);

  const json = (await response.json()) as {
    data?: { index: number; embedding: number[] }[];
  };
  const rows = json.data ?? [];
  const ordered = [...rows].sort((a, b) => a.index - b.index);
  if (ordered.length !== texts.length) {
    throw new ProviderError(
      `${source} returned ${ordered.length} embeddings for ${texts.length} inputs.`,
      source,
    );
  }
  return assertDimensions(
    ordered.map((row) => row.embedding),
    source,
  );
}

async function geminiEmbed(
  modelId: string,
  apiKey: string,
  texts: string[],
): Promise<number[][]> {
  const source = `gemini:${modelId}`;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:batchEmbedContents`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        requests: texts.map((text) => ({
          model: `models/${modelId}`,
          content: { parts: [{ text }] },
          outputDimensionality: DIMENSIONS,
        })),
      }),
    });
  } catch (cause) {
    throw new ProviderUnavailableError(`${source} request failed`, source, {
      cause,
    });
  }
  if (!response.ok) throw await httpError(response, source);

  const json = (await response.json()) as {
    embeddings?: { values: number[] }[];
  };
  const rows = json.embeddings ?? [];
  if (rows.length !== texts.length) {
    throw new ProviderError(
      `${source} returned ${rows.length} embeddings for ${texts.length} inputs.`,
      source,
    );
  }
  return assertDimensions(
    rows.map((row) => row.values),
    source,
  );
}

async function callSlot(
  slot: ModelSlot,
  modelId: string,
  apiKey: string,
  texts: string[],
): Promise<number[][]> {
  return slot.provider === "mistral"
    ? mistralEmbed(modelId, apiKey, texts)
    : geminiEmbed(modelId, apiKey, texts);
}

/** The slot that produced a batch of embeddings, alongside the vectors. */
export interface EmbedResult {
  readonly vectors: number[][];
  readonly slot: ModelSlot;
  readonly modelId: string;
}

/**
 * Embed a batch of texts, returning one 1024-dimension vector per input in order. Tries Mistral
 * Embed, then the Gemini fallback, skipping a slot whose key is not configured.
 */
export async function embedBatch(
  texts: string[],
  env: Env,
): Promise<EmbedResult> {
  const attempted: string[] = [];
  for (const slot of [EMBEDDING_MODELS.primary, EMBEDDING_MODELS.fallback]) {
    const apiKey = apiKeyFor(slot, env);
    if (apiKey === undefined || apiKey.length === 0) continue;
    const modelId = resolveModelId(slot, env);
    attempted.push(`${slot.provider}:${modelId}`);
    try {
      const vectors = await callSlot(slot, modelId, apiKey, texts);
      return { vectors, slot, modelId };
    } catch (error) {
      if (
        error instanceof RateLimitError ||
        error instanceof ProviderUnavailableError
      ) {
        continue;
      }
      throw error;
    }
  }
  throw new ChainExhaustedError(
    "The embedding chain was exhausted or skipped for every slot.",
    attempted,
  );
}

/** Format a vector as a pgvector literal for parameterised insertion (cast `$n::vector`). */
export function toVectorLiteral(vector: number[]): string {
  return `[${vector.join(",")}]`;
}
