-- CMS user management fields on the shared staff table (the platform user table). Department, last login,
-- MFA, and an account status (active / invited / suspended) power the CMS Users screen.
ALTER TABLE staff ADD COLUMN IF NOT EXISTS cms_department text;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS last_login     timestamptz;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS mfa_enabled    boolean NOT NULL DEFAULT false;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active';
