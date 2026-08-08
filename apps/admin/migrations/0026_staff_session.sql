-- Server-side session records, so a signed-in device can be listed and signed out.
--
-- Sessions were stateless: an HMAC-signed cookie, valid until its own expiry, with no record anywhere.
-- That made the Active Sessions screen impossible to build honestly (it showed three invented devices)
-- and, more seriously, made a stolen cookie unrevocable until it expired on its own.
--
-- The cookie still carries the signature; this table carries the identity of the session, so a session
-- can be ended from the account that owns it.

CREATE TABLE IF NOT EXISTS staff_session (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id     uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL,
  -- Truncated to the browser and platform. The full user-agent string is a fingerprint we have no
  -- reason to keep.
  device       text,
  -- Kept so a person can recognise a session they did not start. Not used for anything else.
  ip           inet,
  revoked_at   timestamptz,
  revoked_by   uuid REFERENCES staff(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS staff_session_staff_idx ON staff_session (staff_id, revoked_at, expires_at);
