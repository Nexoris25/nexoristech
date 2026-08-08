/**
 * Statutory payroll conformance tests. These pin who pays what, which is the part of Nigerian payroll
 * most often got wrong: NSITF and ITF are employer costs and must never reduce an employee's pay.
 */
import { describe, it, expect } from "vitest";
import { computeStatutory, STATUTORY_RATES } from "./payroll-statutory.js";

const base = { gross: 1_000_000, payeApplies: true, pensionApplies: true, nhfApplies: false };

describe("statutory rates", () => {
  it("are the current Nigerian rates", () => {
    expect(STATUTORY_RATES).toEqual({ pensionEmployee: 8, pensionEmployer: 10, nhf: 2.5, nsitf: 1, itf: 1 });
  });
});

describe("employee deductions", () => {
  it("takes 8% pension from the employee", () => {
    expect(computeStatutory(base).employee.pension).toBe(80_000);
  });

  it("takes NHF only when the employee has opted in (voluntary under the NTA 2025)", () => {
    expect(computeStatutory(base).employee.nhf).toBe(0);
    expect(computeStatutory({ ...base, nhfApplies: true }).employee.nhf).toBe(25_000);
  });

  it("charges no PAYE when PAYE does not apply", () => {
    const r = computeStatutory({ ...base, payeApplies: false });
    expect(r.employee.paye).toBe(0);
    expect(r.employee.total).toBe(80_000); // pension only
  });

  it("deducts pension and NHF before tax", () => {
    // 12m gross, less pension 960k and NHF 300k = 10.74m chargeable (no rent declared).
    const r = computeStatutory({ ...base, nhfApplies: true });
    expect(r.detail.chargeableAnnual).toBe(10_740_000);
  });

  it("applies Rent Relief, capped at 500,000", () => {
    const r = computeStatutory({ ...base, annualRent: 3_000_000 });
    expect(r.detail.rentRelief).toBe(500_000);
    // 12m less pension 960k less rent relief 500k = 10.54m
    expect(r.detail.chargeableAnnual).toBe(10_540_000);
  });
});

describe("employer costs are never deducted from the employee", () => {
  it("charges NSITF and ITF to the employer only", () => {
    const r = computeStatutory(base);
    expect(r.employer.nsitf).toBe(10_000); // 1% of gross
    expect(r.employer.itf).toBe(10_000); // 1% of gross
    // The employee's deductions contain neither.
    expect(r.employee.total).toBe(r.employee.paye + r.employee.pension + r.employee.nhf);
  });

  it("adds 10% employer pension on top of gross", () => {
    expect(computeStatutory(base).employer.pension).toBe(100_000);
  });

  it("omits ITF when the employer is out of scope", () => {
    expect(computeStatutory({ ...base, itfApplies: false }).employer.itf).toBe(0);
  });
});

describe("totals", () => {
  it("nets pay down by employee deductions only", () => {
    const r = computeStatutory(base);
    expect(r.netPay).toBe(r.gross - r.employee.total);
    expect(r.netPay).toBeGreaterThan(0);
  });

  it("company cost is gross plus every employer obligation", () => {
    const r = computeStatutory(base);
    // 1,000,000 + 100,000 pension + 10,000 NSITF + 10,000 ITF
    expect(r.companyCost).toBe(1_120_000);
    expect(r.companyCost).toBe(r.gross + r.employer.total);
  });

  it("company cost always exceeds gross, and net pay never does", () => {
    const r = computeStatutory({ ...base, nhfApplies: true, annualRent: 1_200_000 });
    expect(r.companyCost).toBeGreaterThan(r.gross);
    expect(r.netPay).toBeLessThan(r.gross);
  });

  it("handles a zero gross without producing negative money", () => {
    const r = computeStatutory({ ...base, gross: 0 });
    expect(r.netPay).toBe(0);
    expect(r.companyCost).toBe(0);
    expect(r.employee.total).toBe(0);
  });
});
