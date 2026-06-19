/**
 * The Solution Finder service (PRD 10.5). The recommendation is deterministic (@nexoris/recommend);
 * the model writes only the short rationale, and a deterministic template is the fallback so the
 * finder always returns a usable result. Invalid answers are rejected before any model call.
 */
import { Injectable, BadRequestException } from "@nestjs/common";
import {
  matchRecommendation,
  isIndustrySlug,
  HEADACHE_OPTIONS,
  type FinderAnswers,
  type Recommendation,
} from "@nexoris/recommend";
import { generateGrounded } from "../providers/generation.js";
import { SERVICE_RECOMMENDER_MODELS, type Env } from "../config/models.js";
import {
  SERVICE_RECOMMENDER_SYSTEM,
  buildRationaleUser,
  deterministicRationale,
  parseRationale,
} from "./finder-prompt.js";

const headacheIds = new Set<string>(HEADACHE_OPTIONS.map((o) => o.value));

export interface FinderResult extends Recommendation {
  readonly rationale: string;
  readonly rationaleSource: "ai" | "template";
}

@Injectable()
export class FinderService {
  private readonly env: Env = process.env;

  /** Validate the incoming answers, rejecting anything outside the known enums. */
  private validate(input: unknown): FinderAnswers {
    const answers = (input ?? {}) as Record<string, unknown>;
    if (
      typeof answers.industry !== "string" ||
      !isIndustrySlug(answers.industry)
    ) {
      throw new BadRequestException("Unknown or missing industry.");
    }
    if (
      typeof answers.headache !== "string" ||
      !headacheIds.has(answers.headache)
    ) {
      throw new BadRequestException("Unknown or missing headache.");
    }
    return answers as unknown as FinderAnswers;
  }

  async recommend(input: unknown): Promise<FinderResult> {
    const answers = this.validate(input);
    const recommendation = matchRecommendation(answers);
    const { text, source } = await this.rationale(answers, recommendation);
    return { ...recommendation, rationale: text, rationaleSource: source };
  }

  private async rationale(
    answers: FinderAnswers,
    rec: Recommendation,
  ): Promise<{ text: string; source: "ai" | "template" }> {
    try {
      const { value } = await generateGrounded(
        SERVICE_RECOMMENDER_MODELS,
        this.env,
        {
          system: SERVICE_RECOMMENDER_SYSTEM,
          user: buildRationaleUser(answers, rec),
          temperature: 0.3,
          maxTokens: 250,
        },
      );
      const parsed = parseRationale(value);
      if (parsed) return { text: parsed, source: "ai" };
    } catch {
      // Fall through to the deterministic template.
    }
    return { text: deterministicRationale(answers, rec), source: "template" };
  }
}
