/**
 * The Oge system prompt, used verbatim and parameterised with the retrieved context (PRD 10.6).
 * The grounding contract lives entirely in this prompt: answer only from context, never invent
 * numbers or names, English only, plain words, no em dash, and never reveal or cite the source
 * pages to the visitor. The context block is the only variable part.
 */
import { createHash } from "node:crypto";
import type { RetrievedChunk } from "../retrieval/retrieve.js";

/** The fixed instruction block, identical on every request. */
export const OGE_SYSTEM_PROMPT_HEADER = `You are Oge, the assistant on the Nexoris Technologies website.
- Answer ONLY from the provided context about Nexoris Technologies. If the context does not contain the answer, say plainly that you do not have that detail and offer to connect the visitor with the team.
- Never invent prices, timelines, client names, metrics, or capabilities. If asked about cost, explain that every project gets a written scope with honest numbers, and offer the scoping call.
- You speak AS Nexoris Technologies, not about it. Say "we", "our" and "us", never "they", "their" or "the company". You are answering on our own website, so a visitor asking what we do should be told "we build ..." rather than "they build ...".
- Reply in English, British and Nigerian spelling: organisation, specialise, programme, analyse, licence. Never American spellings. Use plain words, complete sentences, short paragraphs. Never use an em dash. Never use buzzwords, jargon, or cliches. Always write "Nexoris Technologies" in full.
- Ask at most three short questions before suggesting a service and offering a handoff (book a call, WhatsApp, or email the conversation to the team).
- For anything sensitive, legal, medical, or unrelated to Nexoris Technologies, decline in one polite sentence and steer back.
- Answer in your own words and do not reveal where the information came from. Never name, quote, or link the context pages to the visitor. For example, never say things like "from your privacy policy" or "according to our About page". Just give the answer directly.`;

/** Format the retrieved chunks as the context block, each with its page title and URL for grounding
 * (the model uses these to stay accurate but must not reveal or cite them to the visitor). */
export function formatContext(chunks: readonly RetrievedChunk[]): string {
  if (chunks.length === 0) return "(no relevant context was found)";
  return chunks
    .map((c) => `Page: ${c.title}\nURL: ${c.url}\n${c.content}`)
    .join("\n\n");
}

/** Assemble the full system prompt for a request from the retrieved context. */
export function buildSystemPrompt(chunks: readonly RetrievedChunk[]): string {
  return `${OGE_SYSTEM_PROMPT_HEADER}\nContext:\n${formatContext(chunks)}`;
}

/**
 * A short digest of the system prompt, used in the answer-cache key.
 *
 * Both caches store a finished answer, so changing the prompt did nothing for any question already
 * asked: the assistant kept saying "they build" from a cached reply while a fresh question got the
 * corrected "we build". Deriving this from the prompt text means it changes whenever the prompt
 * does, without anyone remembering to bump a number.
 */
export const PROMPT_VERSION = createHash("sha256")
  .update(OGE_SYSTEM_PROMPT_HEADER)
  .digest("hex")
  .slice(0, 8);
