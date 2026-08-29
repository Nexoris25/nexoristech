-- Normalise module_access roles onto the roles the permission model defines.
--
-- Until now nothing outside the CMS read these values, so whatever was written stayed written. Some
-- rows hold the literal 'admin', which is a base staff role rather than a module role and matches no
-- entry in MODULE_ROLES. That was harmless while the column was decorative. It stops being harmless
-- the moment the gates consult it: a role the model does not recognise holds no capabilities, so
-- those grants would quietly open nothing.
--
-- Everyone affected here is mapped up to their module's administrator role, which is what 'admin' in
-- this column was always meant to convey. Mapping down would be safer in the abstract and wrong in
-- practice: these are the accounts that have been administering these modules.
--
-- 'Viewer' and 'HR Assistant' are the other legacy spellings. 'HR Assistant' survives as a real role
-- and is left alone; 'Viewer' becomes the module's own viewer role, because a viewer of everything
-- was never a thing the access table could express.

UPDATE module_access SET role = 'CRM Admin'         WHERE module = 'crm'        AND role IN ('admin', 'Admin');
UPDATE module_access SET role = 'Finance Admin'     WHERE module = 'finance'    AND role IN ('admin', 'Admin');
UPDATE module_access SET role = 'e-Invoicing Admin' WHERE module = 'einvoicing' AND role IN ('admin', 'Admin');
UPDATE module_access SET role = 'HR Admin'          WHERE module = 'hr'         AND role IN ('admin', 'Admin');
UPDATE module_access SET role = 'Payroll Admin'     WHERE module = 'payroll'    AND role IN ('admin', 'Admin');
UPDATE module_access SET role = 'CMS Admin'         WHERE module = 'cms'        AND role IN ('admin', 'Admin');

UPDATE module_access SET role = 'CRM Viewer'         WHERE module = 'crm'        AND role = 'Viewer';
UPDATE module_access SET role = 'Finance Viewer'     WHERE module = 'finance'    AND role = 'Viewer';
UPDATE module_access SET role = 'e-Invoicing Viewer' WHERE module = 'einvoicing' AND role = 'Viewer';
UPDATE module_access SET role = 'HR Viewer'          WHERE module = 'hr'         AND role = 'Viewer';
UPDATE module_access SET role = 'Payroll Viewer'     WHERE module = 'payroll'    AND role = 'Viewer';

COMMENT ON COLUMN module_access.role IS
  'The role granted in this module. Must be one of MODULE_ROLES for the module (lib/shell-constants),
   which is derived from the capability model in lib/permissions. A value outside that set holds no
   capabilities, so the gates treat it as no access rather than as full access.';
