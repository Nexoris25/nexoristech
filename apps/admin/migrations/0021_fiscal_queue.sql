-- Durable submission attempts and the queue that drives them.
--
-- Two separate concerns, deliberately kept apart:
--
--   fiscal_submission      evidence. One row per attempt, append-only, never updated. This is what you
--                          show a tax authority when asked "when did you send this, and what came back".
--   fiscal_submission_job  intent. One row per document awaiting submission, mutable, with backoff.
--
-- Collapsing them would mean a retry overwrote the record of the attempt before it, which is exactly the
-- history that matters when a document's status is disputed.

CREATE TABLE IF NOT EXISTS fiscal_submission (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  einvoice_id     uuid NOT NULL REFERENCES einvoice(id) ON DELETE CASCADE,
  attempt_number  integer NOT NULL,
  -- Which provider was spoken to, so a change of SI/APP stays traceable. Never a credential.
  provider        text NOT NULL,
  environment     text NOT NULL,
  -- A digest of what was sent, not the payload itself: enough to prove the document was unchanged
  -- between attempts without duplicating customer data into a second place.
  request_digest  text NOT NULL,
  -- accepted | rejected | unavailable. 'unavailable' is a transport failure, NOT a tax outcome.
  outcome         text NOT NULL,
  irn             text,
  provider_ref    text,
  -- Response as received. Never contains a credential; adapters must not echo one back.
  raw_response    text,
  messages        jsonb NOT NULL DEFAULT '[]'::jsonb,
  duration_ms     integer,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fiscal_submission_outcome_check CHECK (outcome IN ('accepted','rejected','unavailable'))
);
CREATE INDEX IF NOT EXISTS fiscal_submission_doc_idx ON fiscal_submission (einvoice_id, created_at DESC);

CREATE TABLE IF NOT EXISTS fiscal_submission_job (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  einvoice_id     uuid NOT NULL REFERENCES einvoice(id) ON DELETE CASCADE,
  -- queued -> running -> done | failed. 'failed' is terminal and needs a human.
  status          text NOT NULL DEFAULT 'queued',
  attempts        integer NOT NULL DEFAULT 0,
  max_attempts    integer NOT NULL DEFAULT 5,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  last_error      text,
  requested_by    uuid REFERENCES staff(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fiscal_job_status_check CHECK (status IN ('queued','running','done','failed'))
);

-- A document may sit in the queue only once at a time. Without this, an impatient operator clicking
-- submit twice would have the same invoice transmitted twice and fiscalised twice.
CREATE UNIQUE INDEX IF NOT EXISTS fiscal_job_one_active_idx
  ON fiscal_submission_job (einvoice_id) WHERE status IN ('queued','running');

CREATE INDEX IF NOT EXISTS fiscal_job_due_idx ON fiscal_submission_job (status, next_attempt_at);
