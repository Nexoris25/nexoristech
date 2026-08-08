-- Insights carry an author AND a fact-checker, each with a per-article AI-generated bio (PRD Part Two
-- §2.1), plus an AI-drafted FAQ set stored for the FAQPage schema the public page emits.
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS fact_checker_id  uuid REFERENCES cms_author(id);
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS author_bio       text;
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS fact_checker_bio text;
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS faqs             jsonb NOT NULL DEFAULT '[]';
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS tldr             jsonb NOT NULL DEFAULT '[]';
