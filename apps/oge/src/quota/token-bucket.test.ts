import { describe, it, expect } from "vitest";
import { TokenBucket, type Clock } from "./token-bucket.js";

class FakeClock implements Clock {
  constructor(private t = 0) {}
  now(): number {
    return this.t;
  }
  advance(ms: number): void {
    this.t += ms;
  }
}

describe("TokenBucket", () => {
  it("starts full and spends down to empty", () => {
    const clock = new FakeClock();
    const bucket = new TokenBucket(3, 1, clock);
    expect(bucket.available).toBe(3);
    expect(bucket.tryRemove()).toBe(true);
    expect(bucket.tryRemove()).toBe(true);
    expect(bucket.tryRemove()).toBe(true);
    expect(bucket.tryRemove()).toBe(false);
  });

  it("refills continuously at the configured rate", () => {
    const clock = new FakeClock();
    const bucket = new TokenBucket(10, 2, clock); // 2 tokens per second
    for (let i = 0; i < 10; i += 1) bucket.tryRemove();
    expect(bucket.tryRemove()).toBe(false);

    clock.advance(1000); // one second -> 2 tokens
    expect(bucket.available).toBe(2);
    expect(bucket.tryRemove(2)).toBe(true);
    expect(bucket.tryRemove()).toBe(false);
  });

  it("never refills beyond capacity", () => {
    const clock = new FakeClock();
    const bucket = new TokenBucket(5, 100, clock);
    clock.advance(10_000);
    expect(bucket.available).toBe(5);
  });

  it("does not partially spend when short", () => {
    const clock = new FakeClock();
    const bucket = new TokenBucket(2, 1, clock);
    expect(bucket.tryRemove(3)).toBe(false);
    expect(bucket.available).toBe(2);
  });
});
