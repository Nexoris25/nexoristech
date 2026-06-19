/**
 * A small debugging CLI for hybrid retrieval (PRD 10.4, useful for the 10.7 acceptance tests).
 * Embeds a query, runs vector + keyword search, fuses them, and prints the grounded chunks with
 * their source URLs. Reads the connection string and keys from the gitignored .env.
 *
 * Run with: pnpm --filter @nexoris/oge kb:retrieve "how much does a website cost"
 */
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";
import { retrieve } from "../src/retrieval/retrieve.js";

const { Client } = pg;
const here = dirname(fileURLToPath(import.meta.url));

function loadLocalEnv(): void {
  try {
    process.loadEnvFile(join(here, "..", "..", "..", ".env"));
  } catch {
    // rely on the real environment
  }
}

async function run(): Promise<void> {
  loadLocalEnv();
  const query =
    process.argv.slice(2).join(" ").trim() || "how much does a website cost";

  const connectionString = process.env.DATABASE_URL_OGE;
  if (!connectionString) throw new Error("DATABASE_URL_OGE is not set.");

  const client = new Client({ connectionString });
  await client.connect();
  try {
    const result = await retrieve(client, process.env, query, { limit: 5 });
    console.log(`Query: ${query}`);
    console.log(
      `Retrieval: ${result.usedKeyword ? "hybrid (vector + keyword)" : "vector-only (keyword unavailable)"}`,
    );
    console.log("");
    result.chunks.forEach((chunk, i) => {
      const snippet = chunk.content.replace(/\s+/g, " ").slice(0, 110);
      console.log(`${i + 1}. ${chunk.title}`);
      console.log(`   ${chunk.url}`);
      console.log(`   ${snippet}...`);
    });
  } finally {
    await client.end();
  }
}

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
