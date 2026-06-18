/**
 * Knowledge-base types for the Nexoris Technologies platform (PRD 10.3).
 *
 * The knowledge base is built from the hardcoded marketing content modules at web build time
 * and from published CMS content on each publish webhook. Each chunk carries its source URL
 * so the Oge assistant can name and link the page an answer comes from. Embedding and
 * pgvector storage happen in apps/oge (which holds the provider keys); this package owns only
 * the source model and the deterministic chunking, both of which need no secrets.
 */

/** A source document to be chunked into the knowledge base: one page or article. */
export interface KbSource {
  /** The canonical URL of the page this content comes from. */
  url: string;
  /** The page title, kept on every chunk for citation. */
  title: string;
  /**
   * The readable text of the page, with blocks separated by blank lines. Each block (a
   * paragraph, or a complete FAQ question-and-answer pair) is treated as atomic, so an FAQ
   * pair or an answer block is never split across chunks.
   */
  text: string;
}

/** A single chunk of the knowledge base, ready to embed and index. */
export interface KbChunk {
  /** Stable id: the source URL plus the chunk index, for example "https://.../about/#2". */
  id: string;
  /** The source URL this chunk came from. */
  url: string;
  /** The source page title. */
  title: string;
  /** The chunk text. */
  text: string;
  /** The zero-based index of this chunk within its source. */
  index: number;
}

/** Chunking options. Defaults follow PRD 10.3: about 800 tokens with 100 token overlap. */
export interface ChunkOptions {
  maxTokens?: number;
  overlapTokens?: number;
}
