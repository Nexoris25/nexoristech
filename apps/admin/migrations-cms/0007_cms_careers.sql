-- Careers module. Jobs and applications already exist in cms_content (kind='job' / 'application'); this
-- adds the fields those screens need plus a departments table. AI fields (fit score, confidence,
-- verification) are stored values that Oge writes when it analyses an application — surfaced as data, not
-- faked live. Reuses: title = job title / candidate name, body = about the role / cover note, excerpt =
-- short summary, created_at = applied date.

CREATE TABLE IF NOT EXISTS cms_department (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  slug          text,
  description   text,
  display_order integer NOT NULL DEFAULT 0,
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS department          text;
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS employment_type     text;   -- Full-time, Contract, ...
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS work_mode           text;   -- Remote, Hybrid, On-site
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS job_location        text;
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS salary_min          bigint;
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS salary_max          bigint;
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS application_deadline date;
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS ai_fit_score        smallint;   -- applications (0-100)
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS ai_confidence       text;       -- Low / Medium / High
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS verification_status text;       -- Verified / Warning / Needs Review
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS applicant_email     text;
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS applied_job         text;       -- job title the candidate applied to
ALTER TABLE cms_content ADD COLUMN IF NOT EXISTS application_stage   text;       -- new / reviewed / interviewed / rejected

-- Departments seed (matches the design list). Idempotent: only seed when the table is empty.

-- The starter department list that used to be inserted here has been removed, for the same reason the
-- starter categories were: the owner names their own departments, and a list somebody else chose is
-- something to delete before it is something to use.
