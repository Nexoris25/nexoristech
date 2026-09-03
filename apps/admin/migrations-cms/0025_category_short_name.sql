-- A short label for a category.
--
-- The Insights hub filters by category, and a filter bar is read at a glance: a reader scans it for
-- the one word that matches what they want. The full names are written to be unambiguous in a CMS
-- listing - "Digital Transformation & Industry Technology", "Search, Content & Digital Visibility" -
-- and at that length a row of them either scrolls sideways off a phone or wraps into a paragraph.
--
-- Deriving one from the full name was the alternative and it guesses wrong: there is no rule that
-- turns "Search, Content & Digital Visibility" into the right two words. So it is a field, editable
-- beside the name, seeded with a sensible default that whoever owns the taxonomy can correct.
ALTER TABLE cms_category
  ADD COLUMN IF NOT EXISTS short_name text;

-- Seed: the part before the first comma or ampersand, which is the head of every one of these
-- names, trimmed. Only where nothing has been set, so a later edit is never overwritten.
UPDATE cms_category
   SET short_name = NULLIF(BTRIM(SPLIT_PART(SPLIT_PART(name, ',', 1), '&', 1)), '')
 WHERE short_name IS NULL OR BTRIM(short_name) = '';
