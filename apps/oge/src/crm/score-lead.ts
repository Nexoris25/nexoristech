/**
 * Score a lead (PRD 11, 3.1): the CRM Worker chain scores against the ideal customer profile,
 * intent, completeness, and source/page; if it cannot run, the deterministic baseline scores
 * immediately so the lead is never unscored. Runs once per lead at intake.
 */
import { CRM_WORKER_MODELS, type Env } from "../config/models.js";
import { generateGrounded } from "../providers/generation.js";
import type { LeadInput, LeadScore } from "./lead.js";
import { rulesBaselineScore } from "./score.js";
import { CRM_SCORE_SYSTEM, buildScoreUser, parseScore } from "./score-prompt.js";

export async function scoreLead(
  lead: LeadInput,
  env: Env,
): Promise<LeadScore> {
  try {
    const { value } = await generateGrounded(CRM_WORKER_MODELS, env, {
      system: CRM_SCORE_SYSTEM,
      user: buildScoreUser(lead),
      temperature: 0,
      maxTokens: 300,
    });
    const parsed = parseScore(value);
    if (parsed) return parsed;
  } catch {
    // Fall through to the immediate rules-based baseline.
  }
  return rulesBaselineScore(lead);
}
