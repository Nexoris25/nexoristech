-- Record which versioned tax rule priced a Finance invoice, exactly as einvoice already does.
--
-- Finance was pricing from finance_settings.vat_rate, a single mutable number with no effective dates,
-- while the e-invoicing module priced from the versioned tax_rule table. Two invoices raised on the same
-- day could therefore carry different VAT depending on which screen raised them, and editing the setting
-- silently changed the basis of every historic invoice that recomputed.
ALTER TABLE invoice ADD COLUMN IF NOT EXISTS vat_rule_id uuid REFERENCES tax_rule(id);
ALTER TABLE invoice ADD COLUMN IF NOT EXISTS wht_rule_id uuid REFERENCES tax_rule(id);
