/**
 * Reconciliation: does what we hold actually agree with itself, and with the authority?
 *
 * This exists because of what the audit found. A document was displaying "Accepted by the NRS" with an
 * IRN that no authority had issued, and nothing in the system was positioned to notice. A check that
 * runs over the whole ledger and asks "is this state even reachable?" would have caught it immediately.
 *
 * Two halves:
 *
 *   Internal   - runs today, no provider needed. Catches impossible states: an acceptance with no IRN,
 *                an IRN on something never submitted, an acceptance with no attempt behind it, totals
 *                that disagree with their own lines, a duplicated IRN.
 *   External   - compares against what the provider reports. Needs a configured adapter.
 *
 * **This module never writes fiscal status.** It reports. Correcting a discrepancy is a decision with tax
 * consequences and belongs to a person, not to a background job that noticed something.
 */
import Decimal from "decimal.js";

export type Severity = "critical" | "warning";

export interface Discrepancy {
  einvoiceId: string;
  reference: string;
  code: string;
  severity: Severity;
  detail: string;
}

export interface ReconcileInput {
  einvoiceId: string;
  reference: string;
  nrsStatus: string;
  irn: string | null;
  submissionRef: string | null;
  /** Stored document totals, as decimal strings. */
  subtotal: string;
  vat: string;
  total: string;
  /** The lines the totals should be derived from. */
  lines: { lineTotal: string; vatApplicable: boolean }[];
  /** The rate that priced it, from the tax rule recorded on the document. Null when none was recorded. */
  vatRate: string | null;
  /** How many attempts were actually recorded against this document. */
  attemptCount: number;
  /** Whether any recorded attempt came back accepted. */
  hasAcceptedAttempt: boolean;
}

const money = (d: Decimal): string => d.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);

/**
 * Check one document against itself.
 *
 * Every rule here describes a state that should be unreachable. If one fires, something wrote a fiscal
 * field it had no business writing, or a total drifted after the fact.
 */
export function reconcileDocument(d: ReconcileInput): Discrepancy[] {
  const found: Discrepancy[] = [];
  const flag = (code: string, severity: Severity, detail: string): void => {
    found.push({ einvoiceId: d.einvoiceId, reference: d.reference, code, severity, detail });
  };

  const accepted = d.nrsStatus === "Accepted";

  // An acceptance is meaningless without the identifier the authority issued with it.
  if (accepted && !d.irn) {
    flag("ACCEPTED_WITHOUT_IRN", "critical",
      "Marked accepted by the NRS but carries no IRN. An acceptance always issues one.");
  }

  // An IRN can only come from an acceptance. Anywhere else, it was manufactured.
  if (!accepted && d.irn) {
    flag("IRN_WITHOUT_ACCEPTANCE", "critical",
      `Holds IRN ${d.irn} while its status is ${d.nrsStatus}. Only an accepted submission issues an IRN.`);
  }

  // An acceptance must have an attempt behind it. No attempt means nothing was ever transmitted.
  if (accepted && !d.hasAcceptedAttempt) {
    flag("ACCEPTED_WITHOUT_EVIDENCE", "critical",
      d.attemptCount === 0
        ? "Marked accepted but no submission attempt was ever recorded against it."
        : `Marked accepted but none of its ${d.attemptCount} recorded attempts came back accepted.`);
  }

  // Totals must still follow from the lines. A mismatch means one of them changed independently.
  let subtotal = new Decimal(0);
  let vatBase = new Decimal(0);
  for (const l of d.lines) {
    const lt = new Decimal(l.lineTotal);
    subtotal = subtotal.plus(lt);
    if (l.vatApplicable) vatBase = vatBase.plus(lt);
  }
  if (d.lines.length > 0 && money(subtotal) !== new Decimal(d.subtotal).toFixed(2)) {
    flag("SUBTOTAL_MISMATCH", "critical",
      `Stored subtotal ${new Decimal(d.subtotal).toFixed(2)} does not equal the sum of its lines, ${money(subtotal)}.`);
  }

  if (d.vatRate !== null && d.lines.length > 0) {
    const expected = money(vatBase.times(new Decimal(d.vatRate).div(100)));
    if (expected !== new Decimal(d.vat).toFixed(2)) {
      flag("VAT_MISMATCH", "critical",
        `Stored VAT ${new Decimal(d.vat).toFixed(2)} does not match ${d.vatRate}% of the taxable lines, which is ${expected}.`);
    }
  } else if (d.vatRate === null && new Decimal(d.vat).greaterThan(0)) {
    flag("VAT_WITHOUT_RULE", "warning",
      "Carries VAT but records no tax rule, so the rate that produced it cannot be established.");
  }

  // The payable total is the one figure a customer acts on.
  const expectedTotal = money(new Decimal(d.subtotal).plus(new Decimal(d.vat)));
  if (expectedTotal !== new Decimal(d.total).toFixed(2)) {
    flag("TOTAL_MISMATCH", "critical",
      `Stored total ${new Decimal(d.total).toFixed(2)} does not equal subtotal plus VAT, which is ${expectedTotal}.`);
  }

  return found;
}

/**
 * An IRN identifies one document. The same one on two documents means either a provider error or, more
 * likely, that something local generated it.
 */
export function findDuplicateIrns(docs: { einvoiceId: string; reference: string; irn: string | null }[]): Discrepancy[] {
  const byIrn = new Map<string, typeof docs>();
  for (const d of docs) {
    if (!d.irn) continue;
    const list = byIrn.get(d.irn) ?? [];
    list.push(d);
    byIrn.set(d.irn, list);
  }
  const found: Discrepancy[] = [];
  for (const [irn, list] of byIrn) {
    if (list.length < 2) continue;
    for (const d of list) {
      found.push({
        einvoiceId: d.einvoiceId,
        reference: d.reference,
        code: "DUPLICATE_IRN",
        severity: "critical",
        detail: `IRN ${irn} is also on ${list.filter((x) => x.einvoiceId !== d.einvoiceId).map((x) => x.reference).join(", ")}. An IRN identifies exactly one document.`,
      });
    }
  }
  return found;
}

/** Compare our stored view against what the provider reports for the same IRN. */
export function compareWithProvider(
  local: { einvoiceId: string; reference: string; nrsStatus: string; irn: string },
  provider: { known: boolean; status: string | null },
): Discrepancy[] {
  if (!provider.known) {
    return [{
      einvoiceId: local.einvoiceId, reference: local.reference, code: "UNKNOWN_TO_PROVIDER", severity: "critical",
      detail: `We hold IRN ${local.irn} as ${local.nrsStatus}, but the service has no record of it.`,
    }];
  }
  if (provider.status && provider.status !== local.nrsStatus) {
    return [{
      einvoiceId: local.einvoiceId, reference: local.reference, code: "STATUS_DIVERGED", severity: "warning",
      detail: `We hold ${local.nrsStatus}; the service reports ${provider.status}.`,
    }];
  }
  return [];
}
