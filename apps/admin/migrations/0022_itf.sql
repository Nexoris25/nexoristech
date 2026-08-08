-- Industrial Training Fund: 1% of annual payroll, employer only, for employers with 5+ employees or
-- turnover from ₦50m (ITF Act).
--
-- It was missing from payroll entirely: not computed, not stored, and absent from the remittance screen.
-- The effect was that employer cost was understated by 1% of gross on every run, and an ITF liability
-- never appeared for filing. Employer-only, so it never touches an employee's net pay.
ALTER TABLE payroll_settings ADD COLUMN IF NOT EXISTS itf_enabled boolean NOT NULL DEFAULT true;
ALTER TABLE payroll_settings ADD COLUMN IF NOT EXISTS itf_rate numeric(6,3) NOT NULL DEFAULT 1;
ALTER TABLE pay_run_line ADD COLUMN IF NOT EXISTS itf numeric(16,2) NOT NULL DEFAULT 0;
