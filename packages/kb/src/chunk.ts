/**
 * Deterministic, block-aware chunking for the knowledge base (PRD 10.3).
 *
 * Text is split into blocks on blank lines, and blocks are packed greedily into chunks of about
 * 800 tokens with about 100 tokens of overlap between neighbours. A block is never split, so a
 * paragraph, an FAQ question-and-answer pair, or an answer block always stays whole; a single
 * oversized block becomes its own chunk rather than being cut. No model calls are made: token
 * counts are estimated from the word count, which is enough to size chunks consistently.
 */
import type { ChunkOptions } from "./types.js";

const DEFAULT_MAX_TOKENS = 800;
const DEFAULT_OVERLAP_TOKENS = 100;

/**
 * Estimate the token count of a string. English averages about 0.75 words per token, so tokens
 * are roughly words divided by 0.75. This is an estimate used only to size chunks; it never
 * needs to match a specific tokenizer.
 */
export function estimateTokens(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.ceil(words / 0.75);
}

/** Split text into atomic blocks on blank lines, trimming and dropping empty blocks. */
export function splitBlocks(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);
}

/**
 * Pack blocks into chunks of at most maxTokens, seeding each new chunk with the trailing
 * blocks of the previous one up to overlapTokens so neighbouring chunks share context.
 */
export function chunkBlocks(
  blocks: string[],
  options: ChunkOptions = {},
): string[] {
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  const overlapTokens = options.overlapTokens ?? DEFAULT_OVERLAP_TOKENS;

  const chunks: string[] = [];
  let current: string[] = [];
  let currentTokens = 0;

  const flush = (): void => {
    if (current.length > 0) {
      chunks.push(current.join("\n\n"));
    }
  };

  for (const block of blocks) {
    const blockTokens = estimateTokens(block);
    if (current.length > 0 && currentTokens + blockTokens > maxTokens) {
      flush();
      // Seed the next chunk with the trailing blocks of this one, up to the overlap budget.
      const overlap: string[] = [];
      let overlapCount = 0;
      for (let i = current.length - 1; i >= 0; i -= 1) {
        const t = estimateTokens(current[i] as string);
        if (overlapCount + t > overlapTokens) {
          break;
        }
        overlap.unshift(current[i] as string);
        overlapCount += t;
      }
      current = [...overlap];
      currentTokens = overlapCount;
    }
    current.push(block);
    currentTokens += blockTokens;
  }
  flush();

  return chunks;
}

/** Convenience: split text into blocks and chunk them in one step. */
export function chunkText(text: string, options: ChunkOptions = {}): string[] {
  return chunkBlocks(splitBlocks(text), options);
}
