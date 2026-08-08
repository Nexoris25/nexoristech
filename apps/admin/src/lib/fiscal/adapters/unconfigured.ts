/**
 * The adapter that runs when no accredited SI/APP is configured, which is the situation today.
 *
 * It fails closed. Every call reports `unavailable`, so a document stays exactly where it was and no
 * fiscal field is ever written. That is the honest state: with no provider, nothing has been submitted
 * to the Nigeria Revenue Service, and the system should say so rather than manufacture a reassuring
 * answer.
 *
 * This deliberately replaces the earlier simulated submission, which invented an IRN, a verification URL
 * and an acceptance, and wrote them to the document as though a tax authority had issued them.
 */
import type { SIAPPAdapter, FiscalOutcome, FiscalStatus } from "../adapter.js";

const REASON = "No accredited SI/APP is configured, so nothing can be submitted to the Nigeria Revenue Service.";

export class UnconfiguredAdapter implements SIAPPAdapter {
  readonly providerName = "None configured";
  readonly configured = false;

  submit(): Promise<FiscalOutcome> {
    return Promise.resolve({ outcome: "unavailable", reason: REASON });
  }

  checkStatus(): Promise<FiscalStatus> {
    return Promise.resolve({ known: false, status: null, rawResponse: REASON });
  }

  cancel(): Promise<FiscalOutcome> {
    return Promise.resolve({ outcome: "unavailable", reason: REASON });
  }
}
