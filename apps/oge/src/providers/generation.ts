/**
 * Text generation across a provider chain (PRD 10.1, 10.2). Each provider is called without
 * streaming and the full grounded answer is returned, so runChain can fall back cleanly on a rate
 * limit or outage; the runtime then streams that answer to the visitor. Gemini uses generateContent;
 * Groq and Mistral use the OpenAI-compatible chat completions shape. No SDKs, just fetch.
 */
import { runChain, type ChainResult } from "../orchestration/run-chain.js";
import {
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
  if (response.status >= 500)
    return new ProviderUnavailableError(detail, source);
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
