-- Settings module: Company profile detail, notification preferences, and NRS e-invoicing readiness
-- (PRD 3, 15). E-invoicing is the one thing the PRD lets us build ahead of the rest (readiness, not a
-- live NRS submission engine - Section 17 keeps the actual submission call out of scope). So this adds
-- the config the screens need plus a place to record submission attempts and a buyer TIN directory,
-- without a live integration. Secrets are never stored here: only a boolean that credentials are set
-- (the actual keys live in the environment). Idempotent.

-- Extend the single company_settings row with the profile, fiscal, notification, and NRS config the
-- Settings tree needs. No BVN, ever (platform-wide rule).
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS rc_number           text;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS registration_number text;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS logo_url            text;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS fiscal_year_start_month integer NOT NULL DEFAULT 1 CHECK (fiscal_year_start_month BETWEEN 1 AND 12);
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS notify_email  boolean NOT NULL DEFAULT true;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS notify_sms    boolean NOT NULL DEFAULT false;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS notify_inapp  boolean NOT NULL DEFAULT true;
-- NRS non-secret config. The taxpayer TIN and service id identify us to the NRS; credentials_set says
-- the keys exist in the environment, without ever holding a secret in the database.
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS nrs_taxpayer_tin  text;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS nrs_service_id    text;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS nrs_credentials_set boolean NOT NULL DEFAULT false;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS nrs_last_test_at  timestamptz;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS nrs_last_test_ok  boolean;

-- One record per attempt to submit an invoice to the NRS (readiness shape; nothing calls out yet).
-- Mirrors the nullable IRN/status fields the invoice carries (PRD 15). Status walks Pending ->
-- Submitted -> Acknowledged, or Rejected/Failed with an error to retry.
CREATE TABLE IF NOT EXISTS nrs_submission (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id   uuid REFERENCES invoice(id) ON DELETE SET NULL,
  environment  text NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
  irn          text,
  status       text NOT NULL DEFAULT 'Pending'
                 CHECK (status IN ('Pending', 'Submitted', 'Acknowledged', 'Rejected', 'Failed')),
  error        text,
  submitted_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS nrs_submission_status_idx ON nrs_submission (status);
CREATE INDEX IF NOT EXISTS nrs_submission_invoice_idx ON nrs_submission (invoice_id);

-- Buyer TIN directory for validation (PRD 15 - TIN on the client). A buyer we bill; verified once its
-- TIN has been checked. No live NRS call yet, so verification is recorded, not performed.
CREATE TABLE IF NOT EXISTS nrs_buyer (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  tin           text,
  verified      boolean NOT NULL DEFAULT false,
  last_checked  timestamptz,
  created_by    uuid REFERENCES staff(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS nrs_buyer_name_idx ON nrs_buyer (lower(name));

-- A line per NRS integration event for the logs screen (auth, request, response, sync). Append-only.
CREATE TABLE IF NOT EXISTS nrs_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind        text NOT NULL CHECK (kind IN ('auth', 'request', 'response', 'sync')),
  summary     text NOT NULL,
  ok          boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS nrs_log_created_idx ON nrs_log (created_at DESC);
