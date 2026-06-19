/**
 * Prompt and parsing for the Solution Finder rationale (PRD 10.5). The services and industry page
 * are already chosen deterministically by @nexoris/recommend; the model writes only a short
 * rationale, returned as strict JSON so it cannot name a page that does not exist. A deterministic
 * template is the fallback when the model is unavailable or returns malformed output, so the
 * finder always returns a usable explanation.
 */
import {
  HEADACHE_OPTIONS,
  type FinderAnswers,
  type Recommendation,
} from "@nexoris/recommend";

const headacheLabels = new Map(HEADACHE_OPTIONS.map((o) => [o.value, o.label]));

/** Join labels into plain prose: "A", "A and B", or "A, B, and C". */
function formatList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export const SERVICE_RECOMMENDER_SYSTEM = `You are Oge, the assistant on the Nexoris Technologies website. A visitor used the Solution Finder. The recommended services and the industry page have already been chosen by our system. Write ONLY a short rationale of two or three sentences explaining why these services fit what the visitor told us.
- Reply in English. Use plain words and complete sentences. Never use an em dash. Never use buzzwords, jargon, or cliches. Always write "Nexoris Technologies" in full.
- Do not mention any service or page that is not in the provided list. Do not invent prices, timelines, client names, or results.
- Return strict JSON of exactly this form and nothing else: {"rationale": "..."}`;

/** The user message: the visitor's answers and the already-chosen pages, as compact JSON. */
export function buildRationaleUser(
  answers: FinderAnswers,
  rec: Recommendation,
): string {
  return JSON.stringify({
    headache: headacheLabels.get(answers.headache) ?? answers.headache,
    industry: rec.industry.label,
    companySize: answers.companySize ?? null,
    urgency: answers.urgency ?? null,
    recommendedServices: rec.services.map((s) => s.label),
  });
}

/**
 * Parse the model's strict-JSON rationale. Tolerates a code fence and the reasoning block that
 * some models (for example Qwen on Groq) emit, by stripping any <think> block and extracting the
 * JSON object from the remaining text. Returns null if no usable rationale is found.
 */
export function parseRationale(modelText: string): string | null {
  const withoutThink = modelText.replace(/<think>[\s\S]*?<\/think>/gi, "");
  const match = withoutThink.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed: unknown = JSON.parse(match[0]);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "rationale" in parsed &&
      typeof (parsed as { rationale: unknown }).rationale === "string"
    ) {
      const rationale = (parsed as { rationale: string }).rationale.trim();
      return rationale.length > 0 ? rationale : null;
    }
  } catch {
    return null;
  }
  return null;
}

/** The deterministic rationale used when the model is unavailable or returns bad output. */
export function deterministicRationale(
  answers: FinderAnswers,
  rec: Recommendation,
): string {
  const services = formatList(rec.services.map((s) => s.label));
  const verb = rec.services.length > 1 ? "are" : "is";
  const headache = headacheLabels.get(answers.headache) ?? answers.headache;
  return `You told us your main challenge is: "${headache}". For a ${rec.industry.label} business, ${services} ${verb} where Nexoris Technologies would start. Tell us a little more and the team will come back with a clear plan and honest numbers.`;
}
