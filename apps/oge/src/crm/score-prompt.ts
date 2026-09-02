/**
 * Prompt and parsing for generative lead scoring (PRD 3.1). The model scores the four signals the
 * justification must name; a deterministic baseline is the fallback. The ideal customer profile is
 * grounded in the approved positioning (custom software and AI for businesses and public
 * institutions in Nigeria and abroad) and the home trust strip (founders, executives, operations
 * leaders, public institutions), recorded in DECISIONS D-015 and confirmable.
 */
import { bandForScore, type LeadInput, type LeadScore } from "./lead.js";

export const CRM_SCORE_SYSTEM = `You score inbound leads for Nexoris Technologies, which designs and builds custom software, websites, apps, automation, e-commerce, data tools, and AI for businesses and public institutions in Nigeria and abroad. A strong-fit lead is a founder, executive, operations leader, or public-sector decision maker with a concrete business problem and intent to act.
Score the lead from 1 to 100 and assign a band: Hot for 70 and above, Warm for 45 to 69, Cold for below 45. Weigh four signals: fit against that ideal customer profile, the intent shown in the message, how complete the shared information is, and the source and page. A low score never rejects anyone; it only orders the queue.
Some leads arrive from a chat with Oge, our website assistant, and carry the conversation that produced them. Read all of it for context, but weigh only what the visitor said when you judge intent and fit. Oge's own turns are our marketing copy and are evidence of nothing about the visitor. A short question answered at length by Oge is a short question.
Write a clear, plain-language justification that names the specific signals behind the score. Reply in English. Never use an em dash. Never use buzzwords, jargon, or cliches. Always write "Nexoris Technologies" in full. Do not invent any detail that is not in the lead.
Return strict JSON of exactly this form and nothing else: {"score": <number 1 to 100>, "band": "Hot|Warm|Cold", "justification": "..."}`;

/** The lead as compact JSON for the model. Runs server-side, so all context is included. */
export function buildScoreUser(lead: LeadInput): string {
  return JSON.stringify({
    source: lead.source,
    page: lead.page ?? null,
    name: lead.name ?? null,
    hasEmail: Boolean(lead.email),
    hasPhone: Boolean(lead.phone),
    company: lead.company ?? null,
    topic: lead.topic ?? null,
    message: lead.transcript?.length ? null : (lead.message ?? null),
    // Kept as turns rather than flattened into the message, so "who said this" survives the trip
    // to the model and the instruction to weigh only the visitor's words can actually be followed.
    conversation:
      lead.transcript?.map((turn) => ({ role: turn.role, text: turn.text })) ??
      null,
    finder: lead.finder ?? null,
  });
}

/** Parse the model's strict-JSON score, tolerating a reasoning block. Returns null if unusable. */
export function parseScore(modelText: string): LeadScore | null {
  const withoutThink = modelText.replace(/<think>[\s\S]*?<\/think>/gi, "");
  const match = withoutThink.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed: unknown = JSON.parse(match[0]);
    if (typeof parsed !== "object" || parsed === null) return null;
    const record = parsed as Record<string, unknown>;
    if (
      typeof record.score !== "number" ||
      typeof record.justification !== "string" ||
      record.justification.trim().length === 0
    ) {
      return null;
    }
    const score = Math.max(1, Math.min(100, Math.round(record.score)));
    const band =
      record.band === "Hot" || record.band === "Warm" || record.band === "Cold"
        ? record.band
        : bandForScore(score);
    return {
      score,
      band,
      justification: record.justification.trim(),
      scoredBy: "ai",
    };
  } catch {
    return null;
  }
}
