-- Versioned tax rules and line categories.
--
-- Rates were previously a single editable number on finance_settings (and a second, unrelated copy on
-- company_settings). Editing it silently rewrote the tax position of every document that recomputed, and
-- there was no way to state "7.5% applied until date X" — which is exactly what a reconciliation or a
-- filing defence needs. A rule here is never edited in place: it is closed off and superseded, so the
-- rate that priced a document stays recoverable forever.

CREATE TABLE IF NOT EXISTS tax_rule (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_type       text NOT NULL,
  -- NUMERIC, never float: this multiplies money.
  rate           numeric(6,3) NOT NULL,
  -- Half-open interval [effective_from, effective_to). NULL effective_to means "still in force".
  effective_from date NOT NULL,
  effective_to   date,
  jurisdiction   text NOT NULL DEFAULT 'NG',
  note           text,
  created_by     uuid REFERENCES staff(id),
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tax_rule_type_check CHECK (tax_type IN ('VAT','WHT')),
  CONSTRAINT tax_rule_rate_check CHECK (rate >= 0 AND rate <= 100),
  CONSTRAINT tax_rule_period_check CHECK (effective_to IS NULL OR effective_to > effective_from)
);

-- Two rules of the same type may not both be in force on the same day. A GiST exclusion over the
-- half-open date range is what makes "which rate applied on this date" have exactly one answer.
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE tax_rule DROP CONSTRAINT IF EXISTS tax_rule_no_overlap;
ALTER TABLE tax_rule ADD CONSTRAINT tax_rule_no_overlap
  EXCLUDE USING gist (
    tax_type WITH =,
    jurisdiction WITH =,
    daterange(effective_from, effective_to, '[)') WITH &&
  );

CREATE INDEX IF NOT EXISTS tax_rule_lookup_idx ON tax_rule (tax_type, jurisdiction, effective_from DESC);

-- How a line is treated for VAT. "Standard" is charged at the prevailing rate; "ZeroRated" is taxable at
-- 0% and stays in the VAT return; "Exempt" is outside the VAT system entirely. Zero-rated and exempt are
-- not interchangeable even though both charge nothing, which a single vat_applicable boolean cannot say.
CREATE TABLE IF NOT EXISTS tax_category (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text NOT NULL UNIQUE,
  label       text NOT NULL,
  treatment   text NOT NULL,
  description text,
  active      boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tax_category_treatment_check CHECK (treatment IN ('Standard','ZeroRated','Exempt'))
);

INSERT INTO tax_category (code, label, treatment, description) VALUES
  ('STD', 'Standard rated', 'Standard', 'Charged VAT at the prevailing rate.'),
  ('ZER', 'Zero rated', 'ZeroRated', 'Taxable at 0%. Still reported in the VAT return.'),
  ('EXM', 'Exempt', 'Exempt', 'Outside the VAT system. Not part of the taxable base.')
ON CONFLICT (code) DO NOTHING;

-- Seed the rates currently in force so nothing is priced by an absent rule. Dated from the start of the
-- 2026 tax year; supersede rather than edit when a rate changes.
INSERT INTO tax_rule (tax_type, rate, effective_from, jurisdiction, note)
SELECT 'VAT', 7.5, DATE '2026-01-01', 'NG', 'Seeded from the rate previously held on finance_settings.'
 WHERE NOT EXISTS (SELECT 1 FROM tax_rule WHERE tax_type='VAT' AND jurisdiction='NG');

INSERT INTO tax_rule (tax_type, rate, effective_from, jurisdiction, note)
SELECT 'WHT', 5, DATE '2026-01-01', 'NG', 'Seeded from the rate previously held on finance_settings.'
 WHERE NOT EXISTS (SELECT 1 FROM tax_rule WHERE tax_type='WHT' AND jurisdiction='NG');

-- Record which rule priced each document, so a historic total can always be explained.
ALTER TABLE einvoice ADD COLUMN IF NOT EXISTS vat_rule_id uuid REFERENCES tax_rule(id);
ALTER TABLE einvoice_line ADD COLUMN IF NOT EXISTS tax_category_code text REFERENCES tax_category(code);
