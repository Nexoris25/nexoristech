/**
 * Incremental knowledge-base re-ingestion (PRD 10.3). When the CMS publishes, updates, or
 * removes a page, it calls this with the page's canonical URL and text. An upsert re-chunks and
 * re-embeds only that page and replaces its chunks (in pgvector and the Meilisearch index); a
 * delete removes them. Bumping a page's chunks changes the latest knowledge-base version, which
 * invalidates the caches so answers reflect the new content within moments of publishing.
 */
import {
  Injectable,
  type OnModuleInit,
  type OnModuleDestroy,
} from "@nestjs/common";
import { createHash } from "node:crypto";
import pg from "pg";
import { buildKnowledgeBase } from "@nexoris/kb";
import { embedBatch, toVectorLiteral } from "../providers/embeddings.js";
import {
  MeiliClient,
  meiliConfigFromEnv,
  KB_INDEX,
  KB_PRIMARY_KEY,
  toDocId,
} from "../search/meilisearch.js";
import type { Env } from "../config/models.js";

const { Pool } = pg;
const EMBED_BATCH = 16;

export interface ReingestUpsert {
  action: "upsert";
  url: string;
  title: string;
  text: string;
  sourceType: string;
}
export interface ReingestDelete {
  action: "delete";
  url: string;
}
export type ReingestRequest = ReingestUpsert | ReingestDelete;

@Injectable()
export class IngestService implements OnModuleInit, OnModuleDestroy {
  private pool!: pg.Pool;
  private readonly env: Env = process.env;

  onModuleInit(): void {
    const connectionString = process.env.DATABASE_URL_OGE;
    if (!connectionString) throw new Error("DATABASE_URL_OGE is not set.");
    // The knowledge base is on a remote host, so a pool without timeouts hangs forever when it cannot
    // be reached. Failing in a few seconds is what lets /health report a problem instead of stalling.
    this.pool = new Pool({
      connectionString,
      max: 5,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      statement_timeout: 15000,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool?.end();
  }

  async handle(req: ReingestRequest): Promise<{ status: string; chunks: number }> {
    if (req.action === "delete") {
      await this.remove(req.url);
      return { status: "deleted", chunks: 0 };
    }
    return this.upsert(req);
  }

  private async remove(url: string): Promise<void> {
    await this.pool.query("DELETE FROM kb_chunk WHERE url = $1", [url]);
    await this.removeFromMeili(url);
  }

  private async upsert(
    req: ReingestUpsert,
  ): Promise<{ status: string; chunks: number }> {
    const chunks = buildKnowledgeBase([
      { url: req.url, title: req.title, text: req.text },
    ]);
    if (chunks.length === 0) {
      await this.remove(req.url);
      return { status: "empty", chunks: 0 };
    }

    const version = createHash("sha256")
      .update(`${req.url}\n${req.text}`)
      .digest("hex")
      .slice(0, 12);

    const vectors: number[][] = [];
    for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
      const slice = chunks.slice(i, i + EMBED_BATCH);
      const { vectors: v } = await embedBatch(
        slice.map((c) => c.text),
        this.env,
      );
      vectors.push(...v);
    }

    await this.pool.query("DELETE FROM kb_chunk WHERE url = $1", [req.url]);
    for (let i = 0; i < chunks.length; i += 1) {
      const chunk = chunks[i]!;
      const vector = vectors[i]!;
      const tokenCount = Math.max(
        1,
        Math.round(
          chunk.text.trim().split(/\s+/).filter(Boolean).length / 0.75,
        ),
      );
      await this.pool.query(
        `INSERT INTO kb_chunk
           (id, url, title, content, token_count, kb_version, source_type, embedding, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::vector, now())
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           content = EXCLUDED.content,
           token_count = EXCLUDED.token_count,
           kb_version = EXCLUDED.kb_version,
           source_type = EXCLUDED.source_type,
           embedding = EXCLUDED.embedding,
           updated_at = now()`,
        [
          chunk.id,
          chunk.url,
          chunk.title,
          chunk.text,
          tokenCount,
          version,
          req.sourceType,
          toVectorLiteral(vector),
        ],
      );
    }

    await this.reindexMeili(req, chunks);
    return { status: "upserted", chunks: chunks.length };
  }

  private async reindexMeili(
    req: ReingestUpsert,
    chunks: { id: string; url: string; title: string; text: string }[],
  ): Promise<void> {
    const config = meiliConfigFromEnv(this.env);
    if (!config) return;
    try {
      const meili = new MeiliClient(config);
      await meili.ensureIndex(KB_INDEX, KB_PRIMARY_KEY);
      await meili.deleteByFilter(KB_INDEX, `url = "${req.url}"`);
      await meili.addDocuments(
        KB_INDEX,
        chunks.map((c) => ({
          docId: toDocId(c.id),
          chunkId: c.id,
          url: c.url,
          title: c.title,
          content: c.text,
          sourceType: req.sourceType,
        })),
      );
    } catch (error) {
      console.warn(
        `Meilisearch reindex failed for ${req.url} (vector store still updated): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async removeFromMeili(url: string): Promise<void> {
    const config = meiliConfigFromEnv(this.env);
    if (!config) return;
    try {
      await new MeiliClient(config).deleteByFilter(KB_INDEX, `url = "${url}"`);
    } catch {
      // Best-effort; the vector store is the source of truth.
    }
  }
}
