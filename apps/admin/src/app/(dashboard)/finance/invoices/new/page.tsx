/**
 * Raise Invoice (Finance). This is where the single commercial invoice is created - customer, project,
 * billing type, items, taxes, and payment terms - as a Draft in the ERP. It is NOT yet an NRS
 * e-invoice: once finalized it becomes eligible for submission, which happens in the NRS e-Invoicing
 * module. Reuses the shared document form (doc type Invoice).
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "../../../../../lib/auth.js";
import { rulesForDate } from "../../../../../lib/fiscal/rules.js";
import { DocumentForm } from "../../../e-invoicing/_components/DocumentForm.js";

export const dynamic = "force-dynamic";

export default async function RaiseInvoicePage(): Promise<ReactNode> {
  await requireAdmin();
  // The preview must price the way the server will, so it reads the same versioned rule rather than
  // the flat finance_settings number the two used to disagree over.
  const today = new Date().toISOString().slice(0, 10);
  const { vat: vatRule, wht: whtRule } = await rulesForDate(today);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/finance/invoices" className="inline-flex items-center gap-1.5 text-[0.8rem] font-600 text-[#543CDA] hover:text-[#4330B8]"><ArrowLeft size={15} strokeWidth={2.2} /> Invoices</Link>
      <h1 className="mt-3 text-[1.4rem] font-700 text-slate-900">Raise Invoice</h1>
      <p className="mt-1 text-[0.88rem] text-slate-500">Create the commercial invoice. It starts as a Draft; finalize it to make it eligible for NRS submission.</p>
      <DocumentForm docType="Invoice" vatRate={Number(vatRule?.rate ?? 0)} whtRate={Number(whtRule?.rate ?? 0)} originals={[]} />
    </div>
  );
}
