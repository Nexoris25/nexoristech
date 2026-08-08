-- Cover / featured images carry alt text on the content row too (PRD Part Two: "cover image, with alt
-- text"). The asset's alt also lives in cms_media; this stores the per-article value the editor approved.
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS featured_image_alt text;
ALTER TABLE cms_author  ADD COLUMN IF NOT EXISTS headshot_alt       text;
