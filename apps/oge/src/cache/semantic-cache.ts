/**
 * The semantic cache (PRD 10.4): before any generation the prompt is embedded and compared to
 * recent prompt embeddings; a cosine match at or above the threshold returns the cached answer,
 * catching paraphrases of a question already answered. Embedding is far cheaper than generation,
 * so this turns a paraphrase into a near-free hit. Scoped by knowledge-base version.
 *
 * The embedding passed to find and add must be of the NORMALISED query, the same text stored in
 * normalised_query. Storing the normalised text beside a vector built from the raw string was how
 * unrelated questions came to look like paraphrases; see the threshold note below.
 */
import type { DbClient, GroundedAnswer, Source } from "../db.js";
import type { Env } from "../config/models.js";
import { toVectorLiteral } from "../providers/embeddings.js";

/**
 * Cosine threshold for a semantic-cache hit.
 *
 * PRD 10.2 specifies 0.92, calibrated for the original embedding stack. The default here is 0.88,
 * and it only holds because the vectors compared are of the NORMALISED query. That distinction is
 * the whole safety margin, so it is worth stating what happens without it.
 *
 * Re-measured against the live cache with Mistral Embed, in both forms:
 *
 *                                                       raw text   normalised
 *   "who founded nexoris technologies"
 *     vs "what services does nexoris technologies offer"   0.885       0.834
 *   "who is the ceo of nexoris" vs "what is nexoris"       0.882       0.819
 *   "what is nexoris" vs "what does nexoris technologies do" (a real paraphrase)  0.898
 *   "how much does a website cost" vs "what is the price of a website"            0.928
 *
 * On raw text, short questions are dominated by shared surface (capitals, the company name, the
 * question mark) and two genuinely different questions clear 0.88. That is not a threshold problem;
 * it is the wrong comparison, and it was answering "who founded the company" with the list of
 * services. On normalised text the worst unrelated pair measured sits at 0.834 and real paraphrases
 * at 0.898 and above, so 0.88 separates them with room either side.
 *
 * The bands do touch at the edges, and the error is deliberately one-sided: a miss costs one
 * generation, a false hit answers a question nobody asked. Override with
 * OGE_SEMANTIC_CACHE_THRESHOLD, which the runtime now actually passes.
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
