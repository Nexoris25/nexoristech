/**
 * Commission engine tests: the 3%-20% policy range, both bases, and the guard that an employee who is not
 * commission-eligible never earns commission however their record is set.
 */
import { describe, it, expect } from "vitest";
import { computeCommission, normaliseRate, COMMISSION_MIN_RATE, COMMISSION_MAX_RATE } from "./commission.js";

describe("commission rate policy", () => {
  it("runs from 3% to 20%", () => {
    expect(COMMISSION_MIN_RATE).toBe(3);
    expect(COMMISSION_MAX_RATE).toBe(20);
  });

  it("clamps a rate into the policy range", () => {
    expect(normaliseRate(1)).toBe(3);
    expect(normaliseRate(25)).toBe(20);
    expect(normaliseRate(12.5)).toBe(12.5);
    expect(normaliseRate(null)).toBeNull();
  });
});

describe("computeCommission", () => {
  const base = { eligible: true, monthlySalary: 500_000, closedDealValue: 10_000_000 };

  it("applies the rate to salary on the salary basis", () => {
    const r = computeCommission({ ...base, rate: 10, basis: "salary" });
    expect(r.base).toBe(500_000);
    expect(r.amount).toBe(50_000);
  });

  it("applies the rate to closed deal value on the closed deal basis", () => {
    const r = computeCommission({ ...base, rate: 5, basis: "closed_deal" });
    expect(r.base).toBe(10_000_000);
    expect(r.amount).toBe(500_000);
  });

  it("earns nothing when the employee is not commission eligible", () => {
    const r = computeCommission({ ...base, eligible: false, rate: 20, basis: "closed_deal" });
    expect(r.amount).toBe(0);
    expect(r.rate).toBeNull();
  });

  it("earns nothing when no basis is set", () => {
    expect(computeCommission({ ...base, rate: 10, basis: null }).amount).toBe(0);
  });

  it("never pays on a negative base", () => {
    const r = computeCommission({ ...base, closedDealValue: -5_000, rate: 10, basis: "closed_deal" });
    expect(r.amount).toBe(0);
  });

  it("clamps an out-of-policy rate before paying", () => {
    // 30% is above policy: it must be paid at the 20% ceiling, not 30%.
    expect(computeCommission({ ...base, rate: 30, basis: "salary" }).amount).toBe(100_000);
  });
});
