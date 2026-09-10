-- Redirect manager: store the rules the editor is already being asked for.
--
-- The new-redirect form has always offered Expiry Date, Case Sensitivity, Slash Handling and Match
-- Pattern (including RegEx). None of them had anywhere to go: the API wrote five columns and the
-- table had no others, so every one of those choices was collected and dropped on the floor. A rule
-- saved as a RegEx pattern behaved as an exact match, and an expiry date never expired anything.
--
-- Defaults match what the form already defaults to, so every existing row keeps behaving exactly as
-- it does today.

ALTER TABLE cms_redirect
  ADD COLUMN IF NOT EXISTS expiry_date date,
  ADD COLUMN IF NOT EXISTS case_sensitivity text NOT NULL DEFAULT 'Ignore Case',
  ADD COLUMN IF NOT EXISTS slash_handling text NOT NULL DEFAULT 'Ignore Trailing Slash',
  ADD COLUMN IF NOT EXISTS pattern text NOT NULL DEFAULT 'Exact match';

-- Only the two values each field can hold, so a typo cannot quietly change how a rule matches.
ALTER TABLE cms_redirect DROP CONSTRAINT IF EXISTS cms_redirect_case_sensitivity_check;
ALTER TABLE cms_redirect ADD CONSTRAINT cms_redirect_case_sensitivity_check
  CHECK (case_sensitivity IN ('Ignore Case', 'Match Case'));

ALTER TABLE cms_redirect DROP CONSTRAINT IF EXISTS cms_redirect_slash_handling_check;
ALTER TABLE cms_redirect ADD CONSTRAINT cms_redirect_slash_handling_check
  CHECK (slash_handling IN ('Ignore Trailing Slash', 'Exact Match'));

ALTER TABLE cms_redirect DROP CONSTRAINT IF EXISTS cms_redirect_pattern_check;
ALTER TABLE cms_redirect ADD CONSTRAINT cms_redirect_pattern_check
  CHECK (pattern IN ('Exact match', 'Pattern match (RegEx)'));

ALTER TABLE cms_redirect DROP CONSTRAINT IF EXISTS cms_redirect_type_check;
ALTER TABLE cms_redirect ADD CONSTRAINT cms_redirect_type_check
  CHECK (type IN ('301', '302', '307', '410'));

-- hits has always existed and has never been written to. The counter is incremented as redirects are
-- served, so it starts from whatever is there now (0) and is a genuine count from this point on.
ALTER TABLE cms_redirect ALTER COLUMN hits SET DEFAULT 0;
UPDATE cms_redirect SET hits = 0 WHERE hits IS NULL;

-- Exact-match lookups happen on every page request that is not a static asset.
CREATE INDEX IF NOT EXISTS cms_redirect_active_idx ON cms_redirect (status) WHERE status = 'Active';
