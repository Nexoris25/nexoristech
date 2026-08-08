/**
 * Payroll computation (PRD 8). Builds one pay-run line per active worker by reading their salary
 * structure and employment type live from HR (8.1, 8.2) and applying the Tax Engine. Employees run
 * the PAYE regime (PAYE, pension, NHF); Contract/Consultant run the WHT regime (withholding tax
 * only). The two never mix on one worker. Employer-only costs (employer pension, Employees'
 * Compensation) are computed but never appear on the payslip.
 */
import {
  computePaye,
  pensionEmployer,
  withholdingTax,
  employeesCompensation,
} from "./tax-engine.js";

export interface PayrollSettings {
  paye_enabled: boolean;
  pension_enabled: boolean;
  nhf_enabled: boolean;
  wht_enabled: boolean;
  ec_enabled: boolean;
  /** ITF applies to employers with 5+ employees or turnover from ₦50m. Employer cost, never deducted. */
  itf_enabled: boolean;
  pension_employee_rate: number;
  pension_employer_rate: number;
  nhf_rate: number;
  wht_rate: number;
  ec_rate: number;
  itf_rate: number;
}

export interface WorkerInput {
  employee_id: string;
  employee_name: string;
  employment_type: string; // Full-time | Part-time | Contract | Consultant
  basic: number;
  housing: number;
  transport: number;
  other_allowances: number;
  nhf_registered: boolean;
  advance_repayment: number;
}

export interface PayLine {
  employee_id: string;
  employee_name: string;
  regime: "PAYE" | "WHT";
  basic: number;
  housing: number;
  transport: number;
  other_allowances: number;
  gross: number;
  paye: number;
  pension_employee: number;
  nhf: number;
  wht: number;
  voluntary: number;
  advance_repayment: number;
  net: number;
  pension_employer: number;
  ec: number;
  /** Employer-only, like ec. Present on the line so a remittance can be derived from the run alone. */
  itf: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeLine(w: WorkerInput, s: PayrollSettings): PayLine {
  const gross = round2(w.basic + w.housing + w.transport + w.other_allowances);
  const isContractor = w.employment_type === "Contract" || w.employment_type === "Consultant";

  if (isContractor) {
    // WHT regime: withholding tax only, no PAYE, pension, or NHF (PRD 8.2).
    const wht = s.wht_enabled ? withholdingTax(gross, s.wht_rate) : 0;
    const net = round2(gross - wht - w.advance_repayment);
    return {
      employee_id: w.employee_id, employee_name: w.employee_name, regime: "WHT",
      basic: w.basic, housing: w.housing, transport: w.transport, other_allowances: w.other_allowances,
      gross, paye: 0, pension_employee: 0, nhf: 0, wht, voluntary: 0,
      advance_repayment: w.advance_repayment, net,
      // A contractor is not an employee, so no employer statutory cost arises on their fee.
      pension_employer: 0, ec: 0, itf: 0,
    };
  }

  // PAYE regime.
  const paye = computePaye({
    basic: w.basic, housing: w.housing, transport: w.transport, otherAllowances: w.other_allowances,
    pensionEnabled: s.pension_enabled, nhfEnabled: s.nhf_enabled && w.nhf_registered,
    pensionEmployeeRate: s.pension_employee_rate, nhfRate: s.nhf_rate,
  });
  const payeTax = s.paye_enabled ? paye.payeMonthly : 0;
  const net = round2(gross - payeTax - paye.pensionEmployee - paye.nhf - w.advance_repayment);
  const pensionEmployerCost = s.pension_enabled ? pensionEmployer(w.basic, w.housing, w.transport, s.pension_employer_rate) : 0;
  const ec = s.ec_enabled ? employeesCompensation(gross, s.ec_rate) : 0;
  const itf = s.itf_enabled ? round2((gross * s.itf_rate) / 100) : 0;

  return {
    employee_id: w.employee_id, employee_name: w.employee_name, regime: "PAYE",
    basic: w.basic, housing: w.housing, transport: w.transport, other_allowances: w.other_allowances,
    gross, paye: payeTax, pension_employee: paye.pensionEmployee, nhf: paye.nhf, wht: 0, voluntary: 0,
    advance_repayment: w.advance_repayment, net,
    pension_employer: pensionEmployerCost, ec, itf,
  };
}

export interface RunTotals {
  gross: number;
  deductions: number;
  net: number;
  employer_cost: number;
}

export function totalsOf(lines: PayLine[]): RunTotals {
  const gross = round2(lines.reduce((s, l) => s + l.gross, 0));
  const net = round2(lines.reduce((s, l) => s + l.net, 0));
  const employer_cost = round2(lines.reduce((s, l) => s + l.pension_employer + l.ec + l.itf, 0));
  return { gross, deductions: round2(gross - net), net, employer_cost };
}
