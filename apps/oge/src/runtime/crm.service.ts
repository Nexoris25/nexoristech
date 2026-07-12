/**
 * CRM Worker assists for the admin dashboard (PRD 3.2). Auto-response drafting: a reply for a
 * salesperson to review and send, grounded in the lead's own words and the matched services,
 * drafts-only. No price or date the salesperson has not set; the house voice rules apply. A warm
 * template is the fallback when the CRM Worker chain is exhausted, so a draft is always available.
 */
import { Injectable } from "@nestjs/common";
import { CRM_WORKER_MODELS, type Env } from "../config/models.js";
import { generateGrounded } from "../providers/generation.js";

export interface DraftInput {
  name?: string;
  company?: string;
  message: string;
  matchedServices?: string[];
  industry?: string;
}

export interface DraftResult {
  draft: string;
  draftedBy: "ai" | "template";
}

const CRM_DRAFT_SYSTEM = `You draft a short reply email for a Nexoris Technologies salesperson to review before sending. Ground it only in what the lead said and the matched services provided. Write like a knowledgeable person talking across a table: warm, plain, and specific to their situation.
- Reply in English. Use complete sentences and short paragraphs. Never use an em dash. Never use buzzwords, jargon, or cliches. Always write "Nexoris Technologies" in full.
- Do not quote any price, and never propose a specific day or date. Offer a short scoping call to understand their goals and come back with a clear plan and honest numbers, and ask them to suggest a time that suits.
- Do not invent details, client names, or results. Do not include a subject line. Do not include any bracketed text or any placeholder such as [Your Name].
- Sign off exactly with these two lines and nothing after them:
Best regards,
The Nexoris Technologies team
Return only the email body.`;

function firstName(name: string | undefined): string {
  const trimmed = (name ?? "").trim();
  return trimmed.split(/\s+/)[0] || "there";
}

function templateDraft(input: DraftInput): string {
  const services =
    input.matchedServices && input.matchedServices.length > 0
      ? ` It sounds like ${input.matchedServices.join(" and ")} could be a good fit.`
      : "";
  return `Hi ${firstName(input.name)},

Thank you for reaching out to Nexoris Technologies.${services} I would like to understand your goals properly before suggesting anything specific.

Could we set up a short call this week? After it, we will come back with a clear plan and honest numbers, with no obligation.

Best regards,
The Nexoris Technologies team`;
}

@Injectable()
export class CrmService {
  private readonly env: Env = process.env;

  async draftReply(input: DraftInput): Promise<DraftResult> {
    try {
      const { value } = await generateGrounded(CRM_WORKER_MODELS, this.env, {
        system: CRM_DRAFT_SYSTEM,
        user: JSON.stringify({
          name: input.name ?? null,
          company: input.company ?? null,
          message: input.message,
          matchedServices: input.matchedServices ?? [],
          industry: input.industry ?? null,
        }),
        temperature: 0.4,
        maxTokens: 400,
      });
      const draft = value.trim();
      if (draft.length > 0) return { draft, draftedBy: "ai" };
    } catch {
      // Fall through to the warm template.
    }
    return { draft: templateDraft(input), draftedBy: "template" };
  }
}
