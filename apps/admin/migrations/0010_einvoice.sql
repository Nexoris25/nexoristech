-- The operational NRS e-Invoicing module (PRD 15): the actual documents issued and driven through the
-- Nigeria Revenue Service submission lifecycle - e-invoices, credit notes, and debit notes. This is
-- the day-to-day document side; the integration configuration lives on company_settings (0009). The
-- submission itself is still simulated, not a live NRS call (§17): the lifecycle, IRN, QR, and
-- validation shape are all real so wiring the live SI/APP call later is a swap, not a migration.

CREATE TABLE IF NOT EXISTS einvoice (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_type            text NOT NULL CHECK (doc_type IN ('Invoice', 'CreditNote', 'DebitNote')),
  seq                 bigint GENERATED ALWAYS AS IDENTITY,
  related_id          uuid REFERENCES einvoice(id),   -- original invoice for a credit/debit note
  reason              text,                            -- why the credit/debit note was raised
  customer_name       text NOT NULL,
  customer_tin        text,
  customer_email      text,
  customer_address    text,
  issue_date          date NOT NULL DEFAULT current_date,
  currency            text NOT NULL DEFAULT 'NGN',
  payment_terms       text,
  payment_method      text,
  subtotal            numeric(16,2) NOT NULL DEFAULT 0,
  vat                 numeric(16,2) NOT NULL DEFAULT 0,
  total               numeric(16,2) NOT NULL DEFAULT 0,
  status              text NOT NULL DEFAULT 'Draft'
                        CHECK (status IN ('Draft', 'Pending', 'Submitted', 'Accepted', 'Rejected', 'Cancelled')),
  -- NRS submission shape (PRD 15): IRN, QR payload, provider reference, provider response, and the
  -- validation messages the NRS returns, plus how many times we have tried.
  irn                 text,
  qr_data             text,
  submission_ref      text,
  submitted_at        timestamptz,
  si_app_response     text,
  validation_messages jsonb NOT NULL DEFAULT '[]',
  attempts            integer NOT NULL DEFAULT 0,
  environment         text NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
  finance_invoice_id  uuid REFERENCES invoice(id),    -- optional link to the Finance invoice it mirrors
  created_by          uuid REFERENCES staff(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS einvoice_type_idx ON einvoice (doc_type);
CREATE INDEX IF NOT EXISTS einvoice_status_idx ON einvoice (status);

CREATE TABLE IF NOT EXISTS einvoice_line (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  einvoice_id    uuid NOT NULL REFERENCES einvoice(id) ON DELETE CASCADE,
  description    text NOT NULL,
  quantity       numeric(12,2) NOT NULL DEFAULT 1,
  unit_price     numeric(16,2) NOT NULL DEFAULT 0,
  vat_applicable boolean NOT NULL DEFAULT true,
  line_total     numeric(16,2) NOT NULL DEFAULT 0,
  sort           integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS einvoice_line_doc_idx ON einvoice_line (einvoice_id);

-- Every lifecycle event on a document: submit, accept, reject, retry, cancel, or a raw API exchange.
-- Feeds the Submission Centre, the submission-attempt history on the detail screen, and the
-- Integration Monitor. Append-only.
CREATE TABLE IF NOT EXISTS einvoice_event (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  einvoice_id  uuid REFERENCES einvoice(id) ON DELETE CASCADE,
  kind         text NOT NULL CHECK (kind IN ('submit', 'accept', 'reject', 'retry', 'cancel', 'request', 'response')),
  summary      text NOT NULL,
  ok           boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS einvoice_event_doc_idx ON einvoice_event (einvoice_id);
CREATE INDEX IF NOT EXISTS einvoice_event_created_idx ON einvoice_event (created_at DESC);
