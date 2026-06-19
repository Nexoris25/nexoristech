-- Allow knowledge-base chunks from any source type, so published CMS content (insight,
-- case-study, legal, and later pseo) can be ingested alongside the hardcoded and catalogue
-- sources. The source type stays a plain text column, validated by the application.
ALTER TABLE kb_chunk DROP CONSTRAINT IF EXISTS kb_chunk_source_type_check;
