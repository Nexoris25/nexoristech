/**
 * Chooses the SI/APP adapter for this installation. One place, so there is exactly one answer to
 * "who are we talking to", and adding a real provider is a single registration here.
 *
 * Credentials are read from the environment and never from the database, never returned to a caller and
 * never logged. This module deliberately exposes only whether a provider is configured, not what it was
 * configured with.
 */
import type { SIAPPAdapter } from "./adapter.js";
import { UnconfiguredAdapter } from "./adapters/unconfigured.js";

/**
 * Whether the environment holds a complete set of SI/APP credentials.
 *
 * Business ID and Service ID are checked independently and are never treated as interchangeable: a
 * provider that issues both will reject a request that reuses one for the other.
 */
export function credentialsPresent(): boolean {
  return Boolean(
    process.env.NRS_SIAPP_BUSINESS_ID
    && process.env.NRS_SIAPP_SERVICE_ID
    && process.env.NRS_SIAPP_CRYPTO_KEY
    && process.env.NRS_SIAPP_ENDPOINT,
  );
}

/**
 * The adapter to use. Returns the unconfigured, fail-closed adapter until a real provider is registered
 * here, which requires that provider's documentation.
 *
 * Credentials alone are not enough to make this return a live adapter. Without the provider's request
 * and response schemas there is nothing to build, and guessing them is what previously produced
 * fabricated fiscal identifiers.
 */
export function fiscalAdapter(): SIAPPAdapter {
  return new UnconfiguredAdapter();
}
