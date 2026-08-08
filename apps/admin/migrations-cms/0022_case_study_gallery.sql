-- Case studies gain a gallery and an explicit link to the services they prove.
--
-- A case study is not only a page of its own. It is also the proof section on a service page — the part
-- that shows what has actually been built — and it needs two things it did not have:
--
--   * More than one image. One featured image is a card thumbnail; a project needs a set of screens to
--     show what was made. `featured_image` stays as the cover, and `gallery` holds the rest, so nothing
--     that already points at the cover has to change.
--
--   * A machine-readable list of the service pages it belongs on. `service_industry` was free text
--     ("e.g. Fintech"), which cannot be matched to a page. `service_paths` holds real paths, so a
--     service page can ask for exactly the work that proves it rather than showing placeholder cards.

ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS gallery jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS service_paths text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN cms_content.gallery IS
  'Case study images beyond the cover: [{ "url": "/uploads/x.webp", "alt": "..." }]. The cover stays in featured_image.';
COMMENT ON COLUMN cms_content.service_paths IS
  'Service page paths this case study is proof for, e.g. {/ai-product-development}. Drives the proof section on those pages.';

-- Looking up "which case studies prove this service" happens on every service page render.
CREATE INDEX IF NOT EXISTS cms_content_service_paths_idx ON cms_content USING gin (service_paths);
