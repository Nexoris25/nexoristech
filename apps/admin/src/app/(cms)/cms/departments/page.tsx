/**
 * Departments list (CMS Careers design). Departments organise jobs. Columns: department (with a coloured
 * hash), description, live job count, status, display order, and actions. CMS access only. Responsive.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { Plus, Hash } from "lucide-react";
import { ListFilters } from "../../../../components/cms/ListFilters.js";
import { filterClause } from "../../../../lib/list-filters.js";
import { requireCmsAccess } from "../../../../lib/auth.js";
import { cmsDb } from "../../../../lib/cms-db.js";
import { RecordActions } from "../../../../components/cms/RecordActions.js";

export const dynamic = "force-dynamic";

interface Row { id: string; name: string; description: string | null; display_order: number; active: boolean; jobs: string }
const ICON_COLORS = ["#543CDA", "#14B8A6", "#3B82F6", "#F59E0B", "#EC4899", "#8B5CF6", "#EF4444"];

export default async function DepartmentsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }): Promise<ReactNode> {
  const { q } = await searchParams;
  const filters = filterClause([{ column: "d.name", value: q, mode: "ilike" }]);
  await requireCmsAccess();
  const { rows } = await cmsDb().query<Row>(
    `SELECT d.id, d.name, d.description, d.display_order, d.active,
            (SELECT count(*) FROM cms_content c WHERE c.kind='job' AND c.department = d.name)::text AS jobs
       FROM cms_department d WHERE true${filters.sql} ORDER BY d.display_order, d.name`, filters.values);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900">Departments</h1>
          <p className="mt-1 text-[0.86rem] text-slate-500">Manage departments used for organising job positions.</p>
        </div>
        <Link href="/cms/departments/new" className="inline-flex items-center gap-1.5 rounded-lg bg-[#543CDA] px-4 py-2 text-[0.82rem] font-600 text-white hover:bg-[#4330B8]"><Plus size={15} strokeWidth={2.4} /> Create Department</Link>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-subtle">
        <ListFilters searchPlaceholder="Search departments by name..." />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead><tr className="border-b border-slate-200 bg-slate-50 text-[0.66rem] uppercase tracking-wide text-slate-500"><th className="px-5 py-3 font-600">Department</th><th className="px-5 py-3 font-600">Description</th><th className="px-5 py-3 font-600">Jobs</th><th className="px-5 py-3 font-600">Status</th><th className="px-5 py-3 font-600">Order</th><th className="px-5 py-3 text-right font-600">Actions</th></tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                  <td className="px-5 py-3"><Link href={`/cms/departments/${r.id}`} className="flex items-center gap-2.5"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white" style={{ background: ICON_COLORS[i % ICON_COLORS.length] }}><Hash size={15} /></span><span className="text-[0.85rem] font-600 text-slate-900">{r.name}</span></Link></td>
                  <td className="px-5 py-3"><span className="block max-w-[22rem] truncate text-[0.82rem] text-slate-500">{r.description ?? "—"}</span></td>
                  <td className="px-5 py-3 text-[0.84rem] font-600 text-slate-800">{r.jobs}</td>
                  <td className="px-5 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-600 ${r.active ? "bg-[#DCFCE7] text-[#15803D]" : "bg-slate-100 text-slate-600"}`}>{r.active ? "Active" : "Inactive"}</span></td>
                  <td className="px-5 py-3 text-[0.82rem] font-600 text-slate-600">{r.display_order}</td>
                  <td className="px-5 py-3 text-right"><RecordActions entity="department" id={String(r.id)} editHref={`/cms/departments/${r.id}`} label={r.name} back="/cms/departments" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-5 py-3 text-[0.8rem] text-slate-500">
          <span>{rows.length} {rows.length === 1 ? "department" : "departments"}</span>
        </div>
      </div>
    </div>
  );
}
