/**
 * Receivables now live on the single commercial invoice (Finance > Invoices). This legacy route
 * forwards to the unpaid-invoices view so there is only ever one invoice of record.
 */
import { redirect } from "next/navigation";

export default function ReceivablesRedirect(): never {
  redirect("/finance/invoices?pay=unpaid");
}
