/**
 * The exact-match cache (PRD 10.4): common questions answered with zero model calls, keyed by a
 * normalised query hash plus the knowledge-base version. A hit bumps the hit counter and the
 * last-hit time so the gap report and pre-warming can see what is popular. Entries for an old
 * version are simply never matched (the version is part of the key) and pruned at re-ingest.
 */
import type { DbClient, GroundedAnswer, Source } from "../db.js";
import { normaliseQuery, queryHash } from "./normalise.js";

type Row = {
  answer: string;
  sources: Source[];
};

export class ExactMatchCache {
  constructor(private readonly db: DbClient) {}

  /** Return the cached answer for a query at this version, or null. Records the hit on a match. */
  async get(query: string, kbVersion: string): Promise<GroundedAnswer | null> {
    const hash = queryHash(query, kbVersion);
    const { rows } = await this.db.query<Row>(
      `UPDATE exact_match_cache
          SET hits = hits + 1, last_hit_at = now()
        WHERE query_hash = $1 AND kb_version = $2
      RETURNING answer, sources`,
      [hash, kbVersion],
    );
    const row = rows[0];
    return row ? { answer: row.answer, sources: row.sources } : null;
  }

  /** Store (or refresh) an answer for a query at this version. */
  async set(
    query: string,
    kbVersion: string,
    answer: string,
    sources: Source[],
  ): Promise<void> {
    const hash = queryHash(query, kbVersion);
    await this.db.query(
      `INSERT INTO exact_match_cache
         (query_hash, normalised_query, kb_version, answer, sources)
       VALUES ($1, $2, $3, $4, $5::jsonb)
       ON CONFLICT (query_hash) DO UPDATE SET
         answer = EXCLUDED.answer,
         sources = EXCLUDED.sources,
         kb_version = EXCLUDED.kb_version`,
      [hash, normaliseQuery(query), kbVersion, answer, JSON.stringify(sources)],
    );
  }
}
