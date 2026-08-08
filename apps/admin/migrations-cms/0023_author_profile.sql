-- An author gets a real page, not just a line under an article.
--
-- `bio` is a short paragraph: the right length for the byline block on an article and far too short to
-- be a page anyone would rank or trust. E-E-A-T is judged on the author as much as the article, and an
-- author page that says three sentences and nothing else is the weakest page on the site.
--
--   * `profile_html` holds the written page — the same rich text the rest of the CMS produces — so an
--     author can set out their background, their work and their credentials at length.
--   * `meta_title` / `meta_description` let that page be optimised like any other, through the same Oge
--     SEO panel. Until now the author page borrowed the short bio as its description.
--   * `linkedin_url` and `x_url` are the social handles. The website already had markup for a LinkedIn
--     link on the profile and it never rendered, because nothing stored or selected the value.
--
-- Nothing here is required. An author with only a short bio keeps working exactly as before.

ALTER TABLE cms_author ADD COLUMN IF NOT EXISTS profile_html     text;
ALTER TABLE cms_author ADD COLUMN IF NOT EXISTS meta_title       text;
ALTER TABLE cms_author ADD COLUMN IF NOT EXISTS meta_description text;
ALTER TABLE cms_author ADD COLUMN IF NOT EXISTS linkedin_url     text;
ALTER TABLE cms_author ADD COLUMN IF NOT EXISTS x_url            text;

COMMENT ON COLUMN cms_author.profile_html IS
  'The author page body, as sanitised HTML from the CMS editor. The short bio stays in bio and is what appears under an article.';
COMMENT ON COLUMN cms_author.linkedin_url IS 'Full LinkedIn profile URL. Rendered on the author page and used as schema.org sameAs.';
COMMENT ON COLUMN cms_author.x_url IS 'Full X profile URL. Rendered on the author page and used as schema.org sameAs.';
