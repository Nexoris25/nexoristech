-- Oge gateway schema for nexoris_oge (PRD 10.3 grounding store and 10.4 caches).
-- pgvector 0.8.2 is already installed on the server (DECISIONS D-013); this migration assumes
-- the extension exists and creates it defensively. Every embedding column is 1024 dimensions to
-- match EMBEDDING_MODELS.dimensions (Mistral Embed, with the Gemini fallback called at 1024),
-- so one index serves the whole store. All statements are idempotent.

CREATE EXTENSION IF NOT EXISTS vector;

-- The canonical knowledge base. One row per chunk, each carrying its source URL and title so
-- the assistant can name and link the page an answer comes from. Chunks are inserted at
-- ingestion; the embedding is filled in once, then reused.
CREATE TABLE IF NOT EXISTS kb_chunk (
  id           text PRIMARY KEY,                 -- e.g. https://nexoristech.com/about/#3
  url          text NOT NULL,
  title        text NOT NULL,
  content      text NOT NULL,
  token_count  integer NOT NULL,
  kb_version   text NOT NULL,
  source_type  text NOT NULL
                 CHECK (source_type IN ('hardcoded', 'catalogue', 'insight', 'legal', 'pseo')),
  embedding    vector(1024),                     -- null until embedded
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kb_chunk_url_idx ON kb_chunk (url);
CREATE INDEX IF NOT EXISTS kb_chunk_kb_version_idx ON kb_chunk (kb_version);

-- Cosine similarity over the chunk embeddings, the vector half of hybrid retrieval (PRD 10.4).
CREATE INDEX IF NOT EXISTS kb_chunk_embedding_idx
  ON kb_chunk USING hnsw (embedding vector_cosine_ops);

-- Exact-match cache (PRD 10.4): common questions answered with zero model calls. Keyed by a
-- normalised query hash plus the knowledge-base version, so a re-ingest invalidates cleanly.
CREATE TABLE IF NOT EXISTS exact_match_cache (
  query_hash        text PRIMARY KEY,
  normalised_query  text NOT NULL,
  kb_version        text NOT NULL,
  answer            text NOT NULL,
  sources           jsonb NOT NULL DEFAULT '[]'::jsonb,
  hits              integer NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  last_hit_at       timestamptz
);

-- Semantic cache (PRD 10.4): before any generation the prompt is embedded and compared to
-- recent prompt embeddings; a close cosine match returns the cached answer, catching paraphrases.
CREATE TABLE IF NOT EXISTS semantic_cache (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  prompt_embedding  vector(1024) NOT NULL,
  normalised_query  text NOT NULL,
  answer            text NOT NULL,
  sources           jsonb NOT NULL DEFAULT '[]'::jsonb,
  kb_version        text NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS semantic_cache_embedding_idx
  ON semantic_cache USING hnsw (prompt_embedding vector_cosine_ops);

-- Gap report (PRD 10.4): questions Oge could not answer well, used to pre-warm and grow the
-- exact-match cache and to find missing knowledge-base coverage.
CREATE TABLE IF NOT EXISTS gap_report (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  query             text NOT NULL,
  normalised_query  text NOT NULL,
  reason            text NOT NULL
                      CHECK (reason IN ('empty-retrieval', 'low-confidence', 'fallback')),
  occurred_at       timestamptz NOT NULL DEFAULT now(),
  resolved          boolean NOT NULL DEFAULT false
);
