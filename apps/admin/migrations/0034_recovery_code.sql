-- Recovery codes: self-service password reset with no mail provider.
--
-- Resetting a password safely means proving you control something other than the password. Normally
-- that is a mailbox, and with no provider configured there is nothing to prove control of, so the
-- reset loop has to run through an administrator: the person asks, the admin creates a link, the
-- admin passes it on. That works and it is honest, but it needs somebody else to be awake, and it
-- puts the admin in the position of deciding whether the voice on the phone is who it claims to be.
--
-- A recovery code is the other half. It is issued to the person when they set their password, it
-- proves they are the same person, and it takes nobody else's time.
--
-- What is stored is a SHA-256 of the code and never the code itself. SHA-256 rather than bcrypt is
-- deliberate and is only defensible because of how the codes are generated: 100 bits of randomness
-- from the system CSPRNG, which is far beyond guessing or precomputation. Bcrypt exists to slow down
-- attacks on passwords, which are low-entropy because people choose them. Nobody chooses these. The
-- flat hash also means a submitted code is a single indexed lookup rather than a scan and a bcrypt
-- comparison against every unused code on the account.
--
-- One row per code rather than an array on staff, so using one is an UPDATE of that row, the count
-- remaining is a COUNT, and regenerating is a DELETE followed by an INSERT, all without rewriting a
-- column that other sessions may be reading.

CREATE TABLE IF NOT EXISTS recovery_code (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id   uuid        NOT NULL REFERENCES staff (id) ON DELETE CASCADE,
  -- Hex SHA-256 of the normalised code. Unique across the table: two accounts colliding is not
  -- credible at this entropy, and the constraint means a lookup cannot match more than one row.
  code_hash  text        NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  used_at    timestamptz
);

-- The lookup the reset path makes: this exact hash, not yet spent.
CREATE INDEX IF NOT EXISTS recovery_code_unused_idx
  ON recovery_code (code_hash) WHERE used_at IS NULL;

-- Counting what a person has left, on their account page.
CREATE INDEX IF NOT EXISTS recovery_code_staff_idx ON recovery_code (staff_id);

COMMENT ON TABLE recovery_code IS
  'Single-use codes that let a person reset their own password without a mail provider. Only the
   SHA-256 of each code is stored; the codes themselves are shown once, when generated, and cannot be
   recovered afterwards by anyone including an administrator.';
COMMENT ON COLUMN recovery_code.used_at IS
  'When this code was spent. Rows are kept rather than deleted so that "you have already used this
   code" can be told apart from "this code was never yours", which matters when helping somebody.';
