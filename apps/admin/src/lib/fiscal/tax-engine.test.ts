/**
 * Tax engine conformance. These pin the two things most likely to go quietly wrong: floating-point drift
 * on money, and a rate being applied to a document it does not cover.
 */
import { describe, it, expect } from "vitest";
import { calculateTax, resolveRule, type TaxRule, type TaxLineInput } from "./tax-engine.js";

const VAT: TaxRule = { id: "vat-2026", taxType: "VAT", rate: "7.5", effectiveFrom: "2026-01-01", effectiveTo: null };
const WHT: TaxRule = { id: "wht-2026", taxType: "WHT", rate: "5", effectiveFrom: "2026-01-01", effectiveTo: null };

const line = (unitPrice: string | number, treatment: TaxLineInput["treatment"] = "Standard", quantity: string | number = 1): TaxLineInput =>
  ({ description: "Service", quantity, unitPrice, treatment });

describe("rule resolution", () => {
  const old: TaxRule = { id: "vat-old", taxType: "VAT", rate: "5", effectiveFrom: "2020-02-01", effectiveTo: "2026-01-01" };

  it("picks the rule in force on the document date", () => {
    expect(resolveRule([old, VAT], "2025-06-15")?.id).toBe("vat-old");
    expect(resolveRule([old, VAT], "2026-06-15")?.id).toBe("vat-2026");
  });

  it("treats the interval as half-open, so a changeover day has exactly one answer", () => {
    // The old rule ends 2026-01-01 exclusive; the new one starts that day inclusive.
    expect(resolveRule([old, VAT], "2025-12-31")?.id).toBe("vat-old");
    expect(resolveRule([old, VAT], "2026-01-01")?.id).toBe("vat-2026");
  });

  it("returns null when no rule covers the date, rather than falling back to zero", () => {
    expect(resolveRule([VAT], "2025-12-31")).toBeNull();
    expect(resolveRule([], "2026-06-15")).toBeNull();
  });

  it("accepts a full timestamp, not just a date", () => {
    expect(resolveRule([old, VAT], "2026-03-04T09:30:00.000Z")?.id).toBe("vat-2026");
  });
});

describe("VAT by treatment", () => {
  it("charges the prevailing rate on standard supplies", () => {
    const r = calculateTax([line(1_000_000)], VAT, WHT);
    expect(r.vat).toBe("75000.00");
    expect(r.total).toBe("1075000.00");
  });

  it("keeps zero-rated lines in the taxable base but charges nothing", () => {
    const r = calculateTax([line(1_000_000, "ZeroRated")], VAT, WHT);
    expect(r.vat).toBe("0.00");
    expect(r.taxableBase).toBe("1000000.00");
  });

  it("excludes exempt lines from the taxable base entirely", () => {
    const r = calculateTax([line(1_000_000, "Exempt")], VAT, WHT);
    expect(r.vat).toBe("0.00");
    expect(r.taxableBase).toBe("0.00");
    expect(r.subtotal).toBe("1000000.00"); // still billed, just outside VAT
  });

  it("prices a mixed document per line", () => {
    const r = calculateTax([line(1000), line(2000, "ZeroRated"), line(4000, "Exempt")], VAT, WHT);
    expect(r.subtotal).toBe("7000.00");
    expect(r.taxableBase).toBe("3000.00"); // standard + zero-rated, not exempt
    expect(r.vat).toBe("75.00"); // 7.5% of the standard 1000 only
    expect(r.total).toBe("7075.00");
  });

  it("charges no VAT when no rule covers the date", () => {
    const r = calculateTax([line(1_000_000)], null, null);
    expect(r.vat).toBe("0.00");
    expect(r.vatRuleId).toBeNull();
  });
});

describe("decimal arithmetic", () => {
  it("does not drift on values that float arithmetic gets wrong", () => {
    // 0.1 + 0.2 !== 0.3 in IEEE 754. Three lines that must sum exactly.
    const r = calculateTax([line("0.10"), line("0.20"), line("0.30")], VAT, WHT);
    expect(r.subtotal).toBe("0.60");
  });

  it("rounds half-up once, at the point a figure becomes money", () => {
    // 33.33 * 7.5% = 2.49975 -> 2.50
    const r = calculateTax([line("33.33")], VAT, WHT);
    expect(r.vat).toBe("2.50");
  });

  it("keeps full precision through quantity multiplication", () => {
    // 3 x 1/3 of a naira should not lose a kobo.
    const r = calculateTax([line("0.33", "Standard", 3)], VAT, WHT);
    expect(r.lines[0]!.lineTotal).toBe("0.99");
  });

  it("sums many small lines without accumulating error", () => {
    const many = Array.from({ length: 100 }, () => line("0.07"));
    expect(calculateTax(many, VAT, WHT).subtotal).toBe("7.00");
  });
});

describe("withholding tax", () => {
  it("is computed on the subtotal, whatever each line's VAT treatment is", () => {
    // Withholding tax asks what the service was worth, not what kind of supply it was for VAT. The
    // exempt line is still work the customer pays for and still work they withhold on, so all
    // 7000 counts. This deliberately replaces an earlier rule that used the VAT taxable base and
    // therefore reported no withholding at all on an exempt supply.
    const r = calculateTax([line(1000), line(2000, "ZeroRated"), line(4000, "Exempt")], VAT, WHT);
    expect(r.whtExpected).toBe("350.00"); // 5% of 7000
  });

  it("still applies when the document charges no VAT", () => {
    // The case that made the old rule untenable: chargeVat false empties the VAT base, which would
    // have zeroed the withholding on every unfiled or exempt invoice and left us expecting money
    // the customer was never told to deduct.
    const r = calculateTax([line(1_000_000)], VAT, WHT, { chargeVat: false });
    expect(r.vat).toBe("0.00");
    expect(r.total).toBe("1000000.00");
    expect(r.whtExpected).toBe("50000.00");
  });

  it("never changes what the customer is billed", () => {
    const r = calculateTax([line(1_000_000)], VAT, WHT);
    // WHT is deducted at source by the customer, so the total stays subtotal + VAT.
    expect(r.total).toBe("1075000.00");
    expect(r.whtExpected).toBe("50000.00");
  });
});

describe("edge cases", () => {
  it("ignores blank lines", () => {
    const r = calculateTax([line(1000), { description: "  ", quantity: 1, unitPrice: 999, treatment: "Standard" }], VAT, WHT);
    expect(r.subtotal).toBe("1000.00");
    expect(r.lines).toHaveLength(1);
  });

  it("handles an empty document without producing NaN", () => {
    const r = calculateTax([], VAT, WHT);
    expect(r).toMatchObject({ subtotal: "0.00", vat: "0.00", total: "0.00", whtExpected: "0.00" });
  });

  it("records which rule versions priced the document", () => {
    const r = calculateTax([line(1000)], VAT, WHT);
    expect(r.vatRuleId).toBe("vat-2026");
    expect(r.whtRuleId).toBe("wht-2026");
  });
});

describe("charging no VAT on a document", () => {
  it("charges nothing and keeps the total at the subtotal", () => {
    const r = calculateTax([line(1000), line(500)], VAT, WHT, { chargeVat: false });
    expect(r.subtotal).toBe("1500.00");
    expect(r.vat).toBe("0.00");
    expect(r.total).toBe("1500.00");
  });

  it("keeps the document out of the VAT return entirely", () => {
    const r = calculateTax([line(1000)], VAT, WHT, { chargeVat: false });
    expect(r.taxableBase).toBe("0.00");
    // No rule priced it, so recording one would imply a rate had been applied.
    expect(r.vatRuleId).toBeNull();
  });

  it("leaves each line's own treatment alone", () => {
    const r = calculateTax([line(1000, "Standard"), line(500, "ZeroRated")], VAT, WHT, {
      chargeVat: false,
    });
    expect(r.lines.map((l) => l.treatment)).toEqual(["Standard", "ZeroRated"]);
    expect(r.lines.every((l) => l.vat === "0.00")).toBe(true);
  });

  it("charges VAT by default and when asked explicitly", () => {
    expect(calculateTax([line(1000)], VAT, WHT).vat).toBe("75.00");
    expect(calculateTax([line(1000)], VAT, WHT, { chargeVat: true }).vat).toBe("75.00");
  });

  it("is not the same as having no rule, which still refuses to price", () => {
    // A missing rule yields no rate and no rule id; the caller is expected to refuse. Choosing not
    // to charge is a decision the document records. The two must not be one silent zero.
    const noRule = calculateTax([line(1000)], null, WHT);
    const noCharge = calculateTax([line(1000)], VAT, WHT, { chargeVat: false });
    expect(noRule.vat).toBe("0.00");
    expect(noCharge.vat).toBe("0.00");
    expect(noRule.taxableBase).toBe("1000.00");
    expect(noCharge.taxableBase).toBe("0.00");
  });
});
