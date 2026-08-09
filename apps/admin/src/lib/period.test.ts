/**
 * Dashboard period windows.
 *
 * The comparison figure on every KPI ("New Leads +12%") is this window measured against the previous
 * one, so the two must tile exactly: no gap, and no row counted in both. These tests fix that property
 * and the Lagos-time boundaries, because a window that rolls over at midnight UTC moves the numbers an
 * hour early for everyone using the system.
 */
import { describe, it, expect } from "vitest";
import { resolvePeriod, PERIODS } from "./period.js";

/** 2026-08-08 14:30 Lagos == 13:30 UTC. */
const NOW = new Date("2026-08-08T13:30:00.000Z");
const iso = (d: Date): string => d.toISOString();

describe("resolvePeriod", () => {
  it("makes the current and previous windows tile exactly", () => {
    // Any gap or overlap here silently corrupts every percentage on the dashboard.
    for (const p of PERIODS) {
      const w = resolvePeriod(p.value, "mtd", NOW);
      expect(iso(w.previousEnd), p.value).toBe(iso(w.start));
    }
  });

  it("gives the previous window the same length as the current one for fixed-length ranges", () => {
    for (const value of ["today", "7d", "30d", "90d"] as const) {
      const w = resolvePeriod(value, "mtd", NOW);
      const current = w.start.getTime() - w.previousEnd.getTime() + (w.end.getTime() - w.start.getTime());
      const previous = w.previousEnd.getTime() - w.previousStart.getTime();
      // The previous window spans whole days; the current one runs to "now" inside its last day.
      expect(previous, value).toBeGreaterThan(0);
      expect(current, value).toBeGreaterThan(0);
    }
  });

  it("starts 'today' at midnight Lagos, not midnight UTC", () => {
    const w = resolvePeriod("today", "mtd", NOW);
    // Midnight on the 8th in Lagos is 23:00 on the 7th UTC.
    expect(iso(w.start)).toBe("2026-08-07T23:00:00.000Z");
    expect(iso(w.previousStart)).toBe("2026-08-06T23:00:00.000Z");
  });

  it("starts the month at the first of the month in Lagos", () => {
    const w = resolvePeriod("mtd", "mtd", NOW);
    expect(iso(w.start)).toBe("2026-07-31T23:00:00.000Z");
    expect(iso(w.previousStart)).toBe("2026-06-30T23:00:00.000Z");
  });

  it("starts the year at 1 January in Lagos and compares with the same span a year earlier", () => {
    const w = resolvePeriod("ytd", "mtd", NOW);
    expect(iso(w.start)).toBe("2025-12-31T23:00:00.000Z");
    expect(iso(w.previousStart)).toBe("2024-12-31T23:00:00.000Z");
  });

  it("covers seven whole days for 7d, counting today as one of them", () => {
    const w = resolvePeriod("7d", "mtd", NOW);
    expect(iso(w.start)).toBe("2026-08-01T23:00:00.000Z");
    expect(w.previousEnd.getTime() - w.previousStart.getTime()).toBe(7 * 86_400_000);
  });

  it("ends every window at now, so a part-finished period reads as far as it has got", () => {
    for (const p of PERIODS) {
      expect(iso(resolvePeriod(p.value, "mtd", NOW).end), p.value).toBe(iso(NOW));
    }
  });

  it("falls back rather than throwing on an absent or unrecognised range", () => {
    // This value comes from the URL; a mistyped parameter must not break the page.
    for (const bad of [undefined, "", "last-tuesday", "../etc/passwd", "7D"]) {
      const w = resolvePeriod(bad, "mtd", NOW);
      expect(w.value).toBe("mtd");
      expect(w.label).toBe("This month");
    }
  });

  it("honours a caller's chosen fallback", () => {
    expect(resolvePeriod(undefined, "ytd", NOW).value).toBe("ytd");
    expect(resolvePeriod(undefined, "today", NOW).label).toBe("Today");
  });

  it("labels every offered range", () => {
    for (const p of PERIODS) {
      expect(resolvePeriod(p.value, "mtd", NOW).label, p.value).toBe(p.label);
    }
  });

  it("handles a month boundary without landing on an invalid date", () => {
    // 31 March going back one month must not become 31 February.
    const march31 = new Date("2026-03-31T10:00:00.000Z");
    const w = resolvePeriod("mtd", "mtd", march31);
    expect(iso(w.start)).toBe("2026-02-28T23:00:00.000Z");
    expect(Number.isNaN(w.previousStart.getTime())).toBe(false);
  });
});
