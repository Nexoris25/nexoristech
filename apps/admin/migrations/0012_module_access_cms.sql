-- The CMS is now a grantable module (RBAC: Content Writers, Editors, and Fact-Checkers are granted the
-- CMS and see only the CMS when they sign in). Widen the module_access check to allow 'cms'.
ALTER TABLE module_access DROP CONSTRAINT IF EXISTS module_access_module_check;
ALTER TABLE module_access ADD CONSTRAINT module_access_module_check
  CHECK (module = ANY (ARRAY['crm', 'finance', 'hr', 'payroll', 'cms']));
