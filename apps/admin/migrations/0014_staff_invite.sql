-- Invitation tokens for the user-invite flow. A pending invite stores a one-time token and its expiry;
-- accepting the invite (setting a password) clears both and activates the account.
ALTER TABLE staff ADD COLUMN IF NOT EXISTS invite_token text;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS invite_expires timestamptz;
CREATE INDEX IF NOT EXISTS staff_invite_token_idx ON staff (invite_token);
