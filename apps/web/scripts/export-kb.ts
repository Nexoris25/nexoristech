/**
 * Emit the canonical knowledge base from the hardcoded marketing modules (PRD 10.3). This is
 * the web-build half: it chunks the 36 pages with @nexoris/kb and writes a single JSON artifact
 * that apps/oge embeds and indexes. The kbVersion is a content hash, so re-running on unchanged
 * content produces the same version and the Oge ingest becomes a no-op (and caches stay valid).
 * No secrets are involved here.
 *
 * Run with: pnpm --filter @nexoris/web kb:export
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { buildKnowledgeBase } from "@nexoris/kb";
import { hardcodedKbSources } from "../src/content/kb-source.js";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "..", "..", "artifacts");
const outFile = join(outDir, "knowledge-base.json");

/** Estimate tokens the same way the chunker does: roughly words divided by 0.75. */
function estimateTokens(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 0.75));
}

const chunks = buildKnowledgeBase(hardcodedKbSources());

const kbVersion = createHash("sha256")
  .update(chunks.map((c) => `${c.id}\n${c.text}`).join("\n\n"))
  .digest("hex")
  .slice(0, 12);

const records = chunks.map((c) => ({
  id: c.id,
  url: c.url,
  title: c.title,
  text: c.text,
  index: c.index,
  sourceType: "hardcoded" as const,
  tokenCount: estimateTokens(c.text),
}));

mkdirSync(outDir, { recursive: true });
writeFileSync(
  outFile,
  `${JSON.stringify(
    {
      kbVersion,
      generatedAt: new Date().toISOString(),
      sourceType: "hardcoded",
      chunkCount: records.length,
      chunks: records,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(
  `Wrote ${records.length} chunks (kbVersion ${kbVersion}) to ${outFile}`,
);
