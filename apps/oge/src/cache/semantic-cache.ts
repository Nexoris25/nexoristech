/**
 * The semantic cache (PRD 10.4): before any generation the prompt is embedded and compared to
 * recent prompt embeddings; a cosine match at or above the threshold returns the cached answer,
 * catching paraphrases of a question already answered. Embedding is far cheaper than generation,
 * so this turns a paraphrase into a near-free hit. Scoped by knowledge-base version.
 */
import type { DbClient, GroundedAnswer, Source } from "../db.js";
import type { Env } from "../config/models.js";
import { toVectorLiteral } from "../providers/embeddings.js";

/**
 * Cosine threshold for a semantic-cache hit. PRD 10.2 specifies 0.92, but that was calibrated for
 * the original embedding stack. Measured with Mistral Embed (DECISIONS D-014), genuine
 * paraphrases score 0.85 to 0.89 and unrelated queries about 0.68, so 0.92 would almost never
 * hit. The default is set to 0.88: it catches the clearest paraphrases while staying well above
 * the unrelated band, and it errs safe (a miss just falls through to generation, whereas a false
 * hit would return a wrong answer). Override with OGE_SEMANTIC_CACHE_THRESHOLD.
 */
export const SEMANTIC_CACHE_THRESHOLD = 0.88;

/** The semantic-cache threshold, honouring the env override when set and valid. */
export function semanticThreshold(env: Env): number {
  const raw = env.OGE_SEMANTIC_CACHE_THRESHOLD;
  if (raw === undefined) return SEMANTIC_CACHE_THRESHOLD;
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) && parsed > 0 && parsed <= 1
    ? parsed
    : SEMANTIC_CACHE_THRESHOLD;
}

type Row = {
  answer: string;
  sources: Source[];
  sim: number;
};

export class SemanticCache {
  constructor(private readonly db: DbClient) {}

  /** Return a cached answer whose prompt embedding is within the threshold, or null. */
  async find(
    embedding: number[],
    kbVersion: string,
    threshold: number = SEMANTIC_CACHE_THRESHOLD,
  ): Promise<GroundedAnswer | null> {
    const { rows } = await this.db.query<Row>(
      `SELECT answer, sources, 1 - (prompt_embedding <=> $1::vector) AS sim
         FROM semantic_cache
        WHERE kb_version = $2
        ORDER BY prompt_embedding <=> $1::vector
        LIMIT 1`,
      [toVectorLiteral(embedding), kbVersion],
    );
    const row = rows[0];
    if (!row || row.sim < threshold) return null;
    return { answer: row.answer, sources: row.sources };
  }

  /** Remember an answer keyed by its prompt embedding. */
  async add(
    embedding: number[],
    query: string,
    kbVersion: string,
    answer: string,
    sources: Source[],
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO semantic_cache
         (prompt_embedding, normalised_query, kb_version, answer, sources)
       VALUES ($1::vector, $2, $3, $4, $5::jsonb)`,
      [
        toVectorLiteral(embedding),
        query,
        kbVersion,
        answer,
        JSON.stringify(sources),
      ],
    );
  }
}
