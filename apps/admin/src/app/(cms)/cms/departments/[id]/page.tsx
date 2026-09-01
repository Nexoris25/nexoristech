import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireCmsAccess } from "../../../../../lib/auth.js";
import { cmsDb } from "../../../../../lib/cms-db.js";
import { DepartmentForm } from "../DepartmentForm.js";
import { requireUuid } from "../../../../../lib/route-params.js";

export const dynamic = "force-dynamic";

interface Row { id: string; name: string; slug: string | null; description: string | null; display_order: number; active: boolean }

export default async function EditDepartmentPage({ params }: { params: Promise<{ id: string }> }): Promise<ReactNode> {
  await requireCmsAccess();
  const { id } = await params;
  requireUuid(id);
  const { rows } = await cmsDb().query<Row>("SELECT id, name, slug, description, display_order, active FROM cms_department WHERE id=$1", [id]);
  const d = rows[0];
  if (!d) notFound();
  return (
    <div>
      <Link href="/cms/departments" className="inline-flex items-center gap-1.5 text-[0.8rem] font-600 text-slate-500 hover:text-[#543CDA]"><ArrowLeft size={15} /> Back to Departments</Link>
      <h1 className="mt-3 text-[1.4rem] font-700 text-slate-900">Edit Department</h1>
      <p className="mt-1 text-[0.86rem] text-slate-500">{d.name}</p>
      <div className="mt-5">
        <DepartmentForm initial={{ id: d.id, name: d.name, slug: d.slug ?? "", description: d.description ?? "", displayOrder: d.display_order, active: d.active }} />
      </div>
    </div>
  );
}
