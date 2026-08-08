/**
 * Reconciliation conformance.
 *
 * The first test is the important one: it reproduces the state the audit found in production, where
 * documents displayed an IRN and "Accepted by the NRS" having never been transmitted. Reconciliation
 * must catch that, or it is not doing its job.
 */
import { describe, it, expect } from "vitest";
import { reconcileDocument, findDuplicateIrns, compareWithProvider, type ReconcileInput } from "./reconciliation.js";

/** A document that agrees with itself: 1,000 net, 7.5% VAT, accepted with evidence behind it. */
const sound: ReconcileInput = {
  einvoiceId: "doc-1",
  reference: "INV-00001",
  nrsStatus: "Accepted",
  irn: "REAL-IRN-0001",
  submissionRef: "SUB-0001",
  subtotal: "1000.00",
  vat: "75.00",
  total: "1075.00",
  lines: [{ lineTotal: "1000.00", vatApplicable: true }],
  vatRate: "7.5",
  attemptCount: 1,
  hasAcceptedAttempt: true,
};

const codes = (d: ReconcileInput): string[] => reconcileDocument(d).map((x) => x.code);

describe("the defect this exists to catch", () => {
  it("flags a document accepted with an IRN but no submission behind it", () => {
    // Exactly the audit finding: the simulator wrote an IRN and an acceptance without transmitting.
    const fabricated: ReconcileInput = { ...sound, attemptCount: 0, hasAcceptedAttempt: false };
    const found = reconcileDocument(fabricated);
    expect(found.map((f) => f.code)).toContain("ACCEPTED_WITHOUT_EVIDENCE");
    expect(found.find((f) => f.code === "ACCEPTED_WITHOUT_EVIDENCE")?.severity).toBe("critical");
    expect(found.find((f) => f.code === "ACCEPTED_WITHOUT_EVIDENCE")?.detail).toContain("no submission attempt");
  });
});

describe("impossible fiscal states", () => {
  it("passes a document that agrees with itself", () => {
    expect(reconcileDocument(sound)).toEqual([]);
  });

  it("flags an acceptance with no IRN", () => {
    expect(codes({ ...sound, irn: null })).toContain("ACCEPTED_WITHOUT_IRN");
  });

  it("flags an IRN on a document that was never accepted", () => {
    expect(codes({ ...sound, nrsStatus: "NotSubmitted", hasAcceptedAttempt: false, attemptCount: 0 }))
      .toContain("IRN_WITHOUT_ACCEPTANCE");
  });

  it("does not flag a clean unsubmitted document", () => {
    expect(reconcileDocument({
      ...sound, nrsStatus: "NotSubmitted", irn: null, submissionRef: null,
      attemptCount: 0, hasAcceptedAttempt: false,
    })).toEqual([]);
  });

  it("flags an acceptance whose attempts all failed", () => {
    const found = reconcileDocument({ ...sound, attemptCount: 3, hasAcceptedAttempt: false });
    expect(found.find((f) => f.code === "ACCEPTED_WITHOUT_EVIDENCE")?.detail).toContain("3 recorded attempts");
  });
});

describe("arithmetic that drifted after the fact", () => {
  it("flags a subtotal that no longer follows from its lines", () => {
    expect(codes({ ...sound, lines: [{ lineTotal: "900.00", vatApplicable: true }] }))
      .toContain("SUBTOTAL_MISMATCH");
  });

  it("flags VAT that does not match the rate that priced it", () => {
    expect(codes({ ...sound, vat: "50.00", total: "1050.00" })).toContain("VAT_MISMATCH");
  });

  it("flags a total that is not subtotal plus VAT", () => {
    expect(codes({ ...sound, total: "9999.00" })).toContain("TOTAL_MISMATCH");
  });

  it("excludes non-taxable lines from the expected VAT", () => {
    // 1,000 taxable + 500 exempt: VAT is still 75.00, and the totals follow.
    expect(reconcileDocument({
      ...sound,
      lines: [{ lineTotal: "1000.00", vatApplicable: true }, { lineTotal: "500.00", vatApplicable: false }],
      subtotal: "1500.00", vat: "75.00", total: "1575.00",
    })).toEqual([]);
  });

  it("warns when VAT was charged but no rule was recorded", () => {
    expect(codes({ ...sound, vatRate: null })).toContain("VAT_WITHOUT_RULE");
  });

  it("does not warn about a missing rule when no VAT was charged", () => {
    expect(codes({ ...sound, vatRate: null, vat: "0.00", total: "1000.00" })).not.toContain("VAT_WITHOUT_RULE");
  });

  it("compares money by value, not by string", () => {
    // "1075.0" and "1075.00" are the same amount.
    expect(reconcileDocument({ ...sound, total: "1075.0" })).toEqual([]);
  });
});

describe("duplicate IRNs", () => {
  it("flags the same IRN on two documents, naming the other", () => {
    const found = findDuplicateIrns([
      { einvoiceId: "a", reference: "INV-00001", irn: "SAME" },
      { einvoiceId: "b", reference: "INV-00002", irn: "SAME" },
    ]);
    expect(found).toHaveLength(2);
    expect(found[0]!.code).toBe("DUPLICATE_IRN");
    expect(found[0]!.detail).toContain("INV-00002");
  });

  it("ignores documents with no IRN", () => {
    expect(findDuplicateIrns([
      { einvoiceId: "a", reference: "INV-00001", irn: null },
      { einvoiceId: "b", reference: "INV-00002", irn: null },
    ])).toEqual([]);
  });
});

describe("against the provider", () => {
  const local = { einvoiceId: "doc-1", reference: "INV-00001", nrsStatus: "Accepted", irn: "REAL-IRN-0001" };

  it("treats an IRN the service has never heard of as critical", () => {
    const found = compareWithProvider(local, { known: false, status: null });
    expect(found[0]!.code).toBe("UNKNOWN_TO_PROVIDER");
    expect(found[0]!.severity).toBe("critical");
  });

  it("reports a diverged status", () => {
    expect(compareWithProvider(local, { known: true, status: "Cancelled" })[0]!.code).toBe("STATUS_DIVERGED");
  });

  it("says nothing when both agree", () => {
    expect(compareWithProvider(local, { known: true, status: "Accepted" })).toEqual([]);
  });
});
