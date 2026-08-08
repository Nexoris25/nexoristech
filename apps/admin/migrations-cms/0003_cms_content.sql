-- Content-model detail for the CMS screens (Categories, Authors, the Insight editor). Categories are
-- their own table; authors and insights gain the fields their editors capture. Content counts and
-- author stats are derived from live data so the lists stay accurate.

CREATE TABLE IF NOT EXISTS cms_category (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text NOT NULL,
  description text,
  parent_id   uuid REFERENCES cms_category(id),
  active      boolean NOT NULL DEFAULT true,
  created_by  text,
  updated_by  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS cms_category_slug_idx ON cms_category (lower(slug));

-- Insight/content editor fields.
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS category_id       uuid REFERENCES cms_category(id);
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS body              text;
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS excerpt           text;
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS meta_title        text;
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS meta_description  text;
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS focus_keyword     text;
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS featured_image    text;
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS seo_score         integer;
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS read_time_min     integer NOT NULL DEFAULT 5;

-- Author profile fields.
ALTER TABLE cms_author ADD COLUMN IF NOT EXISTS email            text;
ALTER TABLE cms_author ADD COLUMN IF NOT EXISTS display_name     text;
ALTER TABLE cms_author ADD COLUMN IF NOT EXISTS job_title        text;
ALTER TABLE cms_author ADD COLUMN IF NOT EXISTS department       text;
ALTER TABLE cms_author ADD COLUMN IF NOT EXISTS years_experience text;
ALTER TABLE cms_author ADD COLUMN IF NOT EXISTS location         text;
ALTER TABLE cms_author ADD COLUMN IF NOT EXISTS expertise        text[] NOT NULL DEFAULT '{}';
ALTER TABLE cms_author ADD COLUMN IF NOT EXISTS bio              text;
ALTER TABLE cms_author ADD COLUMN IF NOT EXISTS headshot_url     text;
ALTER TABLE cms_author ADD COLUMN IF NOT EXISTS show_on_website  boolean NOT NULL DEFAULT true;
ALTER TABLE cms_author ADD COLUMN IF NOT EXISTS featured         boolean NOT NULL DEFAULT false;
ALTER TABLE cms_author ADD COLUMN IF NOT EXISTS is_default       boolean NOT NULL DEFAULT false;
ALTER TABLE cms_author ADD COLUMN IF NOT EXISTS score            integer NOT NULL DEFAULT 85;
ALTER TABLE cms_author ADD COLUMN IF NOT EXISTS last_active_at   timestamptz NOT NULL DEFAULT now();
