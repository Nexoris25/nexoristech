/**
 * The quota governor (PRD 10.4): per-session and per-IP limits, an input character cap, and a
 * token bucket per provider, with batch jobs deferring first as a bucket nears empty so
 * interactive chat stays up longest. Pure and deterministic given an injectable clock.
 */
import { TokenBucket, systemClock, type Clock } from "./token-bucket.js";
import type { ProviderId } from "../config/models.js";

/** PRD 10.4 caps interactive input at 2,000 characters. */
export const INPUT_CHAR_CAP = 2000;

export type DenyReason =
  | "input-too-long"
  | "session-rate"
  | "ip-rate";

export interface QuotaDecision {
  readonly allowed: boolean;
  readonly reason?: DenyReason;
}

/** A fixed-window request counter keyed by session or IP. */
class FixedWindowLimiter {
  private readonly hits = new Map<string, { count: number; start: number }>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly clock: Clock,
  ) {}

  check(key: string): boolean {
    const now = this.clock.now();
    const entry = this.hits.get(key);
    if (!entry || now - entry.start >= this.windowMs) {
      this.hits.set(key, { count: 1, start: now });
      return true;
    }
    if (entry.count < this.limit) {
      entry.count += 1;
      return true;
    }
    return false;
  }
}

export interface GovernorOptions {
  /** Max interactive requests per session per minute. */
  readonly perSessionPerMinute?: number;
  /** Max interactive requests per IP per minute. */
  readonly perIpPerMinute?: number;
  /** Per-provider bucket capacity (burst) and refill per second. */
  readonly providerCapacity?: number;
  readonly providerRefillPerSecond?: number;
  /**
   * Tokens to keep in reserve for interactive chat; a batch job defers when a provider's
   * available tokens drop to or below this.
   */
  readonly interactiveReserve?: number;
  readonly clock?: Clock;
}

export interface AdmitInput {
  readonly sessionId: string;
  readonly ip: string;
  readonly inputLength: number;
}

export class QuotaGovernor {
  private readonly sessionLimiter: FixedWindowLimiter;
  private readonly ipLimiter: FixedWindowLimiter;
  private readonly buckets = new Map<ProviderId, TokenBucket>();
  private readonly providerCapacity: number;
  private readonly providerRefillPerSecond: number;
  private readonly interactiveReserve: number;
  private readonly clock: Clock;

  constructor(options: GovernorOptions = {}) {
    this.clock = options.clock ?? systemClock;
    this.sessionLimiter = new FixedWindowLimiter(
      options.perSessionPerMinute ?? 30,
      60_000,
      this.clock,
    );
    this.ipLimiter = new FixedWindowLimiter(
      options.perIpPerMinute ?? 60,
      60_000,
      this.clock,
    );
    this.providerCapacity = options.providerCapacity ?? 60;
    this.providerRefillPerSecond = options.providerRefillPerSecond ?? 1;
    this.interactiveReserve = options.interactiveReserve ?? 5;
  }

  /** Decide whether an interactive chat request may proceed. Checks input size, then rates. */
  admitChat(input: AdmitInput): QuotaDecision {
    if (input.inputLength > INPUT_CHAR_CAP) {
      return { allowed: false, reason: "input-too-long" };
    }
    if (!this.ipLimiter.check(input.ip)) {
      return { allowed: false, reason: "ip-rate" };
    }
    if (!this.sessionLimiter.check(input.sessionId)) {
      return { allowed: false, reason: "session-rate" };
    }
    return { allowed: true };
  }

  private bucketFor(provider: ProviderId): TokenBucket {
    let bucket = this.buckets.get(provider);
    if (!bucket) {
      bucket = new TokenBucket(
        this.providerCapacity,
        this.providerRefillPerSecond,
        this.clock,
      );
      this.buckets.set(provider, bucket);
    }
    return bucket;
  }

  /** Try to spend one call against a provider's bucket. */
  tryProviderCall(provider: ProviderId): boolean {
    return this.bucketFor(provider).tryRemove(1);
  }

  /**
   * Whether a batch job should defer to protect interactive headroom: true when the provider's
   * available tokens are at or below the interactive reserve.
   */
  shouldDeferBatch(provider: ProviderId): boolean {
    return this.bucketFor(provider).available <= this.interactiveReserve;
  }
}
