-- Projects, and invoicing that does not depend on the NRS.
--
-- Two changes that belong together.
--
-- 1. A project is now a thing. It used to be free text repeated on every invoice (project_name,
--    project_value, milestone_name), so two invoices belonged to the same project only if somebody
--    typed the name identically twice. Nothing could be totalled, and percentage billing had no
--    idea what had already been billed. Those columns stay for now and are written alongside the
--    new foreign key, so nothing that reads them breaks while the pages move over.
--
-- 2. Fiscalisation becomes an attribute of an invoice rather than a species of one. An invoice is
--    born as a PDF invoice; submitting it to the NRS is an action that may be taken later or never.
--    One table, one payment ledger, one revenue figure. Two document types would have meant two
--    revenue figures, which is what the single-invoice-source rule exists to prevent.
--
--    `nrs_status = 'NotSubmitted'` was already the PDF-invoice state. What was missing was a way to
--    say whether a document is ever meant to be fiscalised, so the submission queues stop treating
--    every unfiscalised invoice as one that is overdue for submission.
--
-- Safe to apply: einvoice has no rows, every added column is nullable or defaulted, and the NRS
-- submission path is untouched.

-- Who the work is for. Invoices keep their own customer_* snapshot on purpose: a document must not
-- change because a client later moves office.
CREATE TABLE IF NOT EXISTS client (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  contact_name   text,
  email          text,
  phone          text,
  address        text,
  tin            text,
  rc_number      text,
  notes          text,
  active         boolean NOT NULL DEFAULT true,
  created_by     uuid REFERENCES staff(id),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS client_name_key ON client (lower(name));

CREATE TABLE IF NOT EXISTS project (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code            text NOT NULL,
  name            text NOT NULL,
  client_id       uuid NOT NULL REFERENCES client(id),
  -- Where the work came from, when it came through the CRM. Null for work that did not.
  lead_id         uuid REFERENCES lead(id) ON DELETE SET NULL,
  description     text,
  -- The agreed price of the whole engagement. Percentage billing is a percentage of this, so it is
  -- NUMERIC and never a float.
  contract_value  numeric(16,2) NOT NULL DEFAULT 0,
  currency        text NOT NULL DEFAULT 'NGN',
  status          text NOT NULL DEFAULT 'Planned'
                    CHECK (status IN ('Planned', 'Active', 'OnHold', 'Completed', 'Cancelled')),
  start_date      date,
  end_date        date,
  -- Delivery progress, set by whoever runs the project. Deliberately not derived from money: a
  -- project can be fully invoiced and half built, and conflating the two hides exactly that.
  progress_percent numeric(5,2) NOT NULL DEFAULT 0
                    CHECK (progress_percent >= 0 AND progress_percent <= 100),
  service_line    text,
  manager_id      uuid REFERENCES staff(id),
  created_by      uuid REFERENCES staff(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS project_code_key ON project (upper(code));
CREATE INDEX IF NOT EXISTS project_client_idx ON project (client_id);
CREATE INDEX IF NOT EXISTS project_status_idx ON project (status);

-- A stage of delivery that can be billed and can be completed. Amount and percent are both kept:
-- percent is what was agreed, amount is what that came to at the contract value in force.
CREATE TABLE IF NOT EXISTS project_milestone (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  label         text NOT NULL,
  percent       numeric(6,3),
  amount        numeric(16,2) NOT NULL DEFAULT 0,
  due_date      date,
  status        text NOT NULL DEFAULT 'Pending'
                  CHECK (status IN ('Pending', 'InProgress', 'Done')),
  completed_at  timestamptz,
  sort          integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS project_milestone_project_idx ON project_milestone (project_id, sort);

-- The invoice's side of all of this.
ALTER TABLE einvoice
  ADD COLUMN IF NOT EXISTS project_id     uuid REFERENCES project(id),
  ADD COLUMN IF NOT EXISTS milestone_id   uuid REFERENCES project_milestone(id),
  ADD COLUMN IF NOT EXISTS client_id      uuid REFERENCES client(id),
  -- Whether this document is meant to reach the NRS at all. False is an ordinary PDF invoice: it is
  -- issued, sent, paid and reported like any other, and it never appears in a submission queue.
  ADD COLUMN IF NOT EXISTS fiscal_required boolean NOT NULL DEFAULT false,
  -- Whether VAT is charged on this document. Separate from the per-line treatment, which says what
  -- kind of supply a line is. This says whether this invoice charges tax at all.
  ADD COLUMN IF NOT EXISTS vat_charged    boolean NOT NULL DEFAULT true,
  -- Cancellation is a state, never a delete: a cancelled invoice has to stay readable and has to
  -- stop counting as revenue or as debt.
  ADD COLUMN IF NOT EXISTS cancelled_at   timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_reason  text,
  ADD COLUMN IF NOT EXISTS cancelled_by   uuid REFERENCES staff(id),
  -- Display numbering. `seq` stays as the single internal identity for every document; `series` and
  -- `series_no` are what a customer reads. They are separate so a fiscal series can be gapless
  -- while an ordinary PDF series runs on its own count.
  ADD COLUMN IF NOT EXISTS series         text,
  ADD COLUMN IF NOT EXISTS series_no      bigint;

CREATE INDEX IF NOT EXISTS einvoice_project_idx ON einvoice (project_id);
CREATE UNIQUE INDEX IF NOT EXISTS einvoice_series_key ON einvoice (series, series_no)
  WHERE series IS NOT NULL AND series_no IS NOT NULL;

-- One counter per series, incremented under a row lock so two invoices raised at the same moment
-- cannot take the same number.
CREATE TABLE IF NOT EXISTS document_series (
  series      text PRIMARY KEY,
  next_no     bigint NOT NULL DEFAULT 1,
  updated_at  timestamptz NOT NULL DEFAULT now()
);
INSERT INTO document_series (series, next_no) VALUES
  ('INV', 1), ('NX', 1), ('CRN', 1), ('DBN', 1)
ON CONFLICT (series) DO NOTHING;

-- Payments carry the money; the project rollup reads them through the invoice rather than through a
-- copied project_id, which cannot drift.
CREATE INDEX IF NOT EXISTS einvoice_payment_invoice_idx ON einvoice_payment (einvoice_id);
