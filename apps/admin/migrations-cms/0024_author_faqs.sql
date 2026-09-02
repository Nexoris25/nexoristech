-- FAQs on an author profile.
--
-- The author editor already offers the FAQs tab of the Oge assistant, and generating a set already
-- worked. Nothing then stored them: the editor never passed `storeFaqs`, so the answer appeared on
-- screen, was never written, and vanished on save. An article has had a `faqs` column since it was
-- built; an author page had nowhere to put one.
--
-- Same shape as cms_content.faqs, so the website renders both through the same FAQPage schema
-- rather than growing a second representation of the same idea.
ALTER TABLE cms_author
  ADD COLUMN IF NOT EXISTS faqs jsonb NOT NULL DEFAULT '[]'::jsonb;
