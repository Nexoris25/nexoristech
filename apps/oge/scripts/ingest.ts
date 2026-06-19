/**
 * Ingest the knowledge-base artifact into nexoris_oge (PRD 10.3). Reads the JSON the web build
 * emits (apps/web kb:export), embeds each chunk once through the embedding chain (Mistral Embed,
 * Gemini fallback), and upserts it into kb_chunk with its source URL, title, and the kbVersion.
 * After a full pass it prunes any hardcoded chunk left from an older version, so a release rebuild
 * leaves the table exactly matching the artifact. Embedding is paced in small batches to stay
 * inside free-tier limits. The connection string and provider keys come from the gitignored .env.
 *
 * Run with: pnpm --filter @nexoris/oge kb:ingest
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";
import { embedBatch, toVectorLiteral } from "../src/providers/embeddings.js";
import {
  MeiliClient,
  meiliConfigFromEnv,
  KB_INDEX,
  KB_PRIMARY_KEY,
  toDocId,
} from "../src/search/meilisearch.js";

const { Client } = pg;
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..", "..");

const BATCH_SIZE = 16;
const PAUSE_MS = 1200; // gentle pacing between provider calls for the free tier

interface KbArtifact {
  kbVersion: string;
  sourceType: string;
  chunkCount: number;
  chunks: {
    id: string;
    url: string;
    title: string;
    text: string;
    index: number;
    sourceType: "hardcoded" | "catalogue" | "insight" | "legal" | "pseo";
    tokenCount: number;
  }[];
}

function loadLocalEnv(): void {
  try {
    process.loadEnvFile(join(repoRoot, ".env"));
  } catch {
    // No .env on disk; rely on the real environment.
  }
}

function artifactPath(): string {
  return (
    process.env.KB_FILE ?? join(repoRoot, "artifacts", "knowledge-base.json")
  );
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

function chunked<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

async function run(): Promise<void> {
  loadLocalEnv();

  const path = artifactPath();
  const artifact = JSON.parse(readFileSync(path, "utf8")) as KbArtifact;
  console.log(
    `Ingesting ${artifact.chunkCount} chunks (kbVersion ${artifact.kbVersion}, source ${artifact.sourceType}) from ${path}`,
  );

  const connectionString = process.env.DATABASE_URL_OGE;
  if (!connectionString) {
    throw new Error("DATABASE_URL_OGE is not set.");
  }

  const client = new Client({ connectionString });
  await client.connect();
  try {
    const env = process.env;
    let embedded = 0;
    const usedSlots = new Set<string>();
    const meiliDocs: {
      docId: string;
      chunkId: string;
      url: string;
      title: string;
      content: string;
      sourceType: string;
    }[] = [];

    // The keyword index covers every chunk and needs no embedding, so build its docs from the
    // whole artifact up front.
    for (const chunk of artifact.chunks) {
      meiliDocs.push({
        docId: toDocId(chunk.id),
        chunkId: chunk.id,
        url: chunk.url,
        title: chunk.title,
        content: chunk.text,
        sourceType: chunk.sourceType,
      });
    }

    // Embed once: skip chunks already stored at this exact version (PRD 10.3), so a re-run on
    // unchanged content makes no provider calls.
    const existing = new Set(
      (
        await client.query<{ id: string }>(
          `SELECT id FROM kb_chunk WHERE kb_version = $1 AND embedding IS NOT NULL`,
          [artifact.kbVersion],
        )
      ).rows.map((r) => r.id),
    );
    const toEmbed = artifact.chunks.filter((c) => !existing.has(c.id));
    const skipped = artifact.chunks.length - toEmbed.length;

    for (const batch of chunked(toEmbed, BATCH_SIZE)) {
      const { vectors, slot, modelId } = await embedBatch(
        batch.map((c) => c.text),
        env,
      );
      usedSlots.add(`${slot.label} (${modelId})`);

      for (let i = 0; i < batch.length; i += 1) {
        const chunk = batch[i]!;
        const vector = vectors[i]!;
        await client.query(
          `INSERT INTO kb_chunk
             (id, url, title, content, token_count, kb_version, source_type, embedding, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8::vector, now())
           ON CONFLICT (id) DO UPDATE SET
             url = EXCLUDED.url,
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
            chunk.tokenCount,
            artifact.kbVersion,
            chunk.sourceType,
            toVectorLiteral(vector),
          ],
        );
      }

      embedded += batch.length;
      process.stdout.write(`  embedded ${embedded}/${toEmbed.length}\r`);
      await sleep(PAUSE_MS);
    }
    if (toEmbed.length > 0) process.stdout.write("\n");

    // Prune stale chunks of this source type left from an older version (full rebuild semantics).
    const pruned = await client.query(
      `DELETE FROM kb_chunk WHERE source_type = $1 AND kb_version <> $2`,
      [artifact.sourceType, artifact.kbVersion],
    );

    const total = await client.query<{ count: string }>(
      "SELECT count(*)::text AS count FROM kb_chunk",
    );

    console.log(
      `Provider(s) used: ${[...usedSlots].join(", ") || "none (all chunks already embedded)"}`,
    );
    console.log(
      `Embedded ${embedded}, skipped ${skipped} already at this version, pruned ${pruned.rowCount ?? 0} stale.`,
    );
    console.log(`kb_chunk now holds ${total.rows[0]?.count ?? "?"} rows.`);

    // Keyword index for the hybrid retrieval (best-effort: a missing Meilisearch does not fail
    // the vector ingest above).
    const meiliConfig = meiliConfigFromEnv(env);
    if (!meiliConfig) {
      console.log("Meilisearch not configured; skipped keyword indexing.");
    } else {
      try {
        const meili = new MeiliClient(meiliConfig);
        await meili.ensureIndex(KB_INDEX, KB_PRIMARY_KEY);
        await meili.updateSettings(KB_INDEX, {
          searchableAttributes: ["title", "content"],
          filterableAttributes: ["sourceType", "url"],
          displayedAttributes: ["docId", "chunkId", "url", "title", "content"],
        });
        // Full-rebuild semantics for this source type: clear then add.
        await meili.deleteByFilter(
          KB_INDEX,
          `sourceType = "${artifact.sourceType}"`,
        );
        await meili.addDocuments(KB_INDEX, meiliDocs);
        console.log(
          `Meilisearch index "${KB_INDEX}" updated with ${meiliDocs.length} documents.`,
        );
      } catch (error) {
        console.warn(
          `Meilisearch indexing failed (vector store is still updated): ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  } finally {
    await client.end();
  }
}

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
