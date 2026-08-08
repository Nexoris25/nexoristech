/**
 * Create-document page wrapper (PRD 15), shared by the three "new" routes. Loads the VAT/WHT rates and,
 * for a credit or debit note, the accepted invoices it can adjust, then hands off to the client form.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireFiscal } from "../../../../lib/fiscal/permissions.js";
import { rulesForDate } from "../../../../lib/fiscal/rules.js";
import { db } from "../../../../lib/db.js";
import { DOC_META, docNumber, type DocType } from "../../../../lib/einvoice.js";
import { DocumentForm } from "./DocumentForm.js";

export async function NewDocument({ docType }: { docType: DocType }): Promise<ReactNode> {
  await requireFiscal("INVOICE_VIEW");
  const meta = DOC_META[docType];
  const pool = db();
  // The preview prices from the same versioned rule the server will use, so the figures on screen
  // are the figures that get stored.
  const today = new Date().toISOString().slice(0, 10);
  const [{ vat: vatRule, wht: whtRule }, originals] = await Promise.all([
    rulesForDate(today),
    docType === "Invoice" ? Promise.resolve({ rows: [] as { id: string; seq: string; customer_name: string }[] })
      : pool.query<{ id: string; seq: string; customer_name: string }>(
        "SELECT id, seq::text, customer_name FROM einvoice WHERE doc_type='Invoice' AND status IN ('Accepted','Submitted') ORDER BY created_at DESC LIMIT 100"),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/e-invoicing/${meta.path}`} className="inline-flex items-center gap-1.5 text-[0.8rem] font-600 text-[#543CDA] hover:text-[#4330B8]"><ArrowLeft size={15} strokeWidth={2.2} /> {meta.label}s</Link>
      <h1 className="mt-3 text-[1.4rem] font-700 text-slate-900">Create {meta.label}</h1>
      <p className="mt-1 text-[0.88rem] text-slate-500">It starts as a Draft you review, then submit to the NRS.</p>
      <DocumentForm docType={docType} vatRate={Number(vatRule?.rate ?? 0)} whtRate={Number(whtRule?.rate ?? 0)}
        originals={originals.rows.map((o) => ({ id: o.id, label: `${docNumber("Invoice", o.seq)} · ${o.customer_name}` }))} />
    </div>
  );
}
