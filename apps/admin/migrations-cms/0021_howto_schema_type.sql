-- Allow HowTo as a schema type for an insight.
--
-- HowTo is not an Article subtype, which is why it is absent from ARTICLE_TYPES in packages/seo: it
-- carries a required list of steps that an Article node has no place for. The website emits a separate
-- HowTo node for a page marked this way, built from the article's own H2 sections.
--
-- The constraint is widened rather than dropped, so an unrecognised value still cannot be stored.

ALTER TABLE cms_content DROP CONSTRAINT IF EXISTS cms_content_schema_type_check;

ALTER TABLE cms_content ADD CONSTRAINT cms_content_schema_type_check
  CHECK (schema_type IS NULL OR schema_type = ANY (ARRAY[
    'Article', 'BlogPosting', 'NewsArticle', 'TechArticle', 'ScholarlyArticle', 'Report', 'HowTo'
  ]));
