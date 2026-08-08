/**
 * Templates list (CMS Programmatic SEO design). Templates used to generate programmatic pages. Columns:
 * template name, type, variable count, pages generated (live), status, updated. CMS access only.
 * Responsive: the table scrolls inside its own container down to 360px.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { Plus, LayoutTemplate } from "lucide-react";
import { ListFilters } from "../../../../components/cms/ListFilters.js";
import { filterClause } from "../../../../lib/list-filters.js";
import { requireCmsAccess } from "../../../../lib/auth.js";
import { cmsDb } from "../../../../lib/cms-db.js";
import { RecordActions } from "../../../../components/cms/RecordActions.js";

export const dynamic = "force-dynamic";

interface Row { id: string; name: string; type: string; variables: unknown[]; active: boolean; updated_at: string; pages: string }

export default async function TemplatesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }): Promise<ReactNode> {
  const { q } = await searchParams;
  const filters = filterClause([{ column: "t.name", value: q, mode: "ilike" }]);
  await requireCmsAccess();
  const { rows } = await cmsDb().query<Row>(
    `SELECT t.id, t.name, t.type, t.variables, t.active, t.updated_at::text,
            (SELECT count(*) FROM cms_content c WHERE c.kind='generated_page' AND c.template = t.name)::text AS pages
       FROM cms_template t WHERE true${filters.sql} ORDER BY t.name`, filters.values);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900">Templates</h1>
          <p className="mt-1 text-[0.86rem] text-slate-500">Manage templates used to generate programmatic pages.</p>
        </div>
        <Link href="/cms/templates/new" className="inline-flex items-center gap-1.5 rounded-lg bg-[#543CDA] px-4 py-2 text-[0.82rem] font-600 text-white hover:bg-[#4330B8]"><Plus size={15} strokeWidth={2.4} /> Create Template</Link>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-subtle">
        <ListFilters searchPlaceholder="Search templates by name..." />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead><tr className="border-b border-slate-200 bg-slate-50 text-[0.66rem] uppercase tracking-wide text-slate-500"><th className="px-5 py-3 font-600">Template Name</th><th className="px-5 py-3 font-600">Type</th><th className="px-5 py-3 font-600">Variables</th><th className="px-5 py-3 font-600">Pages Generated</th><th className="px-5 py-3 font-600">Status</th><th className="px-5 py-3 font-600">Updated</th><th className="px-5 py-3 text-right font-600">Actions</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                  <td className="px-5 py-3"><Link href={`/cms/templates/${r.id}`} className="flex items-center gap-2.5"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#EEEBFC] text-[#543CDA]"><LayoutTemplate size={15} /></span><span className="text-[0.85rem] font-600 text-slate-900">{r.name}</span></Link></td>
                  <td className="px-5 py-3"><span className="rounded-md bg-slate-100 px-2 py-0.5 text-[0.72rem] font-500 text-slate-600">{r.type}</span></td>
                  <td className="px-5 py-3 text-[0.84rem] font-600 text-slate-700">{Array.isArray(r.variables) ? r.variables.length : 0}</td>
                  <td className="px-5 py-3 text-[0.84rem] font-600 text-slate-800">{Number(r.pages).toLocaleString()}</td>
                  <td className="px-5 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-600 ${r.active ? "bg-[#DCFCE7] text-[#15803D]" : "bg-slate-100 text-slate-600"}`}>{r.active ? "Active" : "Inactive"}</span></td>
                  <td className="px-5 py-3 text-[0.8rem] text-slate-500">{new Date(r.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                  <td className="px-5 py-3 text-right"><RecordActions entity="template" id={String(r.id)} editHref={`/cms/templates/${r.id}`} label={r.name} back="/cms/templates" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-5 py-3 text-[0.8rem] text-slate-500">
          <span>{rows.length} {rows.length === 1 ? "template" : "templates"}</span>
        </div>
      </div>
    </div>
  );
}
