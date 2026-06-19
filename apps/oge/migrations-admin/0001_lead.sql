-- The canonical CRM lead store in nexoris_admin (PRD 11). Every lead from the three website
-- paths (the Contact form, Oge chat capture, the Solution Finder) lands here, scored on arrival
-- with its justification and full context. The admin CRM (Stage 9) builds assignment, lifecycle
-- stages, and the audit log around this table; the website's responsibility ends at delivering a
-- scored, fully contextual lead. gen_random_uuid is built in on PostgreSQL 13+. Idempotent.

CREATE TABLE IF NOT EXISTS lead (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source         text NOT NULL
                   CHECK (source IN ('contact-form', 'oge-chat', 'solution-finder',
                                     'whatsapp', 'email', 'referral')),
  page           text,
  utm            jsonb NOT NULL DEFAULT '{}'::jsonb,
  name           text,
  email          text,
  phone          text,
  company        text,
  message        text,
  finder         jsonb,
  score          integer,
  band           text CHECK (band IN ('Hot', 'Warm', 'Cold')),
  justification  text,
  scored_by      text CHECK (scored_by IN ('ai', 'rules')),
  -- The lifecycle stage (PRD 1262). New on arrival; the CRM moves it onward in Stage 9.
  status         text NOT NULL DEFAULT 'New',
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lead_created_at_idx ON lead (created_at DESC);
CREATE INDEX IF NOT EXISTS lead_band_idx ON lead (band);
CREATE INDEX IF NOT EXISTS lead_status_idx ON lead (status);
