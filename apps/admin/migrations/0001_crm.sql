-- The CRM module schema in nexoris_admin (PRD Part Three). The lead table already exists (created
-- by the Oge intake). This adds the staff, the immutable audit log, and the per-lead activity log,
-- and extends the lead with assignment, the SLA timer, and the lost/nurture fields. Idempotent.

-- Staff: admins, salespeople, and optional read-only viewers (PRD 2.4, 2.5).
CREATE TABLE IF NOT EXISTS staff (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  email          text NOT NULL UNIQUE,
  password_hash  text NOT NULL,
  role           text NOT NULL DEFAULT 'salesperson'
                   CHECK (role IN ('admin', 'salesperson', 'viewer')),
  active         boolean NOT NULL DEFAULT true,
  industries     text[] NOT NULL DEFAULT '{}',
  capacity_cap   integer,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Lead assignment, the first-response SLA timer, and the lost/nurture fields (PRD 2.2, 2.3).
ALTER TABLE lead ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES staff(id);
ALTER TABLE lead ADD COLUMN IF NOT EXISTS sla_due_at timestamptz;
ALTER TABLE lead ADD COLUMN IF NOT EXISTS lost_reason text;
ALTER TABLE lead ADD COLUMN IF NOT EXISTS nurture_date date;

CREATE INDEX IF NOT EXISTS lead_assigned_to_idx ON lead (assigned_to);

-- The immutable audit log: who, what, when, before and after (PRD 2.3). Append-only by policy.
CREATE TABLE IF NOT EXISTS audit_log (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id    uuid REFERENCES staff(id),
  action      text NOT NULL,
  entity      text NOT NULL,
  entity_id   text,
  before      jsonb,
  after       jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- The per-lead activity log with quick-logged and auto-captured entries (PRD 2.6).
CREATE TABLE IF NOT EXISTS lead_activity (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lead_id     uuid NOT NULL REFERENCES lead(id) ON DELETE CASCADE,
  actor_id    uuid REFERENCES staff(id),
  type        text NOT NULL,
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lead_activity_lead_idx ON lead_activity (lead_id);
