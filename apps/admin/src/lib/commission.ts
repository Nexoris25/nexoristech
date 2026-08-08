/**
 * The commission engine (PRD Part Three). A commissioned employee earns a percentage between 3% and 20%,
 * applied either to their salary or to the value of the deals they closed in the period. Commission-only
 * sales reps are the reason the "closed deal" basis exists: they may carry little or no salary, and their
 * pay is what they sold. Commission is earned pay, so Payroll adds it to gross before PAYE is computed.
 */

export const COMMISSION_MIN_RATE = 3;
export const COMMISSION_MAX_RATE = 20;

/** What the commission rate is applied to. */
export type CommissionBasis = "salary" | "closed_deal";

export const COMMISSION_BASIS_LABEL: Record<CommissionBasis, string> = {
  salary: "Employee salary",
  closed_deal: "Closed deal value",
};

export function isCommissionBasis(value: string): value is CommissionBasis {
  return value === "salary" || value === "closed_deal";
}

/** Clamp a rate into the policy range, or null when the employee is not on commission. */
export function normaliseRate(rate: number | null | undefined): number | null {
  if (rate == null || Number.isNaN(rate)) return null;
  return Math.min(COMMISSION_MAX_RATE, Math.max(COMMISSION_MIN_RATE, rate));
}

export interface CommissionInput {
  eligible: boolean;
  rate: number | null;
  basis: CommissionBasis | null;
  /** Monthly gross salary, used when the basis is "salary". */
  monthlySalary: number;
  /** Total value of deals this employee closed in the period, used when the basis is "closed_deal". */
  closedDealValue: number;
}

export interface CommissionResult {
  amount: number;
  rate: number | null;
  basis: CommissionBasis | null;
  /** The figure the rate was applied to, so a payslip can show the working. */
  base: number;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

/** Commission earned for one period. Returns zero (with no rate) when the employee is not commissioned. */
export function computeCommission(input: CommissionInput): CommissionResult {
  const rate = input.eligible ? normaliseRate(input.rate) : null;
  if (rate == null || input.basis == null) {
    return { amount: 0, rate: null, basis: null, base: 0 };
  }
  const base = input.basis === "salary" ? input.monthlySalary : input.closedDealValue;
  return { amount: round2((Math.max(0, base) * rate) / 100), rate, basis: input.basis, base: Math.max(0, base) };
}
