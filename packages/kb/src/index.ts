/**
 * @nexoris/kb
 *
 * The knowledge-base builder and ingestion pipeline. Built in Stage 6. Produces one
 * canonical knowledge base from the hardcoded marketing content modules (at web build
 * time) plus published CMS Insights, legal, and programmatic content (on each publish
 * webhook). Content is chunked at about 800 tokens with 100 token overlap, never splitting an
 * FAQ pair or an answer block, embedded once, and stored in pgvector. Each chunk carries
 * its source URL so both Oge tiers can name and link the page an answer comes from.
 */

export const KB_PACKAGE = "@nexoris/kb" as const;
