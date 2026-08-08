/**
 * Salary bands, derived from the Nigeria Tax Act 2025 rate table (effective 1 January 2026).
 *
 * HR asked to classify each employee into the band they fall in, so the payroll can be seen to be
 * compliant band by band. One thing has to be said plainly for this to be honest:
 *
 *   The Act's bands apply to CHARGEABLE income, not to gross salary. Chargeable income is gross less
 *   pension, less NHF, less Rent Relief. Two people on the same gross can sit in different bands
 *   because one pays rent and the other does not.
 *
 * So a band is a classification and a cross-check, never the calculator. `computeStatutory` remains the
 * only thing that produces a deduction, exactly as before. What this adds is the ability to state which
 * band an employee belongs to, and to say so out loud when the band HR picked is not the band the
 * employee's own figures put them in — which is the mistake this feature is meant to catch.
 */
import { PAYE_BANDS, TAX_TABLE_EFFECTIVE, payeAnnual, MINIMUM_WAGE_MONTHLY } from "./tax-engine.js";

export interface SalaryBand {
  /** Stored on the employee record. Stable across rate changes within the same table. */
  id: string;
  /** What HR sees in the list. */
  label: string;
  /** Inclusive lower bound of annual chargeable income, in naira. */
  from: number;
  /** Exclusive upper bound, or null for the top band. */
  to: number | null;
  /** The marginal rate that applies inside this band, as a percentage. */
  rate: number;
}

const naira = (n: number): string =>
  n >= 1_000_000 ? `₦${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}m` : `₦${(n / 1_000).toFixed(0)}k`;

/**
 * The bands, built from the same table PAYE is computed from, so the list can never drift from the
 * calculation. A rate change edits one file and both move together.
 */
export const SALARY_BANDS: SalaryBand[] = PAYE_BANDS.map((band, i) => {
  const from = i === 0 ? 0 : (PAYE_BANDS[i - 1]!.upTo as number);
  const to = Number.isFinite(band.upTo) ? (band.upTo as number) : null;
  const rate = band.rate * 100;
  return {
    id: `band-${i + 1}`,
    label: to === null ? `Above ${naira(from)} — ${rate}%` : `${naira(from)} to ${naira(to)} — ${rate}%`,
    from,
    to,
    rate,
  };
});

/** The band an amount of annual chargeable income falls in. */
export function bandForChargeable(chargeableAnnual: number): SalaryBand {
  const n = Math.max(0, chargeableAnnual);
  return SALARY_BANDS.find((b) => b.to === null || n < b.to) ?? SALARY_BANDS[SALARY_BANDS.length - 1]!;
}

export function bandById(id: string | null | undefined): SalaryBand | undefined {
  return id ? SALARY_BANDS.find((b) => b.id === id) : undefined;
}

export interface BandCheck {
  /** The band the employee's own figures put them in. */
  actual: SalaryBand;
  /** The band HR selected, when they selected one. */
  selected?: SalaryBand;
  /** True when a selection was made and it does not match the figures. */
  mismatch: boolean;
  /** Tax as a share of gross. The band rate is marginal, so this is the number people actually mean. */
  effectiveRate: number;
  /** The marginal rate at this level of income. */
  marginalRate: number;
  /** True when the employee is at or below the minimum wage and owes no PAYE whatever the band says. */
  exempt: boolean;
}

/**
 * Cross-check a selected band against what the employee's figures actually produce.
 *
 * `chargeableAnnual` and `payeMonthly` come from `computeStatutory`; nothing here recomputes them. The
 * effective rate is reported alongside the marginal rate because they are routinely confused: an
 * employee in the 21% band does not pay 21% of their salary, they pay 21% on the slice inside that band.
 */
export function checkBand(input: {
  grossMonthly: number;
  chargeableAnnual: number;
  payeMonthly: number;
  selectedBandId?: string | null;
}): BandCheck {
  const actual = bandForChargeable(input.chargeableAnnual);
  const selected = bandById(input.selectedBandId);
  const grossAnnual = input.grossMonthly * 12;
  return {
    actual,
    ...(selected ? { selected } : {}),
    mismatch: Boolean(selected && selected.id !== actual.id),
    effectiveRate: grossAnnual > 0 ? Math.round(((input.payeMonthly * 12) / grossAnnual) * 1000) / 10 : 0,
    marginalRate: actual.rate,
    exempt: input.grossMonthly > 0 && input.grossMonthly <= MINIMUM_WAGE_MONTHLY,
  };
}

/**
 * Annual PAYE at the top of each band, so HR can see what the table produces without running a payroll.
 * Uses the same progressive function as the payroll itself.
 */
export function bandCeilingTax(band: SalaryBand): number | null {
  return band.to === null ? null : payeAnnual(band.to);
}

export { TAX_TABLE_EFFECTIVE };
