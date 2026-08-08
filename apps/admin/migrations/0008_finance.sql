-- The Finance module (PRD 6). Finance owns the invoice, every Naira in and out, and the reports
-- (6.1). Built to the PRD's model - Invoice -> Payment on the receivable side, and Expense on the
-- payable side (6.4, 6.5) - organised under the requested Dashboard / Transactions / Receivables /
-- Payables / Reports / Settings structure. There is no Bill/Vendor entity beyond the vendor named on
-- an expense: "Accounts Payable" here is the PRD's Expenses grouped by vendor, not a new sub-ledger.
-- No BVN anywhere (PRD 1, platform-wide). VAT is 7.5%; withholding tax is what a client is expected
-- to deduct, shown for information, never added to what we collect.

-- Finance configuration, a singleton (6.10 Settings: financial year, currency, VAT/WHT rates).
CREATE TABLE IF NOT EXISTS finance_settings (
  id                        boolean PRIMARY KEY DEFAULT true CHECK (id),
  financial_year_start_month integer NOT NULL DEFAULT 1 CHECK (financial_year_start_month BETWEEN 1 AND 12),
  currency                  text NOT NULL DEFAULT 'NGN',
  vat_rate                  numeric(5,2) NOT NULL DEFAULT 7.5,
  wht_rate                  numeric(5,2) NOT NULL DEFAULT 5.0,
  updated_at                timestamptz NOT NULL DEFAULT now()
);
INSERT INTO finance_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

-- Income and expense categories - the chart of accounts kept simple (6.2), expandable as the company
-- grows. Every expense and every invoice line rolls up to one of these for the reports.
CREATE TABLE IF NOT EXISTS finance_category (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind    text NOT NULL CHECK (kind IN ('Income', 'Expense')),
  name    text NOT NULL,
  sort    integer NOT NULL DEFAULT 0,
  active  boolean NOT NULL DEFAULT true,
  UNIQUE (kind, name)
);
INSERT INTO finance_category (kind, name, sort) VALUES
  ('Income', 'Project Revenue', 1),
  ('Income', 'Retainer Revenue', 2),
  ('Income', 'Consulting', 3),
  ('Income', 'Other Income', 9),
  ('Expense', 'Salaries & Payroll', 1),
  ('Expense', 'Contractors', 2),
  ('Expense', 'Software & Subscriptions', 3),
  ('Expense', 'Office & Utilities', 4),
  ('Expense', 'Marketing', 5),
  ('Expense', 'Travel', 6),
  ('Expense', 'Statutory & Taxes', 7),
  ('Expense', 'Bank Charges', 8),
  ('Expense', 'Other Expense', 9)
ON CONFLICT (kind, name) DO NOTHING;

-- Payment methods / bank accounts money is received into or paid from (6.7). Account number only,
-- never a BVN.
CREATE TABLE IF NOT EXISTS payment_method (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  kind        text NOT NULL DEFAULT 'Bank' CHECK (kind IN ('Bank', 'Cash', 'Mobile')),
  bank_name   text,
  account_no  text,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);
INSERT INTO payment_method (name, kind, bank_name)
  SELECT 'Primary Current Account', 'Bank', 'Nexoris Technologies Bank'
  WHERE NOT EXISTS (SELECT 1 FROM payment_method);

-- Receivable: an invoice raised to a client. Holds client + TIN, the money fields, the VAT at 7.5%,
-- the withholding tax the client is expected to deduct, the due date, status, and the bank account it
-- is billed to (6.4). Lives under an engagement in the PRD; the engagement's type and service line
-- are carried on the invoice so a customer statement reads without a separate join.
CREATE TABLE IF NOT EXISTS invoice (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seq               bigint GENERATED ALWAYS AS IDENTITY,
  client_name       text NOT NULL,
  client_tin        text,
  engagement_type   text CHECK (engagement_type IN ('Project', 'Retainer', 'Hybrid')),
  service_line      text,
  issue_date        date NOT NULL DEFAULT current_date,
  due_date          date NOT NULL DEFAULT current_date + 30,
  currency          text NOT NULL DEFAULT 'NGN',
  subtotal          numeric(16,2) NOT NULL DEFAULT 0,
  vat               numeric(16,2) NOT NULL DEFAULT 0,
  wht_expected      numeric(16,2) NOT NULL DEFAULT 0,
  total             numeric(16,2) NOT NULL DEFAULT 0,
  amount_paid       numeric(16,2) NOT NULL DEFAULT 0,
  status            text NOT NULL DEFAULT 'Draft'
                      CHECK (status IN ('Draft', 'Sent', 'Part-Paid', 'Paid', 'Void')),
  payment_method_id uuid REFERENCES payment_method(id),
  notes             text,
  created_by        uuid REFERENCES staff(id),
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS invoice_status_idx ON invoice (status);
CREATE INDEX IF NOT EXISTS invoice_client_idx ON invoice (lower(client_name));

CREATE TABLE IF NOT EXISTS invoice_line (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id     uuid NOT NULL REFERENCES invoice(id) ON DELETE CASCADE,
  description    text NOT NULL,
  quantity       numeric(12,2) NOT NULL DEFAULT 1,
  unit_price     numeric(16,2) NOT NULL DEFAULT 0,
  vat_applicable boolean NOT NULL DEFAULT true,
  line_total     numeric(16,2) NOT NULL DEFAULT 0,
  sort           integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS invoice_line_invoice_idx ON invoice_line (invoice_id);

-- A payment received against an invoice (6.4). Each one moves the invoice toward Paid and is the
-- income side of the transaction ledger.
CREATE TABLE IF NOT EXISTS invoice_payment (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  uuid NOT NULL REFERENCES invoice(id) ON DELETE CASCADE,
  amount      numeric(16,2) NOT NULL CHECK (amount > 0),
  paid_on     date NOT NULL DEFAULT current_date,
  method_id   uuid REFERENCES payment_method(id),
  reference   text,
  recorded_by uuid REFERENCES staff(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS invoice_payment_invoice_idx ON invoice_payment (invoice_id);
CREATE INDEX IF NOT EXISTS invoice_payment_date_idx ON invoice_payment (paid_on);

-- Payable: a company expense entered directly by Finance (6.5), optionally against a vendor. The
-- payable / "bill" side of the ledger. Payroll posts salary expense here automatically on disbursement
-- (8.9); those rows carry source = 'Payroll'.
CREATE TABLE IF NOT EXISTS expense (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seq               bigint GENERATED ALWAYS AS IDENTITY,
  expense_date      date NOT NULL DEFAULT current_date,
  category_id       uuid REFERENCES finance_category(id),
  vendor            text,
  description       text NOT NULL,
  amount            numeric(16,2) NOT NULL CHECK (amount >= 0),
  vat               numeric(16,2) NOT NULL DEFAULT 0,
  payment_method_id uuid REFERENCES payment_method(id),
  status            text NOT NULL DEFAULT 'Paid' CHECK (status IN ('Unpaid', 'Paid')),
  source            text NOT NULL DEFAULT 'Manual' CHECK (source IN ('Manual', 'Payroll')),
  reference         text,
  created_by        uuid REFERENCES staff(id),
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS expense_date_idx ON expense (expense_date);
CREATE INDEX IF NOT EXISTS expense_vendor_idx ON expense (lower(vendor));
CREATE INDEX IF NOT EXISTS expense_category_idx ON expense (category_id);
