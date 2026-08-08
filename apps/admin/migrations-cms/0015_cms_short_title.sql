-- A short, human-readable label derived from the title, used in breadcrumbs and content lists so long
-- titles never crowd the UI. Editable per item; auto-filled from the title in the editor.
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS short_title text;
