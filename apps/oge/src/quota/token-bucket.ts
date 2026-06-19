/**
 * A token-bucket rate limiter (PRD 10.4 "a token-bucket per provider"). Tokens refill continuously
 * at a fixed rate up to a capacity; each call removes tokens. The clock is injectable so the
 * behaviour is deterministic under test.
 */

export interface Clock {
  now(): number;
}

export const systemClock: Clock = { now: () => Date.now() };

export class TokenBucket {
  private tokens: number;
  private last: number;

  constructor(
    private readonly capacity: number,
    private readonly refillPerSecond: number,
    private readonly clock: Clock = systemClock,
  ) {
    this.tokens = capacity;
    this.last = clock.now();
  }

  private refill(now: number): void {
    const elapsed = (now - this.last) / 1000;
    if (elapsed > 0) {
      this.tokens = Math.min(
        this.capacity,
        this.tokens + elapsed * this.refillPerSecond,
      );
      this.last = now;
    }
  }

  /** Try to take `count` tokens. Returns false (taking nothing) if not enough are available. */
  tryRemove(count = 1): boolean {
    this.refill(this.clock.now());
    if (this.tokens >= count) {
      this.tokens -= count;
      return true;
    }
    return false;
  }

  /** Whole tokens available right now. */
  get available(): number {
    this.refill(this.clock.now());
    return Math.floor(this.tokens);
  }
}
