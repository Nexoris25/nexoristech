import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireCmsAccess } from "../../../../../lib/auth.js";
import { TemplateForm } from "../TemplateForm.js";

export const dynamic = "force-dynamic";

export default async function NewTemplatePage(): Promise<ReactNode> {
  await requireCmsAccess();
  return (
    <div>
      <Link href="/cms/templates" className="inline-flex items-center gap-1.5 text-[0.8rem] font-600 text-slate-500 hover:text-[#543CDA]"><ArrowLeft size={15} /> Back to Templates</Link>
      <h1 className="mt-3 text-[1.4rem] font-700 text-slate-900">Create Template</h1>
      <p className="mt-1 text-[0.86rem] text-slate-500">Define the structure, variables, and prompts for AI generation.</p>
      <div className="mt-5"><TemplateForm /></div>
    </div>
  );
}
