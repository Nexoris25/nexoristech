/**
 * Classifying database failures.
 *
 * This decides what a signed-in person is told when a screen cannot load, so it has to be right in
 * both directions: a connection failure must be recognised, and an ordinary application error must
 * not be mistaken for one and hidden behind "the database is not responding".
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { isDatabaseUnreachable, rethrowAsUserFacing, DB_UNREACHABLE_MARKER } from "./db-errors.js";

/** A node-postgres style error: an Error carrying a `code`. */
function pgError(code: string, message = "boom"): Error & { code: string } {
  return Object.assign(new Error(message), { code });
}

afterEach(() => vi.restoreAllMocks());

describe("isDatabaseUnreachable", () => {
  it("recognises the failure that was crashing the dashboard", () => {
    expect(isDatabaseUnreachable(pgError("ETIMEDOUT", "connect ETIMEDOUT 10.0.0.1:5432"))).toBe(true);
  });

  it("recognises the other ways a host goes away", () => {
    for (const code of ["ECONNREFUSED", "ECONNRESET", "EHOSTUNREACH", "ENETUNREACH", "ENOTFOUND", "EPIPE"]) {
      expect(isDatabaseUnreachable(pgError(code)), code).toBe(true);
    }
  });

  it("recognises the postgres shutdown and connection SQLSTATEs", () => {
    for (const code of ["57P01", "57P02", "57P03", "53300", "08006", "08001", "08004"]) {
      expect(isDatabaseUnreachable(pgError(code)), code).toBe(true);
    }
  });

  it("recognises the pool's own connect timeout, which carries no code", () => {
    // The exact string node-postgres produces when connectionTimeoutMillis expires, observed against
    // the real unreachable host. It has no `code`, so only the message can identify it.
    expect(isDatabaseUnreachable(new Error("Connection terminated due to connection timeout"))).toBe(true);
    expect(isDatabaseUnreachable(new Error("timeout exceeded when trying to connect"))).toBe(true);
    expect(isDatabaseUnreachable(new Error("Connection terminated unexpectedly"))).toBe(true);
  });

  it("does not claim an outage for an ordinary query error", () => {
    // 42P01 is undefined_table: a bug in our SQL, and reporting it as an outage would bury it.
    expect(isDatabaseUnreachable(pgError("42P01", 'relation "lead" does not exist'))).toBe(false);
    expect(isDatabaseUnreachable(pgError("23505", "duplicate key value"))).toBe(false);
    expect(isDatabaseUnreachable(new Error("Cannot read properties of undefined"))).toBe(false);
  });

  it("is safe on values that are not errors at all", () => {
    for (const v of [null, undefined, "ETIMEDOUT", 42, {}]) {
      expect(isDatabaseUnreachable(v)).toBe(false);
    }
  });
});

describe("rethrowAsUserFacing", () => {
  it("replaces a connection failure with the marker and logs the real cause", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => rethrowAsUserFacing(pgError("ECONNREFUSED", "connect ECONNREFUSED"), "reading staff"))
      .toThrow(DB_UNREACHABLE_MARKER);
    expect(spy).toHaveBeenCalledOnce();
    expect(String(spy.mock.calls[0]?.[0])).toContain("reading staff");
  });

  it("does not put the connection details into the thrown error", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      rethrowAsUserFacing(pgError("ETIMEDOUT", "connect ETIMEDOUT 194.147.95.7:5435"), "x");
      expect.unreachable("should have thrown");
    } catch (e) {
      // The boundary is a client component; anything on the error can reach the browser.
      expect((e as Error).message).toBe(DB_UNREACHABLE_MARKER);
      expect((e as Error).message).not.toContain("194.147");
      expect((e as Error).message).not.toContain("5435");
    }
  });

  it("lets a real application error through unchanged, so bugs stay visible", () => {
    const bug = pgError("42P01", 'relation "lead" does not exist');
    expect(() => rethrowAsUserFacing(bug, "counting leads")).toThrow(bug);
  });
});
