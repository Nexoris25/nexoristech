import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireCmsAccess } from "../../../../../lib/auth.js";
import { cmsDb } from "../../../../../lib/cms-db.js";
import { TemplateForm } from "../TemplateForm.js";
import { requireUuid } from "../../../../../lib/route-params.js";

export const dynamic = "force-dynamic";

interface Variable { token: string; label: string }
interface Row { id: string; name: string; type: string; description: string | null; sections: string[]; variables: Variable[]; active: boolean; in_proposals: boolean }

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }): Promise<ReactNode> {
  await requireCmsAccess();
  const { id } = await params;
  requireUuid(id);
  const { rows } = await cmsDb().query<Row>("SELECT id, name, type, description, sections, variables, active, in_proposals FROM cms_template WHERE id=$1", [id]);
  const t = rows[0];
  if (!t) notFound();
  return (
    <div>
      <Link href="/cms/templates" className="inline-flex items-center gap-1.5 text-[0.8rem] font-600 text-slate-500 hover:text-[#543CDA]"><ArrowLeft size={15} /> Back to Templates</Link>
      <h1 className="mt-3 text-[1.4rem] font-700 text-slate-900">Edit Template</h1>
      <p className="mt-1 text-[0.86rem] text-slate-500">Update your template structure and settings.</p>
      <div className="mt-5">
        <TemplateForm initial={{
          id: t.id, name: t.name, type: t.type, description: t.description ?? "",
          sections: Array.isArray(t.sections) ? t.sections : [], variables: Array.isArray(t.variables) ? t.variables : [],
          active: t.active, inProposals: t.in_proposals,
        }} />
      </div>
    </div>
  );
}
