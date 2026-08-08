-- Media Library: give cms_media the fields a real asset library needs — a URL, alt text (for
-- accessibility + image SEO), mime type, dimensions, a folder, and who uploaded it. Existing seeded
-- rows get sensible values so the grid renders immediately.

ALTER TABLE cms_media ADD COLUMN IF NOT EXISTS url         text;
ALTER TABLE cms_media ADD COLUMN IF NOT EXISTS alt_text    text;
ALTER TABLE cms_media ADD COLUMN IF NOT EXISTS mime_type   text;
ALTER TABLE cms_media ADD COLUMN IF NOT EXISTS width       integer;
ALTER TABLE cms_media ADD COLUMN IF NOT EXISTS height      integer;
ALTER TABLE cms_media ADD COLUMN IF NOT EXISTS folder      text NOT NULL DEFAULT 'Uploads';
ALTER TABLE cms_media ADD COLUMN IF NOT EXISTS uploaded_by text;

-- Backfill mime types and dimensions from the existing kind, and give each asset a folder.
UPDATE cms_media SET
  mime_type = CASE kind
    WHEN 'image' THEN 'image/webp'
    WHEN 'video' THEN 'video/mp4'
    WHEN 'document' THEN 'application/pdf'
    ELSE 'application/octet-stream' END,
  width  = CASE WHEN kind = 'image' THEN 1600 ELSE width END,
  height = CASE WHEN kind = 'image' THEN 900 ELSE height END,
  folder = CASE (abs(hashtext(id::text)) % 5)
    WHEN 0 THEN 'Insights'
    WHEN 1 THEN 'Case Studies'
    WHEN 2 THEN 'Team'
    WHEN 3 THEN 'Brand'
    ELSE 'Uploads' END,
  alt_text = COALESCE(alt_text, name)
WHERE mime_type IS NULL;
