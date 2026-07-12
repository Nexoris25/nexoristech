/**
 * CRM document templates (PRD 5.10): the four template types CRM owns on the shared Document
 * Engine, in the Nexoris Technologies brand: Proposal, Scope of Work, Service Level Agreement, and
 * Contract. CRM has no invoice template of any kind; invoices are raised only in Finance. The
 * salesperson supplies every figure and term; each document is reviewed before it is sent.
 */
import type { ReactNode } from "react";
import { FileText, ScrollText, ShieldCheck, FileSignature } from "lucide-react";
import { requireStaff } from "../../../../lib/auth.js";
import { GenerateDocument } from "../[id]/GenerateDocument.js";

export const dynamic = "force-dynamic";

const TEMPLATES = [
  { icon: FileText, name: "Proposal", line: "A scoped, priced proposal for a prospect." },
  { icon: ScrollText, name: "Scope of Work", line: "What is in and out of the engagement." },
  { icon: ShieldCheck, name: "Service Level Agreement", line: "Response times and commitments." },
  { icon: FileSignature, name: "Contract", line: "The agreement, ready for signature." },
] as const;

export default async function TemplatesPage(): Promise<ReactNode> {
  await requireStaff();

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-roboto text-dash-title font-700 text-ink-950">Document templates</h1>
      <p className="mt-1 text-label text-neutral-600">
        Proposal, Scope of Work, Service Level Agreement, and Contract, in the Nexoris Technologies
        brand. Invoices are raised only in Finance.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
        {TEMPLATES.map((template) => (
          <div
            key={template.name}
            className="rounded-card border border-purple-200 bg-white p-4 shadow-subtle"
          >
            <span className="grid h-9 w-9 place-items-center rounded-card bg-purple-100 text-purple-600">
              <template.icon size={16} strokeWidth={2} />
            </span>
            <p className="mt-2.5 text-dash-data font-700 text-ink-950">{template.name}</p>
            <p className="mt-0.5 text-[0.72rem] leading-snug text-neutral-600">{template.line}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-card border border-purple-200 bg-white p-4 shadow-subtle sm:p-5">
        <h2 className="text-dash-section font-700 text-ink-950">Generate a document</h2>
        <p className="mt-1 text-[0.78rem] text-neutral-600">
          Pick the kind, write the content, add any priced line items, and generate a selectable PDF.
          You supply every figure and term; review it before you send it.
        </p>
        <div className="mt-4 max-w-xl">
          <GenerateDocument />
        </div>
      </div>
    </div>
  );
}
