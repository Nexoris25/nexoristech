/**
 * The redirect rules, exercised directly.
 *
 * Every case here is something the CMS form could already produce and nothing honoured: a pattern
 * rule that matched exactly, "Match Case" that ignored case, "Exact Match" on slashes that did not,
 * an expiry date that expired nothing, and 307 and 410 both served as a permanent 301.
 */
import { describe, it, expect } from "vitest";
import {
  compilePattern,
  isLive,
  matchRedirect,
  normalisePath,
  resolveDestination,
  statusFor,
  type RedirectRule,
} from "./redirect-match.js";

const rule = (over: Partial<RedirectRule> = {}): RedirectRule => ({
  id: "11111111-1111-4111-8111-111111111111",
  source: "/old/",
  destination: "/new/",
  type: "301",
  pattern: "Exact match",
  caseSensitive: false,
  exactSlash: false,
  ...over,
});

describe("normalisePath", () => {
  it("gives every path one leading slash", () => {
    expect(normalisePath("old-page/")).toBe("/old-page");
    expect(normalisePath("/old-page/")).toBe("/old-page");
  });

  it("collapses a doubled leading slash", () => {
    // The real rule that never fired was stored as "//web-development/".
    expect(normalisePath("//web-development/")).toBe("/web-development");
  });

  it("keeps the trailing slash when the rule asks for an exact match", () => {
    expect(normalisePath("/old-page/", true)).toBe("/old-page/");
    expect(normalisePath("/old-page", true)).toBe("/old-page");
  });

  it("never reduces the root to an empty string", () => {
    expect(normalisePath("/")).toBe("/");
    expect(normalisePath("")).toBe("/");
  });
});

describe("statusFor", () => {
  it("serves each type as itself", () => {
    // All four used to collapse to 301: `permanent: type !== "302"`.
    expect(statusFor("301")).toBe(301);
    expect(statusFor("302")).toBe(302);
    expect(statusFor("307")).toBe(307);
    expect(statusFor("410")).toBe(410);
  });
});

describe("matchRedirect", () => {
  it("matches a path however either side wrote the slashes", () => {
    const rules = [rule({ source: "web-development/" })];
    expect(matchRedirect("/web-development/", rules)?.destination).toBe("/new/");
    expect(matchRedirect("/web-development", rules)?.destination).toBe("/new/");
  });

  it("ignores case by default and respects Match Case", () => {
    expect(matchRedirect("/OLD/", [rule()])).not.toBeNull();
    expect(matchRedirect("/OLD/", [rule({ caseSensitive: true })])).toBeNull();
  });

  it("distinguishes the trailing slash when slash handling is Exact Match", () => {
    const rules = [rule({ source: "/old/", exactSlash: true })];
    expect(matchRedirect("/old/", rules)).not.toBeNull();
    expect(matchRedirect("/old", rules)).toBeNull();
  });

  it("matches a regular expression and substitutes its capture groups", () => {
    const rules = [rule({
      pattern: "Pattern match (RegEx)",
      source: "^/blog/(.+)$",
      destination: "/insights/$1/",
    })];
    expect(matchRedirect("/blog/hello-world", rules)?.destination).toBe("/insights/hello-world/");
  });

  it("prefers an exact rule over a pattern that also matches", () => {
    const rules = [
      rule({ pattern: "Pattern match (RegEx)", source: "^/a.*$", destination: "/from-pattern/" }),
      rule({ source: "/about/", destination: "/from-exact/" }),
    ];
    expect(matchRedirect("/about/", rules)?.destination).toBe("/from-exact/");
  });

  it("skips a pattern that does not compile instead of failing the request", () => {
    const rules = [
      rule({ pattern: "Pattern match (RegEx)", source: "([unclosed", destination: "/x/" }),
      rule({ source: "/old/", destination: "/good/" }),
    ];
    expect(matchRedirect("/old/", rules)?.destination).toBe("/good/");
  });

  it("returns null when nothing matches", () => {
    expect(matchRedirect("/untouched/", [rule()])).toBeNull();
  });
});

describe("compilePattern", () => {
  it("refuses an over-long expression", () => {
    expect(compilePattern(rule({ pattern: "Pattern match (RegEx)", source: "a".repeat(301) }))).toBeNull();
  });

  it("compiles case-insensitively unless the rule says otherwise", () => {
    expect(compilePattern(rule({ pattern: "Pattern match (RegEx)", source: "^/x$" }))?.flags).toBe("i");
    expect(compilePattern(rule({ pattern: "Pattern match (RegEx)", source: "^/x$", caseSensitive: true }))?.flags).toBe("");
  });
});

describe("resolveDestination", () => {
  it("keeps an absolute URL, so a redirect can leave the site", () => {
    expect(resolveDestination("https://example.com/x", "https://nexoristech.com/old/"))
      .toBe("https://example.com/x");
  });

  it("resolves a path against the request", () => {
    expect(resolveDestination("/new/", "https://nexoristech.com/old/"))
      .toBe("https://nexoristech.com/new/");
  });
});

describe("isLive", () => {
  const on = (iso: string): Date => new Date(`${iso}T12:00:00.000Z`);

  it("is live with no expiry set", () => {
    expect(isLive({ expiryDate: null })).toBe(true);
  });

  it("still works on the day it expires, and stops the day after", () => {
    expect(isLive({ expiryDate: "2026-09-10" }, on("2026-09-10"))).toBe(true);
    expect(isLive({ expiryDate: "2026-09-10" }, on("2026-09-11"))).toBe(false);
  });

  it("keeps the rule when the date cannot be read, rather than silently dropping it", () => {
    expect(isLive({ expiryDate: "not-a-date" })).toBe(true);
    expect(isLive({ startDate: "not-a-date" })).toBe(true);
  });

  it("is not live before its start date, and is from that day on", () => {
    expect(isLive({ startDate: "2026-09-10" }, on("2026-09-09"))).toBe(false);
    expect(isLive({ startDate: "2026-09-10" }, on("2026-09-10"))).toBe(true);
  });

  it("honours both ends of a window", () => {
    const window = { startDate: "2026-09-01", expiryDate: "2026-09-30" };
    expect(isLive(window, on("2026-08-31"))).toBe(false);
    expect(isLive(window, on("2026-09-15"))).toBe(true);
    expect(isLive(window, on("2026-10-01"))).toBe(false);
  });
});
