-- Real password resets: a one-time token on the staff row.
--
-- Forgot-password previously recorded a request in password_reset_request for an admin to action by
-- hand. That is not a reset flow, and it deadlocks the moment the only admin is the person locked out.
--
-- The token mirrors the invitation one: a signed value whose authoritative copy lives here, so it can
-- be invalidated the instant it is used. The signature carries its own expiry; this column is what
-- makes it single-use, and what lets an admin see that a reset is outstanding.
--
-- The expiry is deliberately short. An invitation is expected to sit in an inbox for days; a password
-- reset is acted on in minutes, and a long window is a long window for a forwarded email.

ALTER TABLE staff ADD COLUMN IF NOT EXISTS reset_token   text;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS reset_expires timestamptz;

COMMENT ON COLUMN staff.reset_token IS
  'One-time password-reset token. Cleared on use. NULL means no reset is outstanding.';
COMMENT ON COLUMN staff.reset_expires IS
  'When the outstanding reset token stops being accepted. The signed token carries the same deadline.';

-- Looking a token up is the first thing the reset page does, on an unauthenticated request.
CREATE INDEX IF NOT EXISTS staff_reset_token_idx ON staff (reset_token) WHERE reset_token IS NOT NULL;

-- The old request queue stays: it still records that someone asked, which is useful for spotting a
-- locked-out user or an account being probed. It is no longer the mechanism.
COMMENT ON TABLE password_reset_request IS
  'A log of who asked for a reset and when. The reset itself now runs on staff.reset_token; this table
   is kept for visibility, not as the mechanism.';
