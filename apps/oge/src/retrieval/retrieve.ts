/**
 * Hybrid retrieval over the knowledge base (PRD 10.4): pgvector cosine search and Meilisearch
 * keyword search run in our own infrastructure, then reciprocal rank fusion merges them. Only the
 * final grounded synthesis is a model call elsewhere; retrieval itself makes one cheap embedding
 * call for the query and two local searches. If Meilisearch is unavailable or unconfigured,
 * retrieval degrades cleanly to vector-only so the assistant keeps working.
 */
import { embedBatch, toVectorLiteral } from "../providers/embeddings.js";
import type { Env } from "../config/models.js";
import type { DbClient } from "../db.js";
import {
  MeiliClient,
  meiliConfigFromEnv,
  KB_INDEX,
} from "../search/meilisearch.js";
import { reciprocalRankFusion } from "./fuse.js";

/** A chunk returned from retrieval, with everything needed to ground and cite an answer. */
export interface RetrievedChunk {
  readonly chunkId: string;
  readonly url: string;
  readonly title: string;
  readonly content: string;
}

export interface RetrieveOptions {
  /** Final number of chunks to return after fusion. */
  readonly limit?: number;
  /** Candidates to pull from each retriever before fusion. */
  readonly candidates?: number;
}

export interface RetrieveResult {
  readonly chunks: RetrievedChunk[];
  /** False when Meilisearch was unavailable and retrieval fell back to vector-only. */
  readonly usedKeyword: boolean;
}

async function vectorSearch(
  db: DbClient,
  queryVector: number[],
  candidates: number,
): Promise<RetrievedChunk[]> {
  const { rows } = await db.query<{
    chunkId: string;
    url: string;
    title: string;
    content: string;
  }>(
    `SELECT id AS "chunkId", url, title, content
       FROM kb_chunk
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> $1::vector
      LIMIT $2`,
    [toVectorLiteral(queryVector), candidates],
  );
  return rows;
}

async function keywordSearch(
  env: Env,
  query: string,
  candidates: number,
): Promise<RetrievedChunk[] | null> {
  const config = meiliConfigFromEnv(env);
  if (!config) return null;
  try {
    const client = new MeiliClient(config);
    const hits = await client.search(KB_INDEX, query, { limit: candidates });
    return hits.map((h) => ({
      chunkId: h.chunkId,
      url: h.url,
      title: h.title,
      content: h.content,
    }));
  } catch (error) {
    // Keyword search is best-effort; the vector half still grounds the answer.
    console.warn(
      `Meilisearch keyword retrieval unavailable, using vector-only: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return null;
  }
}

/**
 * Retrieve the most relevant knowledge-base chunks for a query, fusing vector and keyword
 * results. Returns deduplicated chunks ordered by fused relevance, capped at `limit`.
 */
export async function retrieve(
  db: DbClient,
  env: Env,
  query: string,
  options: RetrieveOptions = {},
): Promise<RetrieveResult> {
  const limit = options.limit ?? 6;
  const candidates = options.candidates ?? Math.max(limit * 2, 12);

  const { vectors } = await embedBatch([query], env);
  const queryVector = vectors[0];
  if (!queryVector) {
    return { chunks: [], usedKeyword: false };
  }

  const [vectorHits, keywordHits] = await Promise.all([
    vectorSearch(db, queryVector, candidates),
    keywordSearch(env, query, candidates),
  ]);

  const lists =
    keywordHits === null ? [vectorHits] : [vectorHits, keywordHits];
  const fused = reciprocalRankFusion(lists, (c) => c.chunkId);

  return {
    chunks: fused.slice(0, limit).map((f) => f.item),
    usedKeyword: keywordHits !== null,
  };
}
