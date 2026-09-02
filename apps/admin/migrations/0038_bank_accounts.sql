-- The accounts a customer is asked to pay into.
--
-- An invoice that does not say where to send the money is a document the customer has to reply to
-- before they can act on it. `payment_instructions` existed as one free-text blob, which is fine for
-- a sentence about terms and wrong for account details: they need to be listed, aligned and read off
-- a page under pressure, and a blob cannot be laid out.
--
-- Held as an ordered array so the invoice prints them in the order they are given and a third can be
-- added without a migration. These are the company's own collection accounts, printed on every
-- invoice by design - there is nothing here that is not meant to be read by whoever is paying.
ALTER TABLE company_settings
  ADD COLUMN IF NOT EXISTS bank_accounts jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Seeded once, and only when nothing has been entered, so a later edit in Settings is never
-- overwritten by re-running migrations.
UPDATE company_settings
   SET bank_accounts = '[
     {"accountName": "Nexoris Technologies Ltd", "accountNumber": "1308065412", "bank": "Providus Bank"},
     {"accountName": "Nexoris Technologies Ltd", "accountNumber": "3000532497", "bank": "Moniepoint"}
   ]'::jsonb
 WHERE id = true
   AND (bank_accounts IS NULL OR jsonb_array_length(bank_accounts) = 0);

-- How long a customer has to pay, counted in business days from the issue date. The invoice form
-- offers this instead of asking somebody to work out a calendar date and land on a Saturday.
ALTER TABLE company_settings
  ADD COLUMN IF NOT EXISTS default_payment_days integer NOT NULL DEFAULT 14
    CHECK (default_payment_days >= 0 AND default_payment_days <= 365);

-- Kept on the invoice too, so a document explains its own due date rather than leaving a reader to
-- reverse-engineer it from two dates and a guess about weekends.
ALTER TABLE einvoice
  ADD COLUMN IF NOT EXISTS payment_days integer
    CHECK (payment_days IS NULL OR (payment_days >= 0 AND payment_days <= 365));
