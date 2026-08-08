-- Clear seed and test data so the platform can take real records.
--
-- What goes: every transactional row. All of it is demonstrably seeded or generated during build —
-- leads captioned "(seed data)", invoices for Acme Nigeria Ltd, Gate Test Ltd, Draft PDF Test and
-- NoTIN Buyer Ltd, the payroll runs and audit entries produced while testing.
--
-- What stays: configuration, because it is real and re-entering it would be work with no benefit —
-- company settings, tax rules and categories, payroll and finance settings, payment methods, expense
-- categories, departments. And staff on the @nexoristech.com domain, which is the live one; the
-- @nexoris.com accounts are seeds and the probe accounts were created for an RBAC test.
--
-- Deletion runs children-first so foreign keys never block it, and the whole file is one transaction:
-- either the platform ends up clean or nothing changes.
BEGIN;

-- ---- Fiscal and invoicing -----------------------------------------------------------------------
DELETE FROM fiscal_submission;
DELETE FROM fiscal_submission_job;
DELETE FROM einvoice_payment;
DELETE FROM einvoice_line;
DELETE FROM einvoice_event;
DELETE FROM einvoice_delivery;
DELETE FROM einvoice_installment;
DELETE FROM einvoice;
DELETE FROM nrs_buyer;
DELETE FROM nrs_log;

-- ---- CRM ----------------------------------------------------------------------------------------
DELETE FROM lead_activity;
DELETE FROM reassignment_request;
DELETE FROM lead;
DELETE FROM sales_target;

-- ---- Payroll and HR transactions ----------------------------------------------------------------
DELETE FROM pay_run_line;
DELETE FROM pay_run;
DELETE FROM salary_advance;
DELETE FROM leave_request;
DELETE FROM expense_claim;
DELETE FROM employee_guarantor;

-- ---- Finance transactions -----------------------------------------------------------------------
DELETE FROM expense;

-- ---- People -------------------------------------------------------------------------------------
-- Test employees only. A person on the live domain is assumed real and left alone.
-- employee.manager_id is a self-reference, so anyone reporting to a departing test employee is
-- detached first rather than being deleted alongside them.
UPDATE employee SET manager_id = NULL
 WHERE manager_id IN (
   SELECT id FROM employee WHERE COALESCE(work_email, personal_email, '') NOT LIKE '%@nexoristech.com');

DELETE FROM employee
 WHERE COALESCE(work_email, personal_email, '') NOT LIKE '%@nexoristech.com';

-- Access grants and reset requests for the accounts about to go.
DELETE FROM module_access WHERE staff_id IN (
  SELECT id FROM staff WHERE email LIKE '%@nexoris.com' OR email LIKE 'probe.%' OR email LIKE 'qa.%');
DELETE FROM password_reset_request;

-- The audit log references staff, so it is cleared before they are. Everything in it is build
-- activity; a live deployment should start its trail from its first real action.
DELETE FROM audit_log;

DELETE FROM staff
 WHERE email LIKE '%@nexoris.com' OR email LIKE 'probe.%' OR email LIKE 'qa.%';

-- ---- Sequences ----------------------------------------------------------------------------------
-- Document numbers restart at 1, so the first real invoice is INV-00001 rather than continuing from
-- the test run.
ALTER SEQUENCE IF EXISTS einvoice_seq_seq RESTART WITH 1;

COMMIT;
