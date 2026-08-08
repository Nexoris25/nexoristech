/**
 * Tax Engine conformance tests against the Nigeria Tax Act 2025 (effective 1 January 2026). These pin the
 * statutory band table, the Rent Relief Allowance that replaced the Consolidated Relief Allowance, and the
 * order of deductions, so a future edit cannot quietly change what an employee is taxed.
 */
import { describe, it, expect } from "vitest";
import { payeAnnual, computePaye, PAYE_BANDS, TAX_TABLE_EFFECTIVE } from "./tax-engine.js";

describe("Nigeria Tax Act 2025 band table", () => {
  it("is the six statutory bands, effective 1 January 2026", () => {
    expect(TAX_TABLE_EFFECTIVE).toBe("2026-01-01");
    expect(PAYE_BANDS.map((b) => [b.upTo, b.rate])).toEqual([
      [800_000, 0], [3_000_000, 0.15], [12_000_000, 0.18],
      [25_000_000, 0.21], [50_000_000, 0.23], [Infinity, 0.25],
    ]);
  });

  it("charges nothing on the first 800,000", () => {
    expect(payeAnnual(0)).toBe(0);
    expect(payeAnnual(800_000)).toBe(0);
  });

  it("charges 15% on the next 2.2m", () => {
    // 800k free, then 2.2m at 15% = 330,000
    expect(payeAnnual(3_000_000)).toBe(330_000);
    expect(payeAnnual(1_800_000)).toBe(150_000); // 1m into the 15% band
  });

  it("charges 18% on the next 9m", () => {
    // 330,000 + 9,000,000 * 18% = 1,950,000
    expect(payeAnnual(12_000_000)).toBe(1_950_000);
  });

  it("charges 21%, 23% and 25% on the upper bands", () => {
    // 1,950,000 + 13m * 21% = 4,680,000
    expect(payeAnnual(25_000_000)).toBe(4_680_000);
    // 4,680,000 + 25m * 23% = 10,430,000
    expect(payeAnnual(50_000_000)).toBe(10_430_000);
    // 10,430,000 + 10m * 25% = 12,930,000
    expect(payeAnnual(60_000_000)).toBe(12_930_000);
  });
});

describe("Rent Relief Allowance (replaces the Consolidated Relief Allowance)", () => {
  const base = {
    basic: 500_000, housing: 250_000, transport: 150_000, otherAllowances: 100_000,
    pensionEnabled: true, nhfEnabled: true, pensionEmployeeRate: 8, nhfRate: 2.5,
  };

  it("is 20% of annual rent, capped at 500,000", () => {
    expect(computePaye({ ...base, annualRent: 3_000_000 }).rentRelief).toBe(500_000); // 600k capped
    expect(computePaye({ ...base, annualRent: 1_000_000 }).rentRelief).toBe(200_000); // under the cap
    expect(computePaye({ ...base, annualRent: 0 }).rentRelief).toBe(0);
  });

  it("deducts pension and NHF before tax, then rent relief", () => {
    const r = computePaye({ ...base, annualRent: 3_000_000 });
    expect(r.grossMonthly).toBe(1_000_000);
    expect(r.pensionEmployee).toBe(72_000); // 8% of basic+housing+transport
    expect(r.nhf).toBe(12_500); // 2.5% of basic
    // 12,000,000 - ((72,000 + 12,500) * 12) - 500,000 = 10,486,000
    expect(r.chargeableAnnual).toBe(10_486_000);
    expect(r.payeMonthly).toBeCloseTo(139_790, 0);
  });

  it("charges no PAYE at or below the national minimum wage", () => {
    const r = computePaye({ ...base, basic: 40_000, housing: 15_000, transport: 10_000, otherAllowances: 5_000 });
    expect(r.grossMonthly).toBe(70_000);
    expect(r.payeMonthly).toBe(0);
  });
});
