/**
 * NRS e-Invoicing shared helpers (PRD 15). Client-safe: document type metadata, status styling, the
 * display number, and money formatting. The simulated submission and QR generation use node:crypto and
 * live in einvoice-server.ts so this file can be imported from client components.
 */
export type DocType = "Invoice" | "CreditNote" | "DebitNote";

export const DOC_META: Record<DocType, { label: string; prefix: string; path: string }> = {
  Invoice: { label: "E-Invoice", prefix: "INV", path: "invoices" },
  CreditNote: { label: "Credit Note", prefix: "CRN", path: "credit-notes" },
  DebitNote: { label: "Debit Note", prefix: "DBN", path: "debit-notes" },
};

/**
 * The three INDEPENDENT statuses a document carries. Lifecycle is the commercial workflow (controlled
 * in Nexoris), NRS is the tax-compliance status (only ever set by SI/APP responses), and Payment is
 * the receivables status (only ever set by Finance recording money). They never affect each other.
 */
export const LIFECYCLE = ["Draft", "PendingApproval", "ReadyToSend", "SentToCustomer", "Viewed", "Closed"] as const;
export const LIFECYCLE_LABEL: Record<string, string> = {
  Draft: "Draft", PendingApproval: "Pending Approval", ReadyToSend: "Ready to Send",
  SentToCustomer: "Sent to Customer", Viewed: "Viewed", Closed: "Closed",
};
export const LIFECYCLE_STYLE: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-600", PendingApproval: "bg-[#FEF3C7] text-[#B45309]",
  ReadyToSend: "bg-[#EEEBFC] text-[#543CDA]", SentToCustomer: "bg-[#DBEAFE] text-[#1D4ED8]",
  Viewed: "bg-[#DBEAFE] text-[#1D4ED8]", Closed: "bg-slate-100 text-slate-500",
};
/** The next lifecycle step an operator can advance to (linear, one direction). */
export const LIFECYCLE_NEXT: Record<string, string | undefined> = {
  Draft: "PendingApproval", PendingApproval: "ReadyToSend", ReadyToSend: "SentToCustomer",
  SentToCustomer: "Viewed", Viewed: "Closed", Closed: undefined,
};

export const NRS_LABEL: Record<string, string> = {
  NotSubmitted: "Not Submitted", Submitting: "Submitting", Accepted: "Accepted",
  Rejected: "Rejected", Credited: "Credited", Debited: "Debited",
};
export const NRS_STYLE: Record<string, string> = {
  NotSubmitted: "bg-slate-100 text-slate-600", Submitting: "bg-[#DBEAFE] text-[#1D4ED8]",
  Accepted: "bg-[#DCFCE7] text-[#15803D]", Rejected: "bg-[#FEE2E2] text-[#B91C1C]",
  Credited: "bg-[#EEEBFC] text-[#543CDA]", Debited: "bg-[#FEF3C7] text-[#B45309]",
};

export const PAYMENT_STYLE: Record<string, string> = {
  Unpaid: "bg-slate-100 text-slate-600", "Partially Paid": "bg-[#FEF3C7] text-[#B45309]",
  Paid: "bg-[#DCFCE7] text-[#15803D]", Overdue: "bg-[#FEE2E2] text-[#B91C1C]",
  Cancelled: "bg-slate-200 text-slate-500 line-through",
};
export const PAYMENT_METHODS = ["Bank Transfer", "Cash", "POS", "Card", "Cheque", "Other"] as const;

export const BILLING_LABEL: Record<string, string> = {
  OneOff: "One-Off", Milestone: "Milestone-Based", Percentage: "Percentage-Based",
  Retainer: "Monthly Retainer", CustomSchedule: "Custom Payment Schedule",
};

/**
 * Payment status, derived from what has been paid against the total and the due date. Never stored.
 *
 * Cancelled comes first and outranks everything: a cancelled invoice is not overdue, not unpaid and
 * not a debt, and showing it as any of those would put money in the receivables that nobody owes.
 */
export function paymentStatus(
  total: number,
  paid: number,
  dueDate: string | null,
  cancelled = false,
): string {
  if (cancelled) return "Cancelled";
  if (paid >= total && total > 0) return "Paid";
  if (paid > 0) return "Partially Paid";
  if (dueDate && new Date(dueDate) < new Date(new Date().toDateString())) return "Overdue";
  return "Unpaid";
}

/**
 * The number a customer reads.
 *
 * `series`/`series_no` are the display numbering and each series counts on its own, so a fiscal
 * invoice series can run gapless while ordinary PDF invoices run on theirs. `seq` remains the one
 * internal identity across every document and is the fallback for anything raised before the
 * series columns existed.
 */
export function docNumber(
  docType: DocType,
  seq: string | number,
  series?: string | null,
  seriesNo?: string | number | null,
): string {
  if (series && seriesNo !== null && seriesNo !== undefined && String(seriesNo).length > 0) {
    return `${series}-${String(seriesNo).padStart(5, "0")}`;
  }
  return `${DOC_META[docType].prefix}-${String(seq).padStart(5, "0")}`;
}

/**
 * Which display series a document belongs to.
 *
 * Invoices share one series whether or not they are filed with the NRS. An earlier design gave
 * unfiled invoices their own series and moved them across when they were filed, which meant a
 * document the customer was already holding changed its number. A number is the handle everyone
 * uses to refer to a transaction, so it is assigned once and never reassigned; filing adds an IRN
 * and renames nothing.
 *
 * Credit and debit notes count separately. They are different instruments, not invoices.
 */
export function seriesFor(docType: DocType): string {
  if (docType === "CreditNote") return "CRN";
  if (docType === "DebitNote") return "DBN";
  return "INV";
}

/** Why VAT was not charged. A tax position nobody wrote down is one nobody can defend. */
export const VAT_EXEMPT_REASONS = [
  "ZeroRatedExport",
  "ExemptSupply",
  "NotRegistered",
  "CustomerExempt",
  "Other",
] as const;
export type VatExemptReason = (typeof VAT_EXEMPT_REASONS)[number];

export const VAT_EXEMPT_LABEL: Record<VatExemptReason, string> = {
  ZeroRatedExport: "Zero-rated: supplied to a customer outside Nigeria",
  ExemptSupply: "Exempt supply",
  NotRegistered: "Not VAT-registered for this supply",
  CustomerExempt: "Customer holds an exemption",
  Other: "Other (explained below)",
};

/** The short form printed on the invoice itself, addressed to the customer. */
export const VAT_EXEMPT_NOTICE: Record<VatExemptReason, string> = {
  ZeroRatedExport: "No VAT charged: this supply is zero-rated as an export of services.",
  ExemptSupply: "No VAT charged: this supply is exempt from VAT.",
  NotRegistered: "No VAT charged: the supplier is not VAT-registered for this supply.",
  CustomerExempt: "No VAT charged: the customer holds a VAT exemption.",
  Other: "No VAT charged on this invoice.",
};

export function naira(v: string | number, decimals = 2): string {
  return `₦${Number(v).toLocaleString("en-NG", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

export interface SubmissionResult {
  accepted: boolean;
  irn: string | null;
  qr_data: string | null;
  submission_ref: string;
  si_app_response: string;
  validation_messages: string[];
}
