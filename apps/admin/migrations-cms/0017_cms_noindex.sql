-- Page-level indexing control. Each content item decides its own robots directive: noindex=false (the
-- default) means the page is indexable and appears in the sitemap; noindex=true emits a noindex robots
-- meta tag on the public page and is excluded from the sitemap. Managed per page in the editor's SEO area.
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS noindex boolean NOT NULL DEFAULT false;
