/**
 * Categories list (CMS design). Organise insights with categories. A table of every category with its
 * slug, description, live content count (derived from the content linked to it), status, and who last
 * updated it. Filters, a status filter, and New Category sit in the header. Admin only.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, Plus, Hash } from "lucide-react";
import { requireCmsAccess } from "../../../../lib/auth.js";
import { cmsDb } from "../../../../lib/cms-db.js";
import { RecordActions } from "../../../../components/cms/RecordActions.js";

export const dynamic = "force-dynamic";

interface Row { id: string; name: string; slug: string; description: string | null; active: boolean; content_count: string }
const ICON_COLORS = ["#543CDA", "#14B8A6", "#3B82F6", "#F59E0B", "#06B6D4", "#8B5CF6", "#EC4899", "#22C55E"];

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }): Promise<ReactNode> {
  await requireCmsAccess();
  const { status } = await searchParams;
  const filter = status === "active" ? "WHERE c.active" : status === "inactive" ? "WHERE NOT c.active" : "";
  const { rows } = await cmsDb().query<Row>(
    `SELECT c.id, c.name, c.slug, c.description, c.active,
            (SELECT count(*) FROM cms_content WHERE category_id=c.id)::text content_count
       FROM cms_category c ${filter} ORDER BY c.name`);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900">Categories</h1>
          <p className="mt-1 text-[0.86rem] text-slate-500">Organize insights with categories to make content easier to manage and filter.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select defaultValue={status ?? ""} className="cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-[0.82rem] font-600 text-slate-700"><option value="">Status: All</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
            <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          </div>
          <Link href="/cms/categories/new" className="inline-flex items-center gap-1.5 rounded-lg bg-[#543CDA] px-4 py-2 text-[0.82rem] font-600 text-white hover:bg-[#4330B8]"><Plus size={15} strokeWidth={2.4} /> New Category</Link>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead><tr className="border-b border-slate-200 bg-slate-50 text-[0.68rem] uppercase tracking-wide text-slate-500">
              <th className="px-5 py-3 font-600">Category Name</th><th className="px-5 py-3 font-600">Slug</th><th className="px-5 py-3 font-600">Description</th><th className="px-5 py-3 font-600">Content Count</th><th className="px-5 py-3 font-600">Status</th><th className="px-5 py-3 text-right font-600">Actions</th>
            </tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white" style={{ background: ICON_COLORS[i % ICON_COLORS.length] }}><Hash size={16} strokeWidth={2.2} /></span>
                      <span className="text-[0.86rem] font-600 text-slate-900">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[0.8rem] text-slate-500">{r.slug}</td>
                  <td className="px-5 py-3.5 max-w-xs text-[0.82rem] text-slate-600">{r.description ?? "—"}</td>
                  <td className="px-5 py-3.5 text-[0.85rem] font-600 text-slate-800">{r.content_count}</td>
                  <td className="px-5 py-3.5"><span className={`inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-600 ${r.active ? "bg-[#DCFCE7] text-[#15803D]" : "bg-slate-100 text-slate-600"}`}>{r.active ? "Active" : "Inactive"}</span></td>
                  
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      
                      <RecordActions entity="category" id={String(r.id)} editHref={`/cms/categories/${r.id}`} label={r.name} back="/cms/categories" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
