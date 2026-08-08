/**
 * Salary bands against the Nigeria Tax Act 2025 table.
 *
 * The point of these is the distinction the feature exists to protect: bands are on chargeable income,
 * not gross, and the band rate is marginal, not effective. Getting either wrong produces a payroll that
 * looks compliant and is not.
 */
import { describe, it, expect } from "vitest";
import { SALARY_BANDS, bandForChargeable, bandById, checkBand, bandCeilingTax } from "./salary-bands.js";
import { payeAnnual } from "./tax-engine.js";

describe("SALARY_BANDS", () => {
  it("has one band per rate in the Act's table", () => {
    expect(SALARY_BANDS).toHaveLength(6);
    expect(SALARY_BANDS.map((b) => b.rate)).toEqual([0, 15, 18, 21, 23, 25]);
  });

  it("runs from zero and is continuous, so no income falls between two bands", () => {
    expect(SALARY_BANDS[0]!.from).toBe(0);
    for (let i = 1; i < SALARY_BANDS.length; i++) {
      expect(SALARY_BANDS[i]!.from).toBe(SALARY_BANDS[i - 1]!.to);
    }
    expect(SALARY_BANDS[SALARY_BANDS.length - 1]!.to).toBeNull();
  });
});

describe("bandForChargeable", () => {
  it("puts the first ₦800,000 in the nil band", () => {
    expect(bandForChargeable(0).rate).toBe(0);
    expect(bandForChargeable(799_999).rate).toBe(0);
  });

  it("moves to 15% exactly at the boundary, not before it", () => {
    expect(bandForChargeable(800_000).rate).toBe(15);
  });

  it("places each remaining boundary in the band that starts there", () => {
    expect(bandForChargeable(3_000_000).rate).toBe(18);
    expect(bandForChargeable(12_000_000).rate).toBe(21);
    expect(bandForChargeable(25_000_000).rate).toBe(23);
    expect(bandForChargeable(50_000_000).rate).toBe(25);
  });

  it("keeps a very large income in the top band", () => {
    expect(bandForChargeable(900_000_000).rate).toBe(25);
  });
});

describe("checkBand", () => {
  it("flags a selection that disagrees with the employee's own figures", () => {
    // ₦500,000 a month is ₦6m a year, which is the 18% band, not the 15% one.
    const r = checkBand({ grossMonthly: 500_000, chargeableAnnual: 6_000_000, payeMonthly: 80_000, selectedBandId: "band-2" });
    expect(r.actual.rate).toBe(18);
    expect(r.mismatch).toBe(true);
  });

  it("does not flag a selection that agrees", () => {
    const r = checkBand({ grossMonthly: 500_000, chargeableAnnual: 6_000_000, payeMonthly: 80_000, selectedBandId: "band-3" });
    expect(r.mismatch).toBe(false);
  });

  it("does not flag anything when HR has not chosen a band", () => {
    const r = checkBand({ grossMonthly: 500_000, chargeableAnnual: 6_000_000, payeMonthly: 80_000 });
    expect(r.mismatch).toBe(false);
    expect(r.selected).toBeUndefined();
  });

  it("reports the effective rate well below the marginal rate, which is the whole confusion", () => {
    const r = checkBand({ grossMonthly: 500_000, chargeableAnnual: 6_000_000, payeMonthly: 80_000 });
    expect(r.marginalRate).toBe(18);
    expect(r.effectiveRate).toBeCloseTo(16, 0);
    expect(r.effectiveRate).toBeLessThan(r.marginalRate);
  });

  it("marks anyone at or below the minimum wage exempt whatever band is chosen", () => {
    const r = checkBand({ grossMonthly: 70_000, chargeableAnnual: 0, payeMonthly: 0, selectedBandId: "band-4" });
    expect(r.exempt).toBe(true);
  });

  it("does not mark a zero salary exempt, because there is no employee to exempt", () => {
    expect(checkBand({ grossMonthly: 0, chargeableAnnual: 0, payeMonthly: 0 }).exempt).toBe(false);
  });
});

describe("bandCeilingTax", () => {
  it("agrees with the progressive engine at each ceiling, so the list cannot drift from the payroll", () => {
    for (const band of SALARY_BANDS) {
      if (band.to === null) continue;
      expect(bandCeilingTax(band)).toBe(payeAnnual(band.to));
    }
  });

  it("charges nothing at the top of the nil band", () => {
    expect(bandCeilingTax(SALARY_BANDS[0]!)).toBe(0);
  });

  it("has no ceiling for the top band", () => {
    expect(bandCeilingTax(SALARY_BANDS[SALARY_BANDS.length - 1]!)).toBeNull();
  });
});

describe("bandById", () => {
  it("finds a band by its stored id", () => {
    expect(bandById("band-1")?.rate).toBe(0);
  });

  it("returns nothing for an unknown or absent id rather than guessing a band", () => {
    expect(bandById("band-99")).toBeUndefined();
    expect(bandById(null)).toBeUndefined();
  });
});
