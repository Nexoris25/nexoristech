-- Payroll moves to a single gross figure plus per-employee deduction applicability (PRD 8).
-- HR enters gross; PAYE, pension and NHF are ticked as they apply. NSITF and ITF are employer costs
-- and are never per-employee toggles, so they are not stored here.
ALTER TABLE employee ADD COLUMN IF NOT EXISTS gross_pay numeric(14,2);
ALTER TABLE employee ADD COLUMN IF NOT EXISTS paye_applies boolean NOT NULL DEFAULT true;
ALTER TABLE employee ADD COLUMN IF NOT EXISTS pension_applies boolean NOT NULL DEFAULT true;
-- NHF is voluntary for private-sector employees under the Nigeria Tax Act 2025, so it defaults off.
ALTER TABLE employee ADD COLUMN IF NOT EXISTS nhf_applies boolean NOT NULL DEFAULT false;
-- Declared annual rent, for the Rent Relief Allowance that replaced the Consolidated Relief Allowance.
ALTER TABLE employee ADD COLUMN IF NOT EXISTS annual_rent numeric(14,2);

-- Existing records: gross is the sum of the components already captured.
UPDATE employee
   SET gross_pay = COALESCE(basic_salary,0) + COALESCE(housing_allowance,0)
                 + COALESCE(transport_allowance,0) + COALESCE(other_allowances,0)
 WHERE gross_pay IS NULL;
