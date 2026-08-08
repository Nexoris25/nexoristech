import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireCmsAccess } from "../../../../../lib/auth.js";
import { cmsDb } from "../../../../../lib/cms-db.js";
import { CategoryForm } from "../CategoryForm.js";

export const dynamic = "force-dynamic";

export default async function NewCategoryPage(): Promise<ReactNode> {
  await requireCmsAccess();
  const { rows: parents } = await cmsDb().query<{ id: string; name: string }>("SELECT id, name FROM cms_category ORDER BY name");
  return (
    <div>
      <Link href="/cms/categories" className="inline-flex items-center gap-1.5 text-[0.8rem] font-600 text-slate-500 hover:text-[#543CDA]"><ArrowLeft size={15} /> Back to Categories</Link>
      <h1 className="mt-3 text-[1.4rem] font-700 text-slate-900">Create New Category</h1>
      <p className="mt-1 text-[0.86rem] text-slate-500">Add a new category to organize your insights.</p>
      <div className="mt-5"><CategoryForm parents={parents} /></div>
    </div>
  );
}
