/**
 * The money arithmetic behind project billing. These are the figures a client is asked to pay, so
 * the cases here are the ones that would be wrong if this went through a float.
 */
import { describe, it, expect } from "vitest";
import {
  applyPayment,
  isPercentageProblem,
  isSettled,
  percentOfContract,
  percentageBilling,
  projectFinancials,
  subtractMoney,
} from "./projects.js";

const ok = (v: ReturnType<typeof percentageBilling>) => {
  if (isPercentageProblem(v)) throw new Error(`unexpected refusal: ${v.error}`);
  return v;
};

describe("percentageBilling", () => {
  it("takes a percentage of the contract value exactly", () => {
    const r = ok(percentageBilling({ contractValue: "12500000.00", percent: "40" }));
    expect(r.amount).toBe("5000000.00");
    expect(r.percent).toBe("40.000");
    expect(r.cumulative).toBe("40.000");
    expect(r.remaining).toBe("60.000");
  });

  it("is exact where a float is not", () => {
    // 0.1 + 0.2 !== 0.3 in IEEE 754, and 1.005 rounds the wrong way through a float.
    expect(ok(percentageBilling({ contractValue: "100.10", percent: "10" })).amount).toBe("10.01");
    expect(ok(percentageBilling({ contractValue: "8050", percent: "33.333" })).amount).toBe("2683.31");
    expect(ok(percentageBilling({ contractValue: "0.05", percent: "50" })).amount).toBe("0.03");
  });

  it("carries what was billed before into the running total", () => {
    const r = ok(
      percentageBilling({ contractValue: "10000000", percent: "25", previouslyBilled: "40" }),
    );
    expect(r.amount).toBe("2500000.00");
    expect(r.previouslyBilled).toBe("40.000");
    expect(r.cumulative).toBe("65.000");
    expect(r.remaining).toBe("35.000");
  });

  it("allows the final instalment to land exactly on 100", () => {
    const r = ok(
      percentageBilling({ contractValue: "10000000", percent: "35", previouslyBilled: "65" }),
    );
    expect(r.cumulative).toBe("100.000");
    expect(r.remaining).toBe("0.000");
  });

  it("refuses to over-bill rather than quietly clamping", () => {
    const r = percentageBilling({
      contractValue: "10000000",
      percent: "40",
      previouslyBilled: "70",
    });
    expect(isPercentageProblem(r)).toBe(true);
    if (isPercentageProblem(r)) {
      expect(r.error).toContain("30.000% of this project is left");
      expect(r.error).toContain("70.000% has already been invoiced");
    }
  });

  it("refuses a project with nothing to take a percentage of", () => {
    expect(isPercentageProblem(percentageBilling({ contractValue: "0", percent: "10" }))).toBe(true);
    expect(isPercentageProblem(percentageBilling({ contractValue: null, percent: "10" }))).toBe(true);
  });

  it("tells a blank percentage apart from a zero one", () => {
    const blank = percentageBilling({ contractValue: "100", percent: "" });
    const zero = percentageBilling({ contractValue: "100", percent: "0" });
    expect(isPercentageProblem(blank) && blank.error).toContain("Enter the percentage");
    expect(isPercentageProblem(zero) && zero.error).toContain("greater than zero");
  });

  it("reads a figure typed with thousands separators", () => {
    expect(ok(percentageBilling({ contractValue: "12,500,000", percent: "10" })).amount).toBe(
      "1250000.00",
    );
  });
});

describe("percentOfContract", () => {
  it("turns a milestone amount into its share of the contract", () => {
    expect(percentOfContract("2500000", "10000000")).toBe("25.000");
  });
  it("has no answer when the contract is worth nothing", () => {
    expect(percentOfContract("100", "0")).toBeNull();
  });
});

describe("projectFinancials", () => {
  it("keeps invoiced, paid and outstanding as separate figures", () => {
    const f = projectFinancials({
      contractValue: "10000000",
      invoiced: "6000000",
      paid: "2500000",
    });
    expect(f.invoiced).toBe("6000000.00");
    expect(f.paid).toBe("2500000.00");
    expect(f.outstanding).toBe("3500000.00");
    expect(f.uninvoiced).toBe("4000000.00");
    expect(f.percentInvoiced).toBe("60.000");
    expect(f.percentPaid).toBe("25.000");
  });

  it("does not report a negative outstanding when a client overpays", () => {
    const f = projectFinancials({ contractValue: "100", invoiced: "100", paid: "120" });
    expect(f.outstanding).toBe("0.00");
  });

  it("survives a project with no contract value", () => {
    const f = projectFinancials({ contractValue: "0", invoiced: "0", paid: "0" });
    expect(f.percentInvoiced).toBe("0.000");
    expect(f.percentPaid).toBe("0.000");
  });
});

describe("applyPayment", () => {
  it("adds a part payment and reports what is left", () => {
    const r = applyPayment({ total: "5375000.00", alreadyPaid: "0", amount: "2000000" });
    expect(r).toEqual({ paid: "2000000.00", remaining: "3375000.00" });
  });

  it("settles an invoice exactly", () => {
    const r = applyPayment({ total: "5375000.00", alreadyPaid: "5000000", amount: "375000" });
    expect(r).toEqual({ paid: "5375000.00", remaining: "0.00" });
  });

  it("refuses an overpayment instead of trimming it", () => {
    const r = applyPayment({ total: "1000.00", alreadyPaid: "900", amount: "200" });
    expect(isPercentageProblem(r)).toBe(true);
    if (isPercentageProblem(r)) expect(r.error).toContain("100.00 is outstanding");
  });

  it("refuses a zero or negative payment", () => {
    expect(isPercentageProblem(applyPayment({ total: "100", alreadyPaid: "0", amount: "0" }))).toBe(true);
    expect(isPercentageProblem(applyPayment({ total: "100", alreadyPaid: "0", amount: "-5" }))).toBe(true);
  });
});

describe("balances", () => {
  it("never reports a negative balance", () => {
    expect(subtractMoney("100", "150")).toBe("0.00");
  });
  it("knows when an invoice is settled", () => {
    expect(isSettled("1000.00", "1000.00")).toBe(true);
    expect(isSettled("1000.00", "999.99")).toBe(false);
    expect(isSettled("0", "0")).toBe(false);
  });
});
