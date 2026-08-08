-- The salary band HR classified an employee into, from the Nigeria Tax Act 2025 table.
--
-- Stored for the record and for band-by-band compliance reporting. It is deliberately NOT an input to
-- any calculation: PAYE continues to come from computeStatutory, which runs the progressive table on
-- the employee's own figures. Storing a band and then taxing from it would let a wrong selection
-- produce a wrong payslip, which is the opposite of what this is for.
--
-- Nullable because an employee onboarded before this existed has no band, and a blank is honest.

ALTER TABLE employee ADD COLUMN IF NOT EXISTS salary_band text;

COMMENT ON COLUMN employee.salary_band IS
  'Nigeria Tax Act 2025 band id (band-1..band-6), for classification and cross-check only. PAYE is always computed from the employee figures, never from this.';
