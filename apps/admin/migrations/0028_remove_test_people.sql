-- Removes the people records created while testing the HR onboarding flow.
--
-- All three were created interactively within twenty minutes of each other on 2026-07-26, not by a seed
-- script, so each was checked before removal rather than matched on a name pattern:
--
--   Ada Nze, Sales Executive        — removed. No leads, targets, payslips or module grants reference it.
--   Nwaogechi Uwakwe, Backend Dev   — removed. Employee record only, no staff account, no payroll history.
--   Chinedu N, Founder & CEO        — KEPT. This is the owner's own employee record.
--
-- Nothing else in the admin database was touched: payroll runs, payslips, leave, expenses, advances,
-- sales targets and the audit log were all already empty.

BEGIN;

-- A manager reference is a self-foreign-key, so it has to let go before the row can be removed.
UPDATE employee SET manager_id = NULL
 WHERE manager_id IN (SELECT id FROM employee WHERE work_email IN ('ada.nze@nexoristech.com', 'uwakwe@nexoristech.com'));

DELETE FROM employee WHERE work_email IN ('ada.nze@nexoristech.com', 'uwakwe@nexoristech.com');
DELETE FROM module_access WHERE staff_id IN (SELECT id FROM staff WHERE email = 'ada.nze@nexoristech.com');
DELETE FROM staff WHERE email = 'ada.nze@nexoristech.com';

COMMIT;
