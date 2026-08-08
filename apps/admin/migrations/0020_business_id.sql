-- Business ID for the SI/APP connection.
--
-- Only nrs_service_id existed, so there was nowhere to record the Business ID at all. They are separate
-- identifiers issued for different purposes, and a provider that issues both will reject a request that
-- reuses one for the other, so they are stored and edited independently and neither defaults to the
-- other. Both are non-secret; the cryptographic key stays in the environment and never reaches this table.
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS nrs_business_id text;
