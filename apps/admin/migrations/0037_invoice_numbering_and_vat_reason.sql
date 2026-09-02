-- Settling three accounting questions the previous migration deliberately left open.
--
-- 1. ONE INVOICE NUMBER SERIES, ASSIGNED AT CREATION, NEVER CHANGED.
--
-- 0036 gave ordinary invoices their own 'NX' series and moved a document into the 'INV' series when
-- it was filed with the NRS. That was wrong, and wrong in the way that matters most: it changed the
-- number on a document the customer was already holding. A document number is the handle everyone
-- uses to refer to a transaction - the customer's remittance advice, our bank narration, the audit
-- trail - and it cannot be a thing that changes later. Two documents for one debt is precisely the
-- confusion a numbering scheme exists to prevent.
--
-- So there is one sequence for invoices now. Every invoice takes the next number when it is created,
-- fiscal or not, and keeps it forever. Filing adds an IRN; it does not rename anything. The tax
-- authority identifies a filed document by its IRN, and our series stays our own reference.
--
-- This also settles the gapless question by construction. The counter is taken inside the same
-- transaction that writes the invoice, so a failed insert rolls the number back rather than burning
-- it - which a Postgres sequence would not do. Every number is therefore accounted for by a real
-- document: issued, cancelled, or unfiled. Gaps *within the filed subset* are expected and fine;
-- each filed document has its IRN, and each unfiled number has an invoice behind it to point at.
--
-- Credit and debit notes keep their own sequences. They are different instruments, not invoices.
--
-- 2. A REASON IS REQUIRED WHEN NO VAT IS CHARGED.
--
-- Turning VAT off is a tax position, and a tax position that nobody wrote down is one nobody can
-- defend at an audit. The reason is chosen from a fixed list rather than typed, so the answer is a
-- category that can be totalled and reviewed, and it prints on the invoice so the customer knows on
-- what basis they were not charged.
--
-- 3. VAT CHARGED ON AN UNFILED INVOICE IS AN OBLIGATION, NOT AN ERROR.
--
-- If VAT has been charged then tax has been collected and has to be accounted for. That does not
-- make an unfiled invoice invalid - filing may not be available yet - but it does make it something
-- owed. No column is needed: the pair (vat_charged AND NOT fiscal_required) already says it, and
-- the index below is what makes that list cheap to pull at month end.

-- Retire the NX series. einvoice has no rows, so nothing is renumbered by this.
UPDATE einvoice SET series = 'INV' WHERE series = 'NX';
DELETE FROM document_series WHERE series = 'NX';

-- One counter for invoices, continuing past anything already issued.
UPDATE document_series ds
   SET next_no = GREATEST(
         ds.next_no,
         COALESCE((SELECT MAX(series_no) + 1 FROM einvoice WHERE series = 'INV'), 1)
       )
 WHERE ds.series = 'INV';

ALTER TABLE einvoice
  -- Why no VAT was charged. Null when VAT was charged, which is the ordinary case.
  ADD COLUMN IF NOT EXISTS vat_exempt_reason text
    CHECK (vat_exempt_reason IS NULL OR vat_exempt_reason IN (
      'ZeroRatedExport',   -- supplied to a customer outside Nigeria
      'ExemptSupply',      -- the supply itself is exempt
      'NotRegistered',     -- we were not VAT-registered for this supply
      'CustomerExempt',    -- the customer holds an exemption
      'Other'              -- with a note, below
    )),
  ADD COLUMN IF NOT EXISTS vat_exempt_note text;

-- A document that charges no VAT must say why. Enforced in the database as well as the form, so a
-- second caller cannot write a position with no basis recorded against it.
ALTER TABLE einvoice DROP CONSTRAINT IF EXISTS einvoice_vat_reason_required;
ALTER TABLE einvoice ADD CONSTRAINT einvoice_vat_reason_required
  CHECK (vat_charged OR doc_type <> 'Invoice' OR vat_exempt_reason IS NOT NULL);

-- The month-end list: tax collected on documents not yet filed.
CREATE INDEX IF NOT EXISTS einvoice_unfiled_vat_idx
  ON einvoice (issue_date)
  WHERE doc_type = 'Invoice' AND vat_charged AND NOT fiscal_required AND cancelled_at IS NULL;
