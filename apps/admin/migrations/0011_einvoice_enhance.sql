-- Invoice Module enhancement (NRS e-Invoicing). The core principle: Invoice Lifecycle, NRS Compliance,
-- and Payment Tracking are three INDEPENDENT processes and must never be conflated. So the single
-- einvoice.status is split into a commercial lifecycle_status (controlled inside Nexoris) and an
-- nrs_status (only ever set by the accredited SI/APP responses). Payment is tracked separately through
-- amount_paid and the payment history, and its status is derived, never touching NRS. Adds billing
-- types, a secure public token for the customer-facing page, and payment/delivery/instalment history.

-- Three independent statuses on the document.
ALTER TABLE einvoice ADD COLUMN IF NOT EXISTS lifecycle_status text NOT NULL DEFAULT 'Draft'
  CHECK (lifecycle_status IN ('Draft','PendingApproval','ReadyToSend','SentToCustomer','Viewed','Closed'));
ALTER TABLE einvoice ADD COLUMN IF NOT EXISTS nrs_status text NOT NULL DEFAULT 'NotSubmitted'
  CHECK (nrs_status IN ('NotSubmitted','Submitting','Accepted','Rejected','Credited','Debited'));
ALTER TABLE einvoice ADD COLUMN IF NOT EXISTS amount_paid numeric(16,2) NOT NULL DEFAULT 0;
ALTER TABLE einvoice ADD COLUMN IF NOT EXISTS due_date date;

-- Billing model (a single workflow supports several billing types).
ALTER TABLE einvoice ADD COLUMN IF NOT EXISTS billing_type text NOT NULL DEFAULT 'OneOff'
  CHECK (billing_type IN ('OneOff','Milestone','Percentage','Retainer','CustomSchedule'));
ALTER TABLE einvoice ADD COLUMN IF NOT EXISTS project_name text;
ALTER TABLE einvoice ADD COLUMN IF NOT EXISTS project_value numeric(16,2);
ALTER TABLE einvoice ADD COLUMN IF NOT EXISTS milestone_name text;
ALTER TABLE einvoice ADD COLUMN IF NOT EXISTS milestone_amount numeric(16,2);
ALTER TABLE einvoice ADD COLUMN IF NOT EXISTS invoice_percentage numeric(6,2);
ALTER TABLE einvoice ADD COLUMN IF NOT EXISTS percentage_previously_billed numeric(6,2) NOT NULL DEFAULT 0;
ALTER TABLE einvoice ADD COLUMN IF NOT EXISTS billing_period text;
ALTER TABLE einvoice ADD COLUMN IF NOT EXISTS next_billing_date date;
ALTER TABLE einvoice ADD COLUMN IF NOT EXISTS contract_reference text;

-- Secure, unguessable public link id (never expose the internal uuid).
ALTER TABLE einvoice ADD COLUMN IF NOT EXISTS public_token text;
UPDATE einvoice SET public_token = replace(gen_random_uuid()::text, '-', '') WHERE public_token IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS einvoice_public_token_idx ON einvoice (public_token);

-- Backfill the split statuses from the old combined status, once.
UPDATE einvoice SET
  nrs_status = CASE status WHEN 'Accepted' THEN 'Accepted' WHEN 'Rejected' THEN 'Rejected'
                           WHEN 'Submitted' THEN 'Submitting' ELSE 'NotSubmitted' END,
  lifecycle_status = CASE status WHEN 'Accepted' THEN 'SentToCustomer' WHEN 'Cancelled' THEN 'Closed' ELSE 'Draft' END
WHERE nrs_status = 'NotSubmitted' AND lifecycle_status = 'Draft';

-- Payment history: one row per payment received, manually recorded by Finance. Never touches NRS.
CREATE TABLE IF NOT EXISTS einvoice_payment (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  einvoice_id       uuid NOT NULL REFERENCES einvoice(id) ON DELETE CASCADE,
  payment_date      date NOT NULL DEFAULT current_date,
  amount            numeric(16,2) NOT NULL CHECK (amount > 0),
  method            text NOT NULL DEFAULT 'Bank Transfer'
                      CHECK (method IN ('Bank Transfer','Cash','POS','Card','Cheque','Other')),
  reference         text,
  notes             text,
  remaining_balance numeric(16,2) NOT NULL DEFAULT 0,
  recorded_by       uuid REFERENCES staff(id),
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS einvoice_payment_doc_idx ON einvoice_payment (einvoice_id);

-- Delivery history: every time the invoice is emailed, downloaded, printed, or shared.
CREATE TABLE IF NOT EXISTS einvoice_delivery (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  einvoice_id  uuid NOT NULL REFERENCES einvoice(id) ON DELETE CASCADE,
  channel      text NOT NULL CHECK (channel IN ('Email','Download','Print','WhatsApp','Link')),
  recipient    text,
  note         text,
  created_by   uuid REFERENCES staff(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS einvoice_delivery_doc_idx ON einvoice_delivery (einvoice_id);

-- Custom payment schedule instalments (e.g. 30% advance / 40% development / 30% completion).
CREATE TABLE IF NOT EXISTS einvoice_installment (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  einvoice_id  uuid NOT NULL REFERENCES einvoice(id) ON DELETE CASCADE,
  label        text NOT NULL,
  percent      numeric(6,2),
  amount       numeric(16,2) NOT NULL DEFAULT 0,
  sort         integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS einvoice_installment_doc_idx ON einvoice_installment (einvoice_id);

-- Website on the company record, for the invoice PDF letterhead (RC/TIN already added in 0009).
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS payment_instructions text;
