-- Per-article schema.org type. The editor chooses which Article variant best describes the piece
-- (BlogPosting, NewsArticle, TechArticle, ScholarlyArticle, Report), defaulting to Article.
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS schema_type text;

ALTER TABLE cms_content DROP CONSTRAINT IF EXISTS cms_content_schema_type_check;
ALTER TABLE cms_content ADD CONSTRAINT cms_content_schema_type_check
  CHECK (schema_type IS NULL OR schema_type IN
    ('Article','BlogPosting','NewsArticle','TechArticle','ScholarlyArticle','Report'));

-- Existing insights read as editorial posts.
UPDATE cms_content SET schema_type = 'BlogPosting' WHERE kind = 'insight' AND schema_type IS NULL;
