/**
 * The error taxonomy the fallback chain reasons about (PRD 10.2). A provider call either
 * succeeds, or fails in a way that should advance to the next slot, or fails fatally. Rate limits,
 * provider outages, and malformed structured output all advance the chain; everything else is
 * surfaced. Provider client adapters translate their SDK errors into these types so the
 * orchestrator stays provider-agnostic.
 */

/** Base class for every error raised by a provider adapter. */
export class ProviderError extends Error {
  constructor(
    message: string,
    /** The provider+model identifier the error came from, for logs and the gap report. */
    readonly source: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = new.target.name;
  }
}

/** The provider returned a rate-limit signal. The chain advances to the next slot. */
export class RateLimitError extends ProviderError {}

/** The provider is unavailable (network error, 5xx, timeout). The chain advances. */
export class ProviderUnavailableError extends ProviderError {}

/**
 * A response that expected structured output did not validate against its schema. PRD 10.2
 * treats malformed JSON as a service error, so the chain advances to the next slot.
 */
export class SchemaValidationError extends ProviderError {}

/**
 * Every slot in the chain was tried (or skipped for a missing key) without a usable result. The
 * caller decides what happens next: the website bot shows the extractive fallback with a
 * handoff, the CRM worker queues the job and returns a rule-based baseline.
 */
export class ChainExhaustedError extends Error {
  constructor(
    message: string,
    /** The provider+model identifiers that were attempted, in order. */
    readonly attempted: readonly string[],
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "ChainExhaustedError";
  }
}

/** Whether an error means "try the next slot" rather than "stop and surface this". */
export function isRetriable(error: unknown): boolean {
  return (
    error instanceof RateLimitError ||
    error instanceof ProviderUnavailableError ||
    error instanceof SchemaValidationError
  );
}
