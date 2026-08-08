-- Fiscalisation containment: the document timeline needs to record the states that exist once
-- submission goes through a real SI/APP adapter rather than a simulator.
--
--   blocked      - refused before any attempt, because no accredited provider is configured
--   unavailable  - the provider could not be reached; NOT a rejection, the document is unchanged
--   containment  - fabricated fiscal data was cleared from this document
--
-- 'unavailable' matters on its own: a transport failure must never be recorded as a tax outcome, or a
-- document that the authority never saw would look as though it had been considered and refused.
ALTER TABLE einvoice_event DROP CONSTRAINT IF EXISTS einvoice_event_kind_check;
ALTER TABLE einvoice_event ADD CONSTRAINT einvoice_event_kind_check
  CHECK (kind IN ('submit','accept','reject','retry','cancel','request','response','blocked','unavailable','containment'));

-- The integration log gains the same vocabulary for batch-level and administrative entries.
ALTER TABLE nrs_log DROP CONSTRAINT IF EXISTS nrs_log_kind_check;
ALTER TABLE nrs_log ADD CONSTRAINT nrs_log_kind_check
  CHECK (kind IN ('auth','request','response','sync','submit','blocked','containment'));
