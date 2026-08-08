/**
 * The SI/APP boundary. Everything the Nigeria Revenue Service is told, and everything it says back,
 * crosses this interface and nowhere else.
 *
 * The rule this file exists to enforce: fiscal identifiers are ISSUED, never MANUFACTURED. An IRN, a QR
 * payload, a submission reference and an acceptance are evidence that a tax authority saw a document.
 * Nexoris Technologies cannot produce that evidence on its own, so no implementation may return a value
 * it invented. An adapter either relays what an accredited provider actually said, or it fails.
 *
 * A concrete adapter needs the provider's own documentation: endpoint, authentication, request and
 * response schemas, IRN format, QR payload specification and cancellation window. None of that can be
 * guessed. Until it exists, `UnconfiguredAdapter` is what runs, and it fails closed.
 */

/** A document as presented for fiscalisation. Read-only; an adapter never mutates our records. */
export interface FiscalDocument {
  id: string;
  docType: "Invoice" | "CreditNote" | "DebitNote";
  /** Our own document number, for correlation in the provider's logs. */
  reference: string;
  buyerName: string;
  buyerTin: string | null;
  issueDate: string;
  currency: string;
  /** Decimal strings, never floats: these are the figures the authority will see. */
  subtotal: string;
  vat: string;
  total: string;
  lines: { description: string; quantity: string; unitPrice: string; lineTotal: string; vatApplicable: boolean }[];
}

/**
 * What a provider returned. `accepted` may only be true when the provider said so.
 *
 * `irn`, `qrPayload` and `providerReference` are non-null only when they came from the provider. A
 * transport failure is not a rejection: it is `outcome: "unavailable"`, which leaves the document exactly
 * where it was so a retry is safe.
 */
export type FiscalOutcome =
  | { outcome: "accepted"; irn: string; qrPayload: string | null; providerReference: string; rawResponse: string }
  | { outcome: "rejected"; messages: string[]; providerReference: string | null; rawResponse: string }
  | { outcome: "unavailable"; reason: string };

export interface FiscalStatus {
  known: boolean;
  status: string | null;
  rawResponse: string;
}

export interface SIAPPAdapter {
  /** A name for logs and the Integration Monitor. Never a credential. */
  readonly providerName: string;
  /** False when the adapter cannot reach a real provider, so callers can refuse before queueing work. */
  readonly configured: boolean;
  submit(doc: FiscalDocument): Promise<FiscalOutcome>;
  /** Ask the provider what it currently holds for a document, for reconciliation. */
  checkStatus(irn: string): Promise<FiscalStatus>;
  cancel(irn: string, reason: string): Promise<FiscalOutcome>;
}
