-- Failed sign-in attempts, so the configured lockout can actually be applied.
--
-- Global Settings offered "Lock account after 5 failed attempts" and nothing counted attempts, so the
-- setting protected nothing: an email could be tried without limit.
--
-- Rows are keyed by email rather than staff id, because a sign-in attempt against an address that does
-- not exist must be treated the same as one against an address that does. Answering differently is how
-- a login form tells an attacker which of your staff addresses are real.

CREATE TABLE IF NOT EXISTS login_attempt (
  id         bigserial PRIMARY KEY,
  email      text NOT NULL,
  ip         inet,
  at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS login_attempt_email_at_idx ON login_attempt (email, at DESC);
