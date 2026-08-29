/**
 * Text generation across a provider chain (PRD 10.1, 10.2). Gemini uses generateContent; Groq and
 * Mistral use the OpenAI-compatible chat completions shape. No SDKs, just fetch.
 *
 * Two shapes, for two callers:
 *
 * generateGrounded waits for the whole answer. It is what the tools want: a caller asking for an
 * excerpt or a meta description has nothing to show until the text is complete anyway.
 *
 * generateGroundedStream passes tokens through as the model produces them, and is what the chat
 * visitor gets. Buffering the whole answer and then replaying it word by word measured at 8.5
 * seconds of typing dots followed by a burst, which is the assistant looking broken while it works
 * perfectly. The fallback chain survives because a provider is committed to only once its first
 * token arrives: every failure the chain exists for (a rate limit, a retired model, an outage) is
 * reported in the response status before a single byte of text, and is still retried on the next
 * slot. A stream that dies after it has begun cannot be restarted without contradicting what the
 * visitor has already read, so that case ends the answer honestly rather than silently reflowing.
 */
import { runChain, type ChainResult, type RunChainHooks } from "../orchestration/run-chain.js";
import {
  apiKeyFor,
  chainFor,
  resolveModelId,
} from "../config/models.js";
import {
  ChainExhaustedError,
  isRetriable,
  ProviderForbiddenError,
  ModelNotFoundError,
  ProviderError,
  ProviderUnavailableError,
  RateLimitError,
} from "./errors.js";
import type { Env, GenerationGroup, ModelSlot } from "../config/models.js";

export interface ChatMessage {
  readonly role: "user" | "assistant";
  readonly content: string;
}

export interface GenerateOptions {
  readonly system: string;
  readonly user: string;
  readonly history?: readonly ChatMessage[];
  readonly temperature?: number;
  readonly maxTokens?: number;
}

async function httpError(
  response: Response,
  source: string,
): Promise<ProviderError> {
  const body = await response.text().catch(() => "");
  const detail = `${source} returned ${response.status}: ${body.slice(0, 300)}`;
  if (response.status === 429) return new RateLimitError(detail, source);
  // A refusal of this account or this model. The next slot may well be fine, so the chain should
  // move on rather than fail the request; see ProviderForbiddenError.
  if (response.status === 401 || response.status === 403)
    return new ProviderForbiddenError(detail, source);
  if (response.status >= 500)
    return new ProviderUnavailableError(detail, source);
  // A retired identifier reads as 404, or as a 400 naming the model, depending on the provider. Either
  // way the right move is the next slot, not failing the request.
  if (response.status === 404 || /model_not_found|does not exist|unknown model|is not found/i.test(body))
    return new ModelNotFoundError(detail, source);
  return new ProviderError(detail, source);
}

async function geminiGenerate(
  modelId: string,
  apiKey: string,
  options: GenerateOptions,
): Promise<string> {
  const source = `gemini:${modelId}`;
  const contents = [
    ...(options.history ?? []).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    { role: "user", parts: [{ text: options.user }] },
  ];
  let response: Response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: options.system }] },
          contents,
          generationConfig: {
            temperature: options.temperature ?? 0.2,
            maxOutputTokens: options.maxTokens ?? 800,
          },
        }),
      },
    );
  } catch (cause) {
    throw new ProviderUnavailableError(`${source} request failed`, source, {
      cause,
    });
  }
  if (!response.ok) throw await httpError(response, source);
  const json = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return (json.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("");
}

async function openAiCompatGenerate(
  baseUrl: string,
  modelId: string,
  apiKey: string,
  source: string,
  options: GenerateOptions,
): Promise<string> {
  const messages = [
    { role: "system", content: options.system },
    ...(options.history ?? []).map((m) => ({
      role: m.role,
      content: m.content,
    })),
    { role: "user", content: options.user },
  ];
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelId,
        messages,
        temperature: options.temperature ?? 0.2,
        max_tokens: options.maxTokens ?? 800,
      }),
    });
  } catch (cause) {
    throw new ProviderUnavailableError(`${source} request failed`, source, {
      cause,
    });
  }
  if (!response.ok) throw await httpError(response, source);
  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return json.choices?.[0]?.message?.content ?? "";
}

async function callSlot(
  slot: ModelSlot,
  modelId: string,
  apiKey: string,
  options: GenerateOptions,
): Promise<string> {
  switch (slot.provider) {
    case "gemini":
      return geminiGenerate(modelId, apiKey, options);
    case "groq":
      return openAiCompatGenerate(
        "https://api.groq.com/openai/v1",
        modelId,
        apiKey,
        `groq:${modelId}`,
        options,
      );
    case "mistral":
      return openAiCompatGenerate(
        "https://api.mistral.ai/v1",
        modelId,
        apiKey,
        `mistral:${modelId}`,
        options,
      );
  }
}

/**
 * Enforce the house rule that no generated text contains an em dash, regardless of the prompt
 * (models occasionally ignore the instruction). The em dash is replaced with a comma and space,
 * which reads naturally in its usual parenthetical or appositive use.
 */
export function stripEmDash(text: string): string {
  return text.replace(/\s*—\s*/g, ", ");
}

/**
 * The `data:` payloads of a server-sent-event response, in order.
 *
 * Both provider shapes stream SSE, and both can split a frame across network chunks, so the tail of
 * the buffer is kept until a newline completes it. A frame cut in half and parsed as JSON is the
 * classic way a streaming client drops tokens at random under load.
 */
async function* ssePayloads(response: Response, source: string): AsyncGenerator<string> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new ProviderUnavailableError(`${source} returned no stream`, source);
  }
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let newline = buffer.indexOf("\n");
    while (newline >= 0) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (line.startsWith("data:")) yield line.slice(5).trim();
      newline = buffer.indexOf("\n");
    }
  }
  const last = buffer.trim();
  if (last.startsWith("data:")) yield last.slice(5).trim();
}

/**
 * The em-dash house rule, applied to a stream.
 *
 * stripEmDash rewrites a run of whitespace around an em dash, which spans characters either side of
 * the dash, so running it on each chunk in isolation would miss any occurrence that straddles a
 * chunk boundary and let an em dash reach the page. Trailing whitespace and any dash are held back
 * until the next chunk shows what follows them.
 */
export class EmDashStream {
  private held = "";

  push(chunk: string): string {
    const text = this.held + chunk;
    // Whatever could still turn out to be part of an em-dash run once more text arrives.
    const tail = /(\s*—?\s*)$/u.exec(text)?.[1] ?? "";
    this.held = tail;
    return stripEmDash(text.slice(0, text.length - tail.length));
  }

  flush(): string {
    const out = stripEmDash(this.held);
    this.held = "";
    return out;
  }
}

async function* geminiStream(
  modelId: string,
  apiKey: string,
  options: GenerateOptions,
): AsyncGenerator<string> {
  const source = `gemini:${modelId}`;
  const contents = [
    ...(options.history ?? []).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    { role: "user", parts: [{ text: options.user }] },
  ];
  let response: Response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:streamGenerateContent?alt=sse`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: options.system }] },
          contents,
          generationConfig: {
            temperature: options.temperature ?? 0.2,
            maxOutputTokens: options.maxTokens ?? 800,
          },
        }),
      },
    );
  } catch (cause) {
    throw new ProviderUnavailableError(`${source} request failed`, source, { cause });
  }
  if (!response.ok) throw await httpError(response, source);
  for await (const payload of ssePayloads(response, source)) {
    let frame: { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    try {
      frame = JSON.parse(payload) as typeof frame;
    } catch {
      continue;
    }
    const text = (frame.candidates?.[0]?.content?.parts ?? [])
      .map((part) => part.text ?? "")
      .join("");
    if (text.length > 0) yield text;
  }
}

async function* openAiCompatStream(
  baseUrl: string,
  modelId: string,
  apiKey: string,
  source: string,
  options: GenerateOptions,
): AsyncGenerator<string> {
  const messages = [
    { role: "system", content: options.system },
    ...(options.history ?? []).map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: options.user },
  ];
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelId,
        messages,
        temperature: options.temperature ?? 0.2,
        max_tokens: options.maxTokens ?? 800,
        stream: true,
      }),
    });
  } catch (cause) {
    throw new ProviderUnavailableError(`${source} request failed`, source, { cause });
  }
  if (!response.ok) throw await httpError(response, source);
  for await (const payload of ssePayloads(response, source)) {
    if (payload === "[DONE]") break;
    let frame: { choices?: { delta?: { content?: string } }[] };
    try {
      frame = JSON.parse(payload) as typeof frame;
    } catch {
      continue;
    }
    const text = frame.choices?.[0]?.delta?.content ?? "";
    if (text.length > 0) yield text;
  }
}

function streamSlot(
  slot: ModelSlot,
  modelId: string,
  apiKey: string,
  options: GenerateOptions,
): AsyncGenerator<string> {
  switch (slot.provider) {
    case "gemini":
      return geminiStream(modelId, apiKey, options);
    case "groq":
      return openAiCompatStream(
        "https://api.groq.com/openai/v1",
        modelId,
        apiKey,
        `groq:${modelId}`,
        options,
      );
    case "mistral":
      return openAiCompatStream(
        "https://api.mistral.ai/v1",
        modelId,
        apiKey,
        `mistral:${modelId}`,
        options,
      );
  }
}

/** What a completed stream produced, for caching and for the gap report. */
export interface StreamedAnswer {
  readonly text: string;
  readonly slot: ModelSlot;
  readonly modelId: string;
}

/**
 * Stream a grounded answer over a generation group, walking the fallback chain.
 *
 * Yields text as it arrives and returns the assembled answer, so the caller can cache exactly what
 * the visitor read. The chain walk is repeated here rather than borrowed from runChain because
 * runChain resolves to a single value, and the whole point of this path is that there is no single
 * moment to resolve at; the skip and retriable rules are the same ones, from the same modules.
 *
 * A slot that produces no text at all is treated as a failure and the chain advances, which is the
 * streaming form of the empty-completion guard below.
 */
export async function* generateGroundedStream(
  group: GenerationGroup,
  env: Env,
  options: GenerateOptions,
  hooks: RunChainHooks = {},
): AsyncGenerator<string, StreamedAnswer> {
  const attempted: string[] = [];

  for (const slot of chainFor(group)) {
    const modelId = resolveModelId(slot, env);
    const apiKey = apiKeyFor(slot, env);
    if (apiKey === undefined || apiKey.length === 0) {
      hooks.onSkip?.(slot, "missing-key");
      continue;
    }
    attempted.push(`${slot.provider}:${modelId}`);

    const filter = new EmDashStream();
    let assembled = "";
    let committed = false;
    try {
      for await (const raw of streamSlot(slot, modelId, apiKey, options)) {
        const piece = filter.push(raw);
        // Committed at the first token, not at the first frame: a provider that opens a stream and
        // sends only empty frames has not answered, and the next slot should still get its turn.
        if (piece.length > 0) {
          committed = true;
          assembled += piece;
          yield piece;
        }
      }
      const tail = filter.flush();
      if (tail.length > 0) {
        assembled += tail;
        yield tail;
      }
      if (assembled.trim().length === 0) {
        throw new ProviderUnavailableError("empty completion", `${slot.provider}:${modelId}`);
      }
      return { text: assembled, slot, modelId };
    } catch (error) {
      // Past the first token there is no going back. Re-running the answer on another provider
      // would rewrite text the visitor has already read, so this stops and lets the caller close
      // the answer with the handoff.
      if (committed) throw error;
      if (isRetriable(error)) {
        // Same reasoning as runChain: the reason a slot was skipped is the useful part.
        console.warn(
          `[chain:${group.id}] ${slot.provider}:${modelId} failed, trying the next slot: ` +
          `${error instanceof Error ? error.message.slice(0, 200) : String(error)}`,
        );
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

/**
 * Generate a grounded answer over a generation group, walking the fallback chain. An empty
 * completion is treated as a service error so the chain advances to the next slot. The em-dash
 * house rule is enforced on every returned answer.
 */
export async function generateGrounded(
  group: GenerationGroup,
  env: Env,
  options: GenerateOptions,
): Promise<ChainResult<string>> {
  return runChain(group, env, async ({ slot, modelId, apiKey }) => {
    const text = stripEmDash((await callSlot(slot, modelId, apiKey, options)).trim());
    if (text.length === 0) {
      throw new ProviderUnavailableError(
        "empty completion",
        `${slot.provider}:${modelId}`,
      );
    }
    return text;
  });
}
