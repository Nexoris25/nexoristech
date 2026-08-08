-- One invoice system.
--
-- Finance raises every invoice; NRS e-Invoicing is strictly compliance and transmission. Until now
-- Finance had two parallel systems: /finance/receivables/* wrote to `invoice`, while
-- /finance/invoices/* wrote to `einvoice`. Two forms, two API routes, two tables, one concept.
--
-- `einvoice` wins because it is the richer record and already holds the data: lifecycle and payment
-- status kept separate from NRS status, instalments, delivery history, and the fiscal fields a
-- document needs to be transmitted. Migrating the other way would mean rebuilding all of that.

-- Carry the legacy rows across, preserving their identity so any reference still resolves.
INSERT INTO einvoice (
  id, doc_type, customer_name, customer_tin, issue_date, due_date, currency,
  subtotal, vat, total, amount_paid, environment, lifecycle_status, nrs_status,
  billing_type, created_by, created_at, vat_rule_id
)
SELECT
  i.id, 'Invoice', i.client_name, i.client_tin, i.issue_date, i.due_date, COALESCE(i.currency, 'NGN'),
  i.subtotal, i.vat, i.total, COALESCE(i.amount_paid, 0), 'sandbox',
  -- A legacy status maps onto the commercial lifecycle only. It never implies anything about the NRS:
  -- none of these were ever transmitted, so they start at NotSubmitted like any new document.
  CASE i.status
    WHEN 'Draft' THEN 'Draft'
    WHEN 'Void' THEN 'Closed'
    WHEN 'Paid' THEN 'Closed'
    ELSE 'SentToCustomer'
  END,
  'NotSubmitted',
  'OneOff', i.created_by, i.created_at, NULL
FROM invoice i
WHERE NOT EXISTS (SELECT 1 FROM einvoice e WHERE e.id = i.id);

INSERT INTO einvoice_line (einvoice_id, description, quantity, unit_price, vat_applicable, line_total, sort)
SELECT l.invoice_id, l.description, l.quantity, l.unit_price, l.vat_applicable, l.line_total, l.sort
  FROM invoice_line l
 WHERE EXISTS (SELECT 1 FROM einvoice e WHERE e.id = l.invoice_id)
   AND NOT EXISTS (SELECT 1 FROM einvoice_line el WHERE el.einvoice_id = l.invoice_id AND el.sort = l.sort);

-- The legacy column held the receiving ACCOUNT ("Primary Current Account"), while einvoice_payment.method
-- holds the payment TYPE. They are different facts, so the account name is preserved in the note rather
-- than being guessed at as a type.
INSERT INTO einvoice_payment (einvoice_id, payment_date, amount, method, reference, notes, recorded_by)
SELECT p.invoice_id, p.paid_on, p.amount, 'Other', p.reference,
       CASE WHEN m.name IS NULL THEN NULL ELSE 'Received into ' || m.name END,
       p.recorded_by
  FROM invoice_payment p
  LEFT JOIN payment_method m ON m.id = p.method_id
 WHERE EXISTS (SELECT 1 FROM einvoice e WHERE e.id = p.invoice_id)
   AND NOT EXISTS (SELECT 1 FROM einvoice_payment ep WHERE ep.einvoice_id = p.invoice_id AND ep.amount = p.amount AND ep.payment_date = p.paid_on);

-- Nothing reads these now: the rows are in einvoice, the duplicate create/payment/status routes are
-- gone, and every Finance screen reads the single invoice of record. Dropped last, after the data
-- moved and the code stopped referencing them, so the migration is safe to run in one pass.
-- Two foreign keys were artefacts of the split itself:
--   einvoice.finance_invoice_id linked a fiscal document to its separate Finance twin. There is no twin
--     now, so the column is meaningless.
--   nrs_submission was superseded by fiscal_submission (append-only, one row per attempt) and is empty.
ALTER TABLE einvoice DROP COLUMN IF EXISTS finance_invoice_id;
DROP TABLE IF EXISTS nrs_submission;

DROP TABLE IF EXISTS invoice_payment;
DROP TABLE IF EXISTS invoice_line;
DROP TABLE IF EXISTS invoice;
