/**
 * Pay run line conformance, focused on who bears what.
 *
 * ITF was missing from this calculation entirely, which understated employer cost by 1% of gross on
 * every run and meant no ITF liability ever reached the remittance schedule. These pin it, and pin that
 * it never reaches an employee's net pay.
 */
import { describe, it, expect } from "vitest";
import { computeLine, totalsOf, type PayrollSettings, type WorkerInput } from "./payroll.js";

const settings: PayrollSettings = {
  paye_enabled: true, pension_enabled: true, nhf_enabled: true, wht_enabled: true, ec_enabled: true, itf_enabled: true,
  pension_employee_rate: 8, pension_employer_rate: 10, nhf_rate: 2.5, wht_rate: 5, ec_rate: 1, itf_rate: 1,
};

const worker: WorkerInput = {
  employee_id: "e1", employee_name: "Test Employee", employment_type: "Full-time",
  basic: 500_000, housing: 300_000, transport: 200_000, other_allowances: 0,
  nhf_registered: false, advance_repayment: 0,
};

describe("ITF", () => {
  it("is 1% of gross, charged to the employer", () => {
    expect(computeLine(worker, settings).itf).toBe(10_000); // 1% of 1,000,000
  });

  it("never reduces net pay", () => {
    const withItf = computeLine(worker, settings);
    const withoutItf = computeLine(worker, { ...settings, itf_enabled: false });
    expect(withItf.net).toBe(withoutItf.net);
    expect(withoutItf.itf).toBe(0);
  });

  it("is omitted when the employer is out of scope", () => {
    expect(computeLine(worker, { ...settings, itf_enabled: false }).itf).toBe(0);
  });

  it("does not arise on a contractor fee, who is not an employee", () => {
    const contractor = computeLine({ ...worker, employment_type: "Consultant" }, settings);
    expect(contractor.regime).toBe("WHT");
    expect(contractor.itf).toBe(0);
    expect(contractor.ec).toBe(0);
    expect(contractor.pension_employer).toBe(0);
  });
});

describe("employer cost", () => {
  it("includes ITF alongside employer pension and NSITF", () => {
    const line = computeLine(worker, settings);
    // 100,000 employer pension + 10,000 NSITF + 10,000 ITF
    expect(totalsOf([line]).employer_cost).toBe(120_000);
  });

  it("drops by exactly the ITF when ITF does not apply", () => {
    const withItf = totalsOf([computeLine(worker, settings)]).employer_cost;
    const withoutItf = totalsOf([computeLine(worker, { ...settings, itf_enabled: false })]).employer_cost;
    expect(withItf - withoutItf).toBe(10_000);
  });

  it("is never part of the employee's deductions", () => {
    const l = computeLine(worker, settings);
    // Net is gross less only what the employee actually bears.
    expect(l.net).toBe(l.gross - l.paye - l.pension_employee - l.nhf - l.advance_repayment);
  });
});
