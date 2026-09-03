import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireCmsAccess } from "../../../../../lib/auth.js";
import { cmsDb } from "../../../../../lib/cms-db.js";
import { CategoryForm } from "../CategoryForm.js";
import { requireUuid } from "../../../../../lib/route-params.js";

export const dynamic = "force-dynamic";

interface Cat { id: string; name: string; short_name: string | null; slug: string; description: string | null; parent_id: string | null; active: boolean; created_at: string; created_by: string | null; updated_at: string; updated_by: string | null; count: string }

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }): Promise<ReactNode> {
  await requireCmsAccess();
  const { id } = await params;
  requireUuid(id);
  const pool = cmsDb();
  const [{ rows }, { rows: parents }] = await Promise.all([
    pool.query<Cat>(
      `SELECT id, name, short_name, slug, description, parent_id, active, created_at::text, created_by, updated_at::text, updated_by,
              (SELECT count(*) FROM cms_content WHERE category_id=cms_category.id)::text count
         FROM cms_category WHERE id=$1`, [id]),
    pool.query<{ id: string; name: string }>("SELECT id, name FROM cms_category ORDER BY name"),
  ]);
  const c = rows[0];
  if (!c) notFound();
  const fmt = (s: string): string => new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div>
      <Link href="/cms/categories" className="inline-flex items-center gap-1.5 text-[0.8rem] font-600 text-slate-500 hover:text-[#543CDA]"><ArrowLeft size={15} /> Back to Categories</Link>
      <h1 className="mt-3 text-[1.4rem] font-700 text-slate-900">Edit Category</h1>
      <p className="mt-1 text-[0.86rem] text-slate-500">Update the details of this category.</p>
      <div className="mt-5">
        <CategoryForm
          parents={parents}
          initial={{
            id: c.id, name: c.name, shortName: c.short_name ?? "", slug: c.slug, description: c.description ?? "", parent_id: c.parent_id ?? "",
            active: c.active, count: Number(c.count),
            created: `${fmt(c.created_at)}${c.created_by ? ` by ${c.created_by}` : ""}`,
            updated: `${fmt(c.updated_at)}${c.updated_by ? ` by ${c.updated_by}` : ""}`,
          }}
        />
      </div>
    </div>
  );
}
