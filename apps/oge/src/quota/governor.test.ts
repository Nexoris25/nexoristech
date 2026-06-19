import { describe, it, expect } from "vitest";
import { QuotaGovernor, INPUT_CHAR_CAP } from "./governor.js";
import type { Clock } from "./token-bucket.js";

class FakeClock implements Clock {
  constructor(private t = 0) {}
  now(): number {
    return this.t;
  }
  advance(ms: number): void {
    this.t += ms;
  }
}

describe("QuotaGovernor.admitChat", () => {
  it("rejects input over the character cap", () => {
    const gov = new QuotaGovernor({ clock: new FakeClock() });
    const decision = gov.admitChat({
      sessionId: "s",
      ip: "1.1.1.1",
      inputLength: INPUT_CHAR_CAP + 1,
    });
    expect(decision).toEqual({ allowed: false, reason: "input-too-long" });
  });

  it("allows requests under the per-session limit and blocks the one over", () => {
    const gov = new QuotaGovernor({
      perSessionPerMinute: 2,
      perIpPerMinute: 100,
      clock: new FakeClock(),
    });
    const req = { sessionId: "s", ip: "1.1.1.1", inputLength: 10 };
    expect(gov.admitChat(req).allowed).toBe(true);
    expect(gov.admitChat(req).allowed).toBe(true);
    expect(gov.admitChat(req)).toEqual({ allowed: false, reason: "session-rate" });
  });

  it("enforces the per-IP limit across different sessions", () => {
    const gov = new QuotaGovernor({
      perSessionPerMinute: 100,
      perIpPerMinute: 2,
      clock: new FakeClock(),
    });
    const ip = "9.9.9.9";
    expect(gov.admitChat({ sessionId: "a", ip, inputLength: 1 }).allowed).toBe(true);
    expect(gov.admitChat({ sessionId: "b", ip, inputLength: 1 }).allowed).toBe(true);
    expect(gov.admitChat({ sessionId: "c", ip, inputLength: 1 })).toEqual({
      allowed: false,
      reason: "ip-rate",
    });
  });

  it("resets the window after a minute passes", () => {
    const clock = new FakeClock();
    const gov = new QuotaGovernor({
      perSessionPerMinute: 1,
      perIpPerMinute: 100,
      clock,
    });
    const req = { sessionId: "s", ip: "1.1.1.1", inputLength: 1 };
    expect(gov.admitChat(req).allowed).toBe(true);
    expect(gov.admitChat(req).allowed).toBe(false);
    clock.advance(60_000);
    expect(gov.admitChat(req).allowed).toBe(true);
  });
});

describe("QuotaGovernor provider buckets", () => {
  it("spends provider tokens and refuses when empty", () => {
    const gov = new QuotaGovernor({
      providerCapacity: 2,
      providerRefillPerSecond: 0,
      clock: new FakeClock(),
    });
    expect(gov.tryProviderCall("gemini")).toBe(true);
    expect(gov.tryProviderCall("gemini")).toBe(true);
    expect(gov.tryProviderCall("gemini")).toBe(false);
    // A different provider has its own bucket.
    expect(gov.tryProviderCall("mistral")).toBe(true);
  });

  it("defers batch work once a provider nears its interactive reserve", () => {
    const gov = new QuotaGovernor({
      providerCapacity: 5,
      providerRefillPerSecond: 0,
      interactiveReserve: 3,
      clock: new FakeClock(),
    });
    expect(gov.shouldDeferBatch("groq")).toBe(false); // 5 available > 3
    gov.tryProviderCall("groq"); // 4
    expect(gov.shouldDeferBatch("groq")).toBe(false); // 4 > 3
    gov.tryProviderCall("groq"); // 3
    expect(gov.shouldDeferBatch("groq")).toBe(true); // 3 <= 3
  });
});
