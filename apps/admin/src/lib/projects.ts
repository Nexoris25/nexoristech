/**
 * Projects, and the arithmetic that turns a percentage of one into an invoice amount.
 *
 * Money is Decimal throughout, never a float, for the reason `fiscal/tax-engine.ts` sets out at
 * length: rounding after every step hides drift instead of removing it. A percentage of a contract
 * value is rounded exactly once, at the point it becomes an amount somebody will be asked to pay.
 *
 * Nothing here decides tax. It produces the amount a line is worth; `calculateTax` decides what VAT
 * that attracts, if any.
 */
import Decimal from "decimal.js";

export const PROJECT_STATUSES = [
  "Planned",
  "Active",
  "OnHold",
  "Completed",
  "Cancelled",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  Planned: "Planned",
  Active: "Active",
  OnHold: "On Hold",
  Completed: "Completed",
  Cancelled: "Cancelled",
};

export const PROJECT_STATUS_STYLE: Record<ProjectStatus, string> = {
  Planned: "bg-slate-100 text-slate-600",
  Active: "bg-[#EEEBFC] text-[#543CDA]",
  OnHold: "bg-[#FEF3C7] text-[#B45309]",
  Completed: "bg-[#DCFCE7] text-[#15803D]",
  Cancelled: "bg-slate-100 text-slate-500",
};

export const MILESTONE_STATUSES = ["Pending", "InProgress", "Done"] as const;
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

export const MILESTONE_STATUS_LABEL: Record<MilestoneStatus, string> = {
  Pending: "Pending",
  InProgress: "In Progress",
  Done: "Done",
};

/** Money as the database stores it: 2 places, half-up, matching NUMERIC(16,2). */
const money = (d: Decimal): string =>
  d.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);

/** A percentage as the database stores it: 3 places, matching NUMERIC(6,3). */
const percent = (d: Decimal): string =>
  d.toDecimalPlaces(3, Decimal.ROUND_HALF_UP).toFixed(3);

/**
 * Parse a number that arrived from a form or from NUMERIC, without ever touching a float.
 *
 * Returns null rather than zero for anything unusable, because a blank percentage field and a
 * deliberate zero are different answers and only one of them should price an invoice.
 */
export function decimalOrNull(value: unknown): Decimal | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim().replace(/,/g, "");
  if (text.length === 0) return null;
  try {
    const d = new Decimal(text);
    return d.isFinite() ? d : null;
  } catch {
    return null;
  }
}

export interface PercentageBilling {
  /** The percentage being billed on this invoice. */
  readonly percent: string;
  /** The money that percentage comes to at the contract value. */
  readonly amount: string;
  /** What was already billed before this invoice, as a percentage of the contract. */
  readonly previouslyBilled: string;
  /** Everything billed once this invoice is raised. */
  readonly cumulative: string;
  /** What remains billable after this invoice. */
  readonly remaining: string;
}

export interface PercentageProblem {
  readonly error: string;
}

/**
 * What a percentage of a project comes to, and whether it may be billed.
 *
 * Over-billing is refused rather than clamped. Clamping would quietly bill a different figure from
 * the one on screen, and the person raising the invoice would have no way to know: an invoice that
 * says 40% and charges 30% is worse than one that will not save.
 */
export function percentageBilling(input: {
  contractValue: unknown;
  percent: unknown;
  previouslyBilled?: unknown;
}): PercentageBilling | PercentageProblem {
  const contract = decimalOrNull(input.contractValue);
  const pct = decimalOrNull(input.percent);
  const prior = decimalOrNull(input.previouslyBilled) ?? new Decimal(0);

  if (contract === null || contract.lessThanOrEqualTo(0)) {
    return { error: "This project has no contract value to take a percentage of." };
  }
  if (pct === null) return { error: "Enter the percentage of the project to bill." };
  if (pct.lessThanOrEqualTo(0)) {
    return { error: "The percentage must be greater than zero." };
  }
  if (prior.lessThan(0)) {
    return { error: "The amount already billed cannot be negative." };
  }

  const cumulative = prior.plus(pct);
  if (cumulative.greaterThan(100)) {
    const left = new Decimal(100).minus(prior);
    return {
      error: `Only ${percent(left)}% of this project is left to bill. ${percent(prior)}% has already been invoiced.`,
    };
  }

  return {
    percent: percent(pct),
    amount: money(contract.times(pct).div(100)),
    previouslyBilled: percent(prior),
    cumulative: percent(cumulative),
    remaining: percent(new Decimal(100).minus(cumulative)),
  };
}

/**
 * Whether a calculation refused rather than returning a figure.
 *
 * Generic over the success type so every refusing calculation here shares one guard: each returns
 * either its own result or a `PercentageProblem`, and the caller narrows with this.
 */
export function isPercentageProblem<T extends object>(
  value: T | PercentageProblem,
): value is PercentageProblem {
  return "error" in value;
}

/**
 * The percentage a fixed amount represents of a contract, for a milestone priced in money.
 * Returns null when the contract has no value, since every amount would be an infinite share of it.
 */
export function percentOfContract(
  amount: unknown,
  contractValue: unknown,
): string | null {
  const amt = decimalOrNull(amount);
  const contract = decimalOrNull(contractValue);
  if (amt === null || contract === null || contract.lessThanOrEqualTo(0)) return null;
  return percent(amt.times(100).div(contract));
}

export interface ProjectFinancials {
  readonly contractValue: string;
  /** Invoiced excluding cancelled documents, which are not a claim on anybody. */
  readonly invoiced: string;
  readonly paid: string;
  readonly outstanding: string;
  /** Of the contract, what has not been invoiced yet. */
  readonly uninvoiced: string;
  readonly percentInvoiced: string;
  readonly percentPaid: string;
}

/**
 * Roll a project's money up from figures already totalled in SQL.
 *
 * Invoiced and paid are separate questions and stay separate: money billed is not money received,
 * and a single "revenue" number that blurs them is how a finance screen starts lying. Outstanding
 * is what has been invoiced and not yet paid; uninvoiced is contract work not yet billed at all.
 */
export function projectFinancials(input: {
  contractValue: unknown;
  invoiced: unknown;
  paid: unknown;
}): ProjectFinancials {
  const contract = decimalOrNull(input.contractValue) ?? new Decimal(0);
  const invoiced = decimalOrNull(input.invoiced) ?? new Decimal(0);
  const paid = decimalOrNull(input.paid) ?? new Decimal(0);
  const hasContract = contract.greaterThan(0);

  return {
    contractValue: money(contract),
    invoiced: money(invoiced),
    paid: money(paid),
    outstanding: money(Decimal.max(invoiced.minus(paid), 0)),
    uninvoiced: money(contract.minus(invoiced)),
    percentInvoiced: hasContract
      ? percent(invoiced.times(100).div(contract))
      : "0.000",
    percentPaid: hasContract ? percent(paid.times(100).div(contract)) : "0.000",
  };
}

/** Add two money strings without going through a float. Used to apply a payment to a balance. */
export function addMoney(a: unknown, b: unknown): string {
  return money((decimalOrNull(a) ?? new Decimal(0)).plus(decimalOrNull(b) ?? new Decimal(0)));
}

/** Subtract, never below zero. A balance does not go negative because somebody overpaid. */
export function subtractMoney(a: unknown, b: unknown): string {
  const left = (decimalOrNull(a) ?? new Decimal(0)).minus(decimalOrNull(b) ?? new Decimal(0));
  return money(Decimal.max(left, 0));
}

/** Whether an amount is greater than zero. Null and unparseable both count as not. */
export function isPositive(value: unknown): boolean {
  const d = decimalOrNull(value);
  return d !== null && d.greaterThan(0);
}

/** Whether `paid` settles `total` exactly or better. */
export function isSettled(total: unknown, paid: unknown): boolean {
  const t = decimalOrNull(total) ?? new Decimal(0);
  const p = decimalOrNull(paid) ?? new Decimal(0);
  return p.greaterThanOrEqualTo(t) && t.greaterThan(0);
}

/**
 * A payment that would take the balance past the total is refused rather than trimmed.
 *
 * The old payment route did `Math.min(total, paid + amount)` in floats, which silently recorded a
 * smaller payment than the one entered and left no trace of the difference. If somebody really was
 * overpaid, that is a conversation and a credit note, not a rounding.
 */
export function applyPayment(input: {
  total: unknown;
  alreadyPaid: unknown;
  amount: unknown;
}): { paid: string; remaining: string } | PercentageProblem {
  const total = decimalOrNull(input.total) ?? new Decimal(0);
  const already = decimalOrNull(input.alreadyPaid) ?? new Decimal(0);
  const amount = decimalOrNull(input.amount);

  if (amount === null || amount.lessThanOrEqualTo(0)) {
    return { error: "Enter a payment amount greater than zero." };
  }
  const paid = already.plus(amount);
  if (paid.greaterThan(total)) {
    return {
      error: `That is more than the balance. ${money(total.minus(already))} is outstanding on this invoice.`,
    };
  }
  return { paid: money(paid), remaining: money(total.minus(paid)) };
}
