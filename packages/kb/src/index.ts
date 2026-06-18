/**
 * @nexoris/kb
 *
 * The knowledge-base builder and ingestion pipeline shared by the web build and the Oge AI
 * gateway. This package owns the source model and the deterministic, block-aware chunking
 * (PRD 10.3), which need no secrets. Embedding, pgvector storage, and re-ingestion webhooks
 * live in apps/oge, which holds the provider keys.
 */

export const KB_PACKAGE = "@nexoris/kb" as const;

export * from "./types.js";
export * from "./chunk.js";
export * from "./build.js";
