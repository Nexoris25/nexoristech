-- Stage-driven follow-ups (PRD 5.9, 11.2). When a lead advances, the CRM generates a follow-up
-- email tailored to the new stage and a recommended send-by date. If no activity is logged by that
-- date, the Action Center surfaces it. One current suggestion per lead; regenerating replaces it.
-- Idempotent.

ALTER TABLE lead ADD COLUMN IF NOT EXISTS followup_stage    text;
ALTER TABLE lead ADD COLUMN IF NOT EXISTS followup_draft    text;
ALTER TABLE lead ADD COLUMN IF NOT EXISTS followup_drafted_by text
  CHECK (followup_drafted_by IN ('ai', 'template'));
ALTER TABLE lead ADD COLUMN IF NOT EXISTS followup_due      date;
ALTER TABLE lead ADD COLUMN IF NOT EXISTS followup_sent_at  timestamptz;
ALTER TABLE lead ADD COLUMN IF NOT EXISTS last_contacted_at timestamptz;

CREATE INDEX IF NOT EXISTS lead_followup_due_idx ON lead (followup_due)
  WHERE followup_due IS NOT NULL AND followup_sent_at IS NULL;
