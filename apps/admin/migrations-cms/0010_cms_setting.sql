-- Simple scoped settings store for the CMS (e.g. Careers module settings). One JSON blob per scope.
CREATE TABLE IF NOT EXISTS cms_setting (
  scope       text PRIMARY KEY,
  data        jsonb NOT NULL DEFAULT '{}',
  updated_by  text,
  updated_at  timestamptz NOT NULL DEFAULT now()
);
