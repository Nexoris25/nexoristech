-- The shell's access model (PRD 3.2) and company settings including NRS e-invoicing readiness
-- (PRD 15). Module access is granted per person per module in one table, read by every module's
-- permission check. It is additive to staff.role, which stays as the platform-wide role until the
-- HR person model lands; the shell People & Access screen manages both. Idempotent.

CREATE TABLE IF NOT EXISTS module_access (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id    uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  module      text NOT NULL CHECK (module IN ('crm', 'finance', 'hr', 'payroll')),
  role        text NOT NULL,
  granted_by  uuid REFERENCES staff(id),
  granted_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (staff_id, module)
);

CREATE INDEX IF NOT EXISTS module_access_staff_idx ON module_access (staff_id);

-- Company profile and NRS e-invoicing readiness (PRD 15). A single row. The invoice already carries
-- the nullable NRS fields (IRN, QR, TIN, submission status) once Finance lands; turning NRS on later
-- is a matter of wiring the SI or APP partner call and flipping nrs_enabled, not restructuring data.
CREATE TABLE IF NOT EXISTS company_settings (
  id              boolean PRIMARY KEY DEFAULT true CHECK (id),
  legal_name      text NOT NULL DEFAULT 'Nexoris Technologies Ltd',
  tin             text,
  address         text NOT NULL DEFAULT 'No. 5, Mojisola Dokpesi Street, Ajah, Lekki Lagos',
  email           text NOT NULL DEFAULT 'business@nexoristech.com',
  phone           text NOT NULL DEFAULT '+234 913 813 3224',
  vat_rate        numeric NOT NULL DEFAULT 7.5,
  nrs_enabled     boolean NOT NULL DEFAULT false,
  nrs_environment text NOT NULL DEFAULT 'sandbox' CHECK (nrs_environment IN ('sandbox', 'production')),
  nrs_partner     text,
  nrs_partner_type text CHECK (nrs_partner_type IN ('SI', 'APP')),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

INSERT INTO company_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

-- Backfill: the founding admin holds admin on every module so nothing is locked out on upgrade.
INSERT INTO module_access (staff_id, module, role)
SELECT s.id, m.module, 'admin'
  FROM staff s
  CROSS JOIN (VALUES ('crm'), ('finance'), ('hr'), ('payroll')) AS m(module)
 WHERE s.role = 'admin'
ON CONFLICT (staff_id, module) DO NOTHING;
