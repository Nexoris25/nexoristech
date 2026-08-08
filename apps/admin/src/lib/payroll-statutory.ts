/**
 * The full statutory picture for one employee, from a single gross figure (PRD 8; Nigeria Tax Act 2025,
 * effective 1 January 2026; Pension Reform Act 2014; Employee Compensation Act 2010; ITF Act; NHF Act).
 *
 * HR enters gross pay and ticks which employee deductions apply. Everything else is derived and shown
 * read-only, because those are employer obligations the employee never sees on a payslip.
 *
 * Two things are worth stating plainly, because they are the usual source of payroll errors:
 *
 *  1. NSITF and ITF are EMPLOYER costs. They are never deducted from an employee. They increase what the
 *     company pays, not what the employee loses.
 *  2. "State IRS" is not a deduction. It is the authority PAYE is remitted to. PAYE is withheld once and
 *     paid to the employee's state of residence; showing it twice would double-count the employee's tax.
 *
 * Under the Nigeria Tax Act 2025, NHF is voluntary for private-sector employees, so it is a per-employee
 * toggle rather than an automatic deduction.
 */
import { computePaye } from "./tax-engine.js";

/** Statutory rates. Held here with their source so a rate change is a one-line, auditable edit. */
export const STATUTORY_RATES = {
  /** Pension Reform Act 2014: employee 8%, employer 10% of monthly emolument. */
  pensionEmployee: 8,
  pensionEmployer: 10,
  /** NHF Act: 2.5% of monthly basic. Voluntary for private-sector staff under the NTA 2025. */
  nhf: 2.5,
  /** Employee Compensation Act 2010: 1% of monthly payroll, employer only. */
  nsitf: 1,
  /** ITF Act: 1% of annual payroll, employer only, for 5+ employees or turnover from ₦50m. */
  itf: 1,
} as const;

export interface StatutoryInput {
  /** Monthly gross pay, as entered by HR. */
  gross: number;
  /** Which deductions apply to this employee. */
  payeApplies: boolean;
  pensionApplies: boolean;
  /** NHF is voluntary for private-sector employees under the NTA 2025. */
  nhfApplies: boolean;
  /** Declared annual rent, for the Rent Relief Allowance that replaced the CRA. */
  annualRent?: number;
  /** Whether the employer is within ITF scope (5+ employees, or turnover from ₦50m). */
  itfApplies?: boolean;
}

export interface StatutoryResult {
  gross: number;
  /** Deducted from the employee, shown on the payslip. */
  employee: { paye: number; pension: number; nhf: number; total: number };
  /** Paid by the company on top of gross. Never deducted from the employee. */
  employer: { pension: number; nsitf: number; itf: number; total: number };
  /** What the employee actually receives. */
  netPay: number;
  /** Gross plus every employer obligation: the true cost of employing this person. */
  companyCost: number;
  /** Working shown for the payslip and for the remittance schedule. */
  detail: { chargeableAnnual: number; rentRelief: number; payeAnnual: number };
}

const round2 = (n: number): number => Math.round(n * 100) / 100;
const pctOf = (amount: number, rate: number): number => round2((amount * rate) / 100);

/**
 * Compute every statutory figure for one employee-month.
 *
 * The pension and NHF bases are the gross figure. The Pension Reform Act sets the base as monthly
 * emolument, being at least basic + housing + transport; using gross satisfies that in every case and can
 * never under-contribute. NHF is stated on basic, so where only gross is captured this is the
 * conservative reading; if a basic/housing/transport split is later recorded, pass it through instead.
 */
export function computeStatutory(input: StatutoryInput): StatutoryResult {
  const gross = Math.max(0, input.gross);

  const pension = input.pensionApplies ? pctOf(gross, STATUTORY_RATES.pensionEmployee) : 0;
  const nhf = input.nhfApplies ? pctOf(gross, STATUTORY_RATES.nhf) : 0;

  // PAYE runs on the shared Tax Engine so the 2026 bands and Rent Relief stay in one place. Pension and
  // NHF are deducted before tax, which the engine already applies.
  const paye = input.payeApplies
    ? computePaye({
        basic: gross, housing: 0, transport: 0, otherAllowances: 0,
        ...(input.annualRent === undefined ? {} : { annualRent: input.annualRent }),
        pensionEnabled: input.pensionApplies,
        nhfEnabled: input.nhfApplies,
        pensionEmployeeRate: STATUTORY_RATES.pensionEmployee,
        nhfRate: STATUTORY_RATES.nhf,
      })
    : null;

  const payeMonthly = paye?.payeMonthly ?? 0;
  const employeeTotal = round2(payeMonthly + pension + nhf);

  const employerPension = input.pensionApplies ? pctOf(gross, STATUTORY_RATES.pensionEmployer) : 0;
  const nsitf = pctOf(gross, STATUTORY_RATES.nsitf);
  const itf = input.itfApplies === false ? 0 : pctOf(gross, STATUTORY_RATES.itf);
  const employerTotal = round2(employerPension + nsitf + itf);

  return {
    gross,
    employee: { paye: payeMonthly, pension, nhf, total: employeeTotal },
    employer: { pension: employerPension, nsitf, itf, total: employerTotal },
    netPay: round2(gross - employeeTotal),
    companyCost: round2(gross + employerTotal),
    detail: {
      chargeableAnnual: paye?.chargeableAnnual ?? 0,
      rentRelief: paye?.rentRelief ?? 0,
      payeAnnual: round2(payeMonthly * 12),
    },
  };
}

/** Where each statutory amount is remitted, and by when. Drives the remittance schedule. */
export const REMITTANCE_AUTHORITIES = [
  { key: "paye", label: "PAYE", authority: "State Internal Revenue Service", due: "10th of the following month", paidBy: "employee" },
  { key: "pension", label: "Pension (employee + employer)", authority: "Pension Fund Administrator", due: "Within 7 working days of payday", paidBy: "both" },
  { key: "nhf", label: "National Housing Fund", authority: "Federal Mortgage Bank of Nigeria", due: "Within 30 days of deduction", paidBy: "employee" },
  { key: "nsitf", label: "Employee Compensation (NSITF)", authority: "Nigeria Social Insurance Trust Fund", due: "Within 30 days of payday", paidBy: "employer" },
  { key: "itf", label: "Industrial Training Fund", authority: "Industrial Training Fund", due: "31 March, on the prior year's payroll", paidBy: "employer" },
] as const;
