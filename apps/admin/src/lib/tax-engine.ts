/**
 * The shared Tax Engine (PRD 10.2, 8.4): every piece of Nigerian statutory pay logic in one place,
 * called by Payroll (and later Finance's WHT). The PAYE band table is the Nigeria Tax Act 2025 rate
 * table, effective 1 January 2026, versioned by effective date so a Finance Act amendment changes
 * one file and both modules pick it up. Verify against official Nigeria Revenue Service guidance
 * before the first live run.
 */

/** Nigeria Tax Act 2025 annual PAYE bands (PRD 8.4). Effective 1 Jan 2026. */
export const PAYE_BANDS = [
  { upTo: 800_000, rate: 0 },
  { upTo: 3_000_000, rate: 0.15 },
  { upTo: 12_000_000, rate: 0.18 },
  { upTo: 25_000_000, rate: 0.21 },
  { upTo: 50_000_000, rate: 0.23 },
  { upTo: Infinity, rate: 0.25 },
] as const;

export const TAX_TABLE_EFFECTIVE = "2026-01-01";

/** National minimum wage (monthly). At or below it, no PAYE is due (PRD 8.4). */
export const MINIMUM_WAGE_MONTHLY = 70_000;

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Progressive PAYE on an annual chargeable income, across the bands. */
export function payeAnnual(chargeable: number): number {
  let remaining = Math.max(0, chargeable);
  let prev = 0;
  let tax = 0;
  for (const band of PAYE_BANDS) {
    if (remaining <= 0) break;
    const slice = Math.min(remaining, band.upTo - prev);
    tax += slice * band.rate;
    remaining -= slice;
    prev = band.upTo;
  }
  return round2(tax);
}

export interface PayeInput {
  /** Monthly basic + housing + transport; pension and NHF are computed on these three only. */
  basic: number;
  housing: number;
  transport: number;
  otherAllowances: number;
  /** Declared annual rent, for Rent Relief (the lower of 20% of it or ₦500,000). */
  annualRent?: number;
  pensionEnabled: boolean;
  nhfEnabled: boolean;
  pensionEmployeeRate: number; // percent, e.g. 8
  nhfRate: number; // percent, e.g. 2.5
}

export interface PayeResult {
  grossMonthly: number;
  pensionEmployee: number;
  nhf: number;
  rentRelief: number;
  chargeableAnnual: number;
  payeMonthly: number;
}

/**
 * Monthly PAYE for an employee. Pension (on basic+housing+transport) and NHF (on basic) are
 * deductible before tax; Rent Relief replaces the old Consolidated Relief Allowance; anyone at or
 * below the minimum wage pays no PAYE (PRD 8.4).
 */
export function computePaye(input: PayeInput): PayeResult {
  const pensionBase = input.basic + input.housing + input.transport;
  const grossMonthly = pensionBase + input.otherAllowances;
  const pensionEmployee = input.pensionEnabled ? round2((pensionBase * input.pensionEmployeeRate) / 100) : 0;
  const nhf = input.nhfEnabled ? round2((input.basic * input.nhfRate) / 100) : 0;

  if (grossMonthly <= MINIMUM_WAGE_MONTHLY) {
    return { grossMonthly, pensionEmployee, nhf, rentRelief: 0, chargeableAnnual: 0, payeMonthly: 0 };
  }

  const rentRelief = Math.min(0.2 * (input.annualRent ?? 0), 500_000);
  const annualDeductible = (pensionEmployee + nhf) * 12 + rentRelief;
  const chargeableAnnual = Math.max(0, grossMonthly * 12 - annualDeductible);
  const payeMonthly = round2(payeAnnual(chargeableAnnual) / 12);

  return { grossMonthly, pensionEmployee, nhf, rentRelief, chargeableAnnual, payeMonthly };
}

/** Pension employer contribution (PRD 8.3), an employer cost, on basic+housing+transport. */
export function pensionEmployer(basic: number, housing: number, transport: number, rate: number): number {
  return round2(((basic + housing + transport) * rate) / 100);
}

/** Withholding tax on a contractor's gross pay (PRD 8.2, 8.3). */
export function withholdingTax(gross: number, rate: number): number {
  return round2((gross * rate) / 100);
}

/** Employees' Compensation contribution (NSITF), 1% of payroll, employer-only (PRD 8.3). */
export function employeesCompensation(gross: number, rate: number): number {
  return round2((gross * rate) / 100);
}
