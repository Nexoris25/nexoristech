/**
 * Raise Invoice (Finance). This is where the single commercial invoice is created - customer,
 * project, billing type, items, taxes, and payment terms - as a Draft in the ERP.
 *
 * It is a PDF invoice unless it is marked for the NRS on the form. Filing is opt-in and can also be
 * done later from the invoice itself, so the ordinary case never touches the tax authority.
 *
 * The projects passed to the form carry their contract value and the percentage already invoiced
 * against them, which is what lets the form show the amount and the remaining share while somebody
 * types. Those figures are a preview only: the server recomputes both from the database.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireCapability } from "../../../../../lib/auth.js";
import { db } from "../../../../../lib/db.js";
import { rulesForDate } from "../../../../../lib/fiscal/rules.js";
import { DocumentForm } from "../../../e-invoicing/_components/DocumentForm.js";
import type { FormMilestone, FormProject } from "../../../e-invoicing/_components/DocumentForm.js";
import { isUuid } from "../../../../../lib/route-params.js";

export const dynamic = "force-dynamic";

export default async function RaiseInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}): Promise<ReactNode> {
  await requireCapability("finance.invoice.raise");
  // The preview must price the way the server will, so it reads the same versioned rule rather than
  // the flat finance_settings number the two used to disagree over.
  const today = new Date().toISOString().slice(0, 10);
  const { project: projectParam } = await searchParams;
  const pool = db();

  const [rules, projects, milestones] = await Promise.all([
    rulesForDate(today),
    pool.query<FormProject>(
      `SELECT p.id, p.code, p.name, c.name client_name, p.contract_value::text,
              COALESCE((
                SELECT SUM(e.invoice_percentage)
                  FROM einvoice e
                 WHERE e.project_id = p.id AND e.doc_type = 'Invoice'
                   AND e.cancelled_at IS NULL AND e.invoice_percentage IS NOT NULL
              ), 0)::text billed_percent
         FROM project p JOIN client c ON c.id = p.client_id
        WHERE p.status IN ('Planned', 'Active', 'OnHold')
        ORDER BY p.created_at DESC LIMIT 300`,
    ),
    pool.query<FormMilestone>(
      "SELECT id, label, amount::text, project_id FROM project_milestone ORDER BY sort",
    ),
  ]);

  const initialProjectId =
    projectParam && isUuid(projectParam) && projects.rows.some((p) => p.id === projectParam)
      ? projectParam
      : "";

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/finance/invoices" className="inline-flex items-center gap-1.5 text-[0.8rem] font-600 text-[#543CDA] hover:text-[#4330B8]"><ArrowLeft size={15} strokeWidth={2.2} /> Invoices</Link>
      <h1 className="mt-3 text-[1.4rem] font-700 text-slate-900">Raise Invoice</h1>
      <p className="mt-1 text-[0.88rem] text-slate-500">Create the commercial invoice. It starts as a Draft; finalize it to send it to the customer.</p>
      <DocumentForm
        docType="Invoice"
        vatRate={Number(rules.vat?.rate ?? 0)}
        whtRate={Number(rules.wht?.rate ?? 0)}
        originals={[]}
        projects={projects.rows}
        milestones={milestones.rows}
        initialProjectId={initialProjectId}
      />
    </div>
  );
}
