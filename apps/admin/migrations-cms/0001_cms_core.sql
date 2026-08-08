-- The Nexoris Technologies custom CMS core content model, in the nexoris_cms database (separate from
-- nexoris_admin). This is the initial schema the Dashboard Overview reads from; every figure on that
-- screen is a live query against these tables, so the numbers update as content is created, reviewed,
-- and published. Content types and workflow states follow the CMS design. Built for the GEO/SEO
-- mandate: content carries a slug and publish state so pages are crawlable and answer-friendly.

CREATE TABLE IF NOT EXISTS cms_author (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  role       text NOT NULL DEFAULT 'Editor',
  active     boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cms_content (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind           text NOT NULL CHECK (kind IN ('insight','generated_page','case_study','testimonial','job','application','legal_page')),
  title          text NOT NULL,
  slug           text,
  status         text NOT NULL DEFAULT 'draft' CHECK (status IN ('published','in_review','draft','scheduled','archived')),
  workflow_state text CHECK (workflow_state IN ('pending_review','ai_review','editorial_review','legal_review','scheduled','ready_to_publish')),
  views          integer NOT NULL DEFAULT 0,
  delta_pct      numeric(6,1) NOT NULL DEFAULT 0,
  author_id      uuid REFERENCES cms_author(id),
  published_at   timestamptz,
  scheduled_at   timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cms_content_kind_idx ON cms_content (kind);
CREATE INDEX IF NOT EXISTS cms_content_status_idx ON cms_content (status);
CREATE INDEX IF NOT EXISTS cms_content_workflow_idx ON cms_content (workflow_state);

CREATE TABLE IF NOT EXISTS cms_media (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  kind       text NOT NULL DEFAULT 'image',
  size_bytes bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cms_activity (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_name text,
  action     text NOT NULL,
  subject    text,
  category   text,   -- Insights, Programmatic SEO, Careers, AI Workspace, Proof Library
  status     text,   -- Published, In Review, Completed, New
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cms_activity_created_idx ON cms_activity (created_at DESC);

-- One row per day of search + traffic metrics (Google Search Console mirror + on-site page views).
CREATE TABLE IF NOT EXISTS cms_metric_daily (
  day          date PRIMARY KEY,
  clicks       integer NOT NULL DEFAULT 0,
  impressions  integer NOT NULL DEFAULT 0,
  page_views   integer NOT NULL DEFAULT 0,
  avg_position numeric(6,1) NOT NULL DEFAULT 0
);
