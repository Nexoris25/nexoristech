-- Make every module in the shell grantable. NRS e-Invoicing was previously reachable only by
-- inheriting a Finance grant; it is a distinct compliance module, so it gets its own grant.
ALTER TABLE module_access DROP CONSTRAINT IF EXISTS module_access_module_check;
ALTER TABLE module_access ADD CONSTRAINT module_access_module_check
  CHECK (module = ANY (ARRAY['crm', 'finance', 'einvoicing', 'hr', 'payroll', 'cms']));
