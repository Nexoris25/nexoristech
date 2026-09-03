-- Real view counts, and share counts beside them.
--
-- `views` has been read on the authors list, the author detail and the insights list since those
-- screens were built, and nothing has ever incremented it: no route, no page, nowhere. Whatever is
-- in the column is left over from seeding, so every "total views" figure in the CMS has been a
-- number with nothing behind it. The website records a view now, which is what makes the column
-- mean what the screens have been claiming.
--
-- Shares are the same shape of fact and belong beside it: a piece that is read and never shared and
-- a piece that is read and passed on are different pieces, and only one of them is working.
--
-- Counted per channel as well as in total, because "shared 40 times" and "shared 40 times, all of
-- them on LinkedIn" lead to different decisions about where the next piece goes.
ALTER TABLE cms_content
  ADD COLUMN IF NOT EXISTS share_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shares_by_channel jsonb NOT NULL DEFAULT '{}'::jsonb;

-- The existing values are not view counts and never were. Zeroing them is the honest start: a
-- figure carried forward from seed data would be indistinguishable from one that was earned.
UPDATE cms_content SET views = 0 WHERE views IS NOT NULL AND views > 0;

CREATE INDEX IF NOT EXISTS cms_content_views_idx ON cms_content (views DESC) WHERE kind = 'insight';
