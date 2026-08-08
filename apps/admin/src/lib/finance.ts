/**
 * Finance calculation helpers (PRD 6.4, 6.5). Invoice totals: each line is quantity x unit price;
 * VAT at the configured rate applies only to VAT-applicable lines; withholding tax is what the client
 * is expected to deduct (shown for information, never added to what we collect). Kept pure so a report
 * can never disagree with an invoice.
 *
 * The arithmetic runs on Decimal, not JS numbers. Rounding after every float step hides drift rather
 * than removing it, and these figures are money. Rounding happens once per amount, half-up, matching how
 * an invoice reads and how NUMERIC(16,2) stores it.
 *
 * For fiscal documents prefer `lib/fiscal/tax-engine.ts`, which additionally resolves a dated tax rule
 * and distinguishes zero-rated from exempt supplies. This function keeps a single flat rate and exists
 * for the commercial Finance screens and their live previews.
 */
import Decimal from "decimal.js";

export interface LineInput {
  description: string;
  quantity: number;
  unit_price: number;
  vat_applicable: boolean;
}

export interface InvoiceTotals {
  subtotal: number;
  vat: number;
  wht_expected: number;
  total: number;
  lines: (LineInput & { line_total: number })[];
}

/** Money: two places, half-up, applied once per amount. */
const money = (d: Decimal): number => d.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();

export function round2(n: number): number {
  return new Decimal(n).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

/** Subtotal, VAT (on applicable lines only), expected WHT, and payable total. */
export function invoiceTotals(lines: LineInput[], vatRate: number, whtRate: number): InvoiceTotals {
  const rate = new Decimal(vatRate || 0).div(100);
  const wht = new Decimal(whtRate || 0).div(100);

  let subtotal = new Decimal(0);
  let vatBase = new Decimal(0);
  let vat = new Decimal(0);

  const priced = lines
    .filter((l) => l.description.trim() !== "")
    .map((l) => {
      const lineTotal = new Decimal(l.quantity || 0).times(l.unit_price || 0);
      subtotal = subtotal.plus(lineTotal);
      if (l.vat_applicable) {
        vatBase = vatBase.plus(lineTotal);
        vat = vat.plus(lineTotal.times(rate));
      }
      return { ...l, line_total: money(lineTotal) };
    });

  return {
    subtotal: money(subtotal),
    vat: money(vat),
    // WHT is deducted by the client on the value of services, so it follows the VAT-applicable lines
    // rather than the whole subtotal. Informational: it never changes what we bill.
    wht_expected: money(vatBase.times(wht)),
    total: money(subtotal.plus(vat)),
    lines: priced,
  };
}

/** The status an invoice should carry given what has been paid, without overwriting Draft or Void. */
export function invoiceStatus(current: string, total: number, amountPaid: number): string {
  if (current === "Draft" || current === "Void") return current;
  if (amountPaid <= 0) return "Sent";
  if (amountPaid >= total) return "Paid";
  return "Part-Paid";
}

/** Naira for display. Defaults to kobo precision; pass 0 for whole naira in dense tables. */
export function naira(v: string | number, decimals = 2): string {
  return `₦${Number(v).toLocaleString("en-NG", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

/**
 * Whether a receivable is genuinely overdue: past its due date with money still owed, and not in a state
 * where the question does not apply. A cancelled or fully paid invoice is never overdue.
 */
export function isOverdue(status: string, dueDate: string | null, amountPaid: number, total: number): boolean {
  if (!dueDate) return false;
  if (status === "Draft" || status === "Void" || status === "Paid") return false;
  if (amountPaid >= total) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}
