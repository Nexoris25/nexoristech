-- Completing the CRM module (PRD 5.4, 5.6, 5.7, 5.9). Adds the Sales Rep Profile territory, the
-- Deal captured when a lead is marked Won, per-rep weekly and monthly targets, and the salesperson
-- reassignment request queue. Idempotent.

-- Sales Rep Profile: territory joins the industries and capacity cap already on staff (PRD 5.6).
ALTER TABLE staff ADD COLUMN IF NOT EXISTS territory text;

-- The Deal captured the moment a lead is marked Won (PRD 5.9, 14): its value, service line, and
-- engagement type. CRM's Sales Won Value reads deal_value; Finance later reads these to open the
-- Engagement through the Deal-to-Engagement contract. CRM never labels this Revenue.
ALTER TABLE lead ADD COLUMN IF NOT EXISTS deal_value numeric(14,2);
ALTER TABLE lead ADD COLUMN IF NOT EXISTS service_line text;
ALTER TABLE lead ADD COLUMN IF NOT EXISTS engagement_type text
  CHECK (engagement_type IS NULL OR engagement_type IN ('one-off', 'retainer', 'project'));
ALTER TABLE lead ADD COLUMN IF NOT EXISTS won_at timestamptz;

-- Per-rep targets, weekly and monthly, split into activity and outcome metrics (PRD 5.7). One row
-- per rep, period, and metric; the target is a whole number (a count, or a naira amount for value).
CREATE TABLE IF NOT EXISTS sales_target (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id    uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  period      text NOT NULL CHECK (period IN ('weekly', 'monthly')),
  metric      text NOT NULL,
  target      bigint NOT NULL DEFAULT 0 CHECK (target >= 0),
  updated_by  uuid REFERENCES staff(id),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (staff_id, period, metric)
);

-- A salesperson may request a reassignment with a reason; a CRM Admin approves or declines it
-- (PRD 5.4). Approval hands the lead back to the reassignment queue for a new owner decision.
CREATE TABLE IF NOT EXISTS reassignment_request (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id       uuid NOT NULL REFERENCES lead(id) ON DELETE CASCADE,
  requested_by  uuid NOT NULL REFERENCES staff(id),
  reason        text NOT NULL,
  status        text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'declined')),
  decided_by    uuid REFERENCES staff(id),
  decided_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reassignment_request_pending_idx
  ON reassignment_request (status) WHERE status = 'pending';

-- Only one open request per lead at a time.
CREATE UNIQUE INDEX IF NOT EXISTS reassignment_request_one_open_idx
  ON reassignment_request (lead_id) WHERE status = 'pending';
