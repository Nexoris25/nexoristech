-- Forgot-password support for the sign-in page. No mail service is wired in this phase, so a
-- request is recorded here and surfaced to an Admin, who resets the password from the People
-- screen; the reset itself writes to the shared audit log. Idempotent.

CREATE TABLE IF NOT EXISTS password_reset_request (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email        text NOT NULL,
  staff_id     uuid REFERENCES staff(id),
  status       text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  resolved_at  timestamptz,
  resolved_by  uuid REFERENCES staff(id)
);

CREATE INDEX IF NOT EXISTS password_reset_request_status_idx
  ON password_reset_request (status, requested_at DESC);
