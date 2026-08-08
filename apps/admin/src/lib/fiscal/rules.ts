/**
 * Reads versioned tax rules out of the database for the tax engine.
 *
 * Kept apart from `tax-engine.ts` so the arithmetic stays pure and testable without a database, and so
 * there is one place that knows how a rule row becomes a rule.
 */
import { db } from "../db.js";
import { resolveRule, type TaxRule } from "./tax-engine.js";

interface RuleRow { id: string; tax_type: string; rate: string; effective_from: string; effective_to: string | null }

/** Every rule of a type, newest first. Rates come back as strings so they never pass through a float. */
export async function loadRules(taxType: "VAT" | "WHT", jurisdiction = "NG"): Promise<TaxRule[]> {
  const { rows } = await db().query<RuleRow>(
    `SELECT id, tax_type, rate::text, effective_from::text, effective_to::text
       FROM tax_rule WHERE tax_type=$1 AND jurisdiction=$2 ORDER BY effective_from DESC`,
    [taxType, jurisdiction]);
  return rows.map((r) => ({
    id: r.id,
    taxType: r.tax_type as TaxRule["taxType"],
    rate: r.rate,
    effectiveFrom: r.effective_from,
    effectiveTo: r.effective_to,
  }));
}

/**
 * The VAT and WHT rules in force on a date. Either may be null when no rule covers that date, which the
 * caller must treat as "cannot price this document" rather than as a zero rate.
 */
export async function rulesForDate(onDate: string): Promise<{ vat: TaxRule | null; wht: TaxRule | null }> {
  const [vatRules, whtRules] = await Promise.all([loadRules("VAT"), loadRules("WHT")]);
  return { vat: resolveRule(vatRules, onDate), wht: resolveRule(whtRules, onDate) };
}
