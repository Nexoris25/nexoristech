/**
 * Deterministic, block-aware chunking for the knowledge base (PRD 10.3).
 *
 * Text is split into blocks on blank lines, and blocks are packed greedily into chunks of about
 * 250 tokens with about 50 tokens of overlap between neighbours. A block is never split, so a
 * paragraph, an FAQ question-and-answer pair, or an answer block always stays whole; a single
 * oversized block becomes its own chunk rather than being cut. No model calls are made: token
 * counts are estimated from the word count, which is enough to size chunks consistently.
 */
import type { ChunkOptions } from "./types.js";

/*
 * 250, not 800, and the difference is measurable.
 *
 * At 800 nearly every page became a single chunk, so a page was retrievable only as a whole. A fact
 * stated once inside a long page is a small fraction of that chunk's text, and both retrievers judge
 * the chunk rather than the fact: the office address sat in a 527-token contact chunk and questions
 * about visiting the office ranked service pages that mention back-office work above it, while the
 * page holding the address did not appear at all.
 *
 * Measured on a fourteen-question set naming the page that can actually answer each one. At 800 the
 * right page was retrieved for 10; at 250 it is 13, and the three questions that had been failing
 * outright, the two about visiting the office and the one about hospital software, all pass. Nothing
 * that passed before regressed, which was the risk worth checking: smaller chunks could plausibly
 * have hurt the broad questions like "what does Nexoris Technologies do", and did not.
 *
 * Blocks are still never split, so a paragraph or an FAQ pair stays whole either way. The overlap
 * comes down with the size to keep the proportion sane; 100 tokens of overlap on a 250-token chunk
 * would repeat 40 per cent of the corpus.
 */
const DEFAULT_MAX_TOKENS = 250;
const DEFAULT_OVERLAP_TOKENS = 50;

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
