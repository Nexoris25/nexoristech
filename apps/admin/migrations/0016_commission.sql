-- Commission engine (PRD Part Three: commission-based sales reps). A commissioned employee has a rate
-- between 3% and 20% and a basis that says what the rate is applied to: their salary, or the value of the
-- deals they close. Commission-only reps are the reason this exists: they may have little or no salary.
ALTER TABLE employee ADD COLUMN IF NOT EXISTS commission_rate numeric(5,2);
ALTER TABLE employee ADD COLUMN IF NOT EXISTS commission_basis text;

ALTER TABLE employee DROP CONSTRAINT IF EXISTS employee_commission_rate_check;
ALTER TABLE employee ADD CONSTRAINT employee_commission_rate_check
  CHECK (commission_rate IS NULL OR (commission_rate >= 3 AND commission_rate <= 20));

ALTER TABLE employee DROP CONSTRAINT IF EXISTS employee_commission_basis_check;
ALTER TABLE employee ADD CONSTRAINT employee_commission_basis_check
  CHECK (commission_basis IS NULL OR commission_basis IN ('salary', 'closed_deal'));
