/**
 * Builds the canonical knowledge base from source documents (PRD 10.3). Each source is
 * chunked deterministically and every chunk keeps its source URL and title so the assistant can
 * name and link the page an answer comes from. The output is ready for apps/oge to embed and
 * store in pgvector; this step needs no secrets.
 */
import { chunkText } from "./chunk.js";
import type { ChunkOptions, KbChunk, KbSource } from "./types.js";

/** Build knowledge-base chunks from a set of source documents. */
export function buildKnowledgeBase(
  sources: KbSource[],
  options: ChunkOptions = {},
): KbChunk[] {
  const chunks: KbChunk[] = [];
  for (const source of sources) {
    const pieces = chunkText(source.text, options);
    pieces.forEach((text, index) => {
      chunks.push({
        id: `${source.url}#${index}`,
        url: source.url,
        title: source.title,
        text,
        index,
      });
    });
  }
  return chunks;
}
