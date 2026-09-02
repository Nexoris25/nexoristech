/**
 * VAT and WHT calculation for invoices and fiscal documents.
 *
 * Two things this file exists to get right:
 *
 *  1. **Decimal arithmetic, never floats.** Money is multiplied here. `0.1 + 0.2` is not `0.3` in IEEE
 *     754, and the previous implementation papered over that by rounding after every step, which hides
 *     drift rather than removing it. Every figure below is a `Decimal`, rounded exactly once, at the
 *     point a value becomes an amount of money.
 *
 *  2. **A rate is only meaningful with a date.** A rate is resolved from the versioned `tax_rule` table
 *     using the document's issue date, and the rule's id is returned so the document can record which
 *     version priced it. Recomputing a 2026 invoice in 2027 must not silently re-price it.
 *
 * Not the same thing as `lib/tax-engine.ts`, which is PAYE on payroll. This is transaction tax.
 *
 * Nothing here asserts compliance. It implements the arithmetic; whether the rates and treatments are the
 * right ones for a given supply is a question for a qualified practitioner.
 */
import Decimal from "decimal.js";

/** How a line is treated for VAT. Zero-rated and exempt both charge nothing and are not the same thing. */
export type TaxTreatment = "Standard" | "ZeroRated" | "Exempt";

export interface TaxRule {
  id: string;
  taxType: "VAT" | "WHT";
  /** Percentage, e.g. "7.5". A string so it survives the trip from NUMERIC without passing through a float. */
  rate: string;
  effectiveFrom: string;
  effectiveTo: string | null;
}

export interface TaxLineInput {
  description: string;
  quantity: string | number;
  unitPrice: string | number;
  treatment: TaxTreatment;
}

export interface TaxLineResult {
  description: string;
  treatment: TaxTreatment;
  lineTotal: string;
  vat: string;
}

export interface TaxCalculation {
  lines: TaxLineResult[];
  subtotal: string;
  /** The part of the subtotal within the VAT system at all: standard plus zero-rated, never exempt. */
  taxableBase: string;
  vat: string;
  total: string;
  /** Deducted by the customer at source and remitted by them. Never added to what we bill. */
  whtExpected: string;
  /** Which rule versions produced these figures, for the audit trail. */
  vatRuleId: string | null;
  whtRuleId: string | null;
}

/** Money: 2 decimal places, half-up, matching how an invoice is read and how NUMERIC(16,2) stores it. */
const money = (d: Decimal): string => d.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);

/**
 * The rule in force on a date, from a set of candidates.
 *
 * The interval is half-open: `effective_from` is inclusive and `effective_to` exclusive, so a rate that
 * ends the same day another begins has exactly one answer and no gap. Returns null when no rule covers
 * the date, which callers must treat as a refusal to price rather than as zero.
 */
export function resolveRule(rules: TaxRule[], onDate: string): TaxRule | null {
  const day = onDate.slice(0, 10);
  const matches = rules.filter((r) => r.effectiveFrom <= day && (r.effectiveTo === null || r.effectiveTo > day));
  if (matches.length === 0) return null;
  // A correct table cannot produce two, but prefer the latest start if one ever slips through.
  return matches.reduce((a, b) => (a.effectiveFrom >= b.effectiveFrom ? a : b));
}

/**
 * Price a document's lines.
 *
 * VAT applies per line, so a document may mix standard, zero-rated and exempt supplies and still produce
 * a correct total. Exempt lines are excluded from the taxable base entirely; zero-rated lines stay in it
 * at 0%, because they belong in the VAT return even though they carry no tax.
 *
 * WHT is computed on the subtotal, not on the VAT taxable base. They are different taxes answering
 * different questions: VAT asks what kind of supply this is, withholding tax asks what the service was
 * worth. Basing WHT on the VAT base made an exempt or zero-rated supply report no withholding at all,
 * and made a document that charges no VAT report none either once `chargeVat` could be false - which
 * understates what the customer is obliged to deduct and leaves us expecting money that will not
 * arrive. It stays informational: the customer deducts it and remits it themselves, so it never
 * changes what we bill.
 */
export function calculateTax(
  lines: TaxLineInput[],
  vatRule: TaxRule | null,
  whtRule: TaxRule | null,
  options: { chargeVat?: boolean } = {},
): TaxCalculation {
  // `chargeVat: false` is the issuer deciding this document charges no VAT. It is not the same as a
  // missing rule, which means we could not resolve a rate and must refuse to price. Passing a null
  // rule to mean "no VAT" would collapse those two into one silent zero, so the decision is explicit
  // and the per-line treatment is left alone: the line still records what kind of supply it is.
  const chargeVat = options.chargeVat !== false;
  const vatRate =
    chargeVat && vatRule ? new Decimal(vatRule.rate).div(100) : new Decimal(0);
  const whtRate = whtRule ? new Decimal(whtRule.rate).div(100) : new Decimal(0);

  let subtotal = new Decimal(0);
  let taxableBase = new Decimal(0);
  let vatTotal = new Decimal(0);

  const priced: TaxLineResult[] = lines
    .filter((l) => l.description.trim() !== "")
    .map((l) => {
      const lineTotal = new Decimal(l.quantity || 0).times(l.unitPrice || 0);
      subtotal = subtotal.plus(lineTotal);

      // Exempt supplies are outside the VAT system, so they never enter the base. A document that
      // charges no VAT contributes nothing to the base either, so it stays out of the VAT return.
      const inBase = chargeVat && l.treatment !== "Exempt";
      if (inBase) taxableBase = taxableBase.plus(lineTotal);

      // Zero-rated is taxable at 0%: in the base, no tax charged.
      const lineVat = l.treatment === "Standard" ? lineTotal.times(vatRate) : new Decimal(0);
      vatTotal = vatTotal.plus(lineVat);

      return {
        description: l.description,
        treatment: l.treatment,
        lineTotal: money(lineTotal),
        vat: money(lineVat),
      };
    });

  return {
    lines: priced,
    subtotal: money(subtotal),
    taxableBase: money(taxableBase),
    vat: money(vatTotal),
    total: money(subtotal.plus(vatTotal)),
    whtExpected: money(subtotal.times(whtRate)),
    // No rule priced this document when no VAT was charged, and recording one would imply otherwise.
    vatRuleId: chargeVat ? (vatRule?.id ?? null) : null,
    whtRuleId: whtRule?.id ?? null,
  };
}
