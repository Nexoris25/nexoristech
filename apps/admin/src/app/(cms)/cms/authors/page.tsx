/**
 * Authors list (CMS design). Manage author profiles and contributors. Each row shows the author, role,
 * expertise, their published-insight count and total views (derived live from their content), status,
 * and last active date. Admin only.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Pagination, currentPage, perPageFrom } from "../../../../components/cms/Pagination.js";
import { ListFilters } from "../../../../components/cms/ListFilters.js";
import { filterClause } from "../../../../lib/list-filters.js";
import { requireCmsAccess } from "../../../../lib/auth.js";
import { cmsDb } from "../../../../lib/cms-db.js";
import { RecordActions } from "../../../../components/cms/RecordActions.js";

export const dynamic = "force-dynamic";

interface Row { id: string; name: string; email: string | null; role: string; expertise: string[]; active: boolean; pub: string; views: string }
function abbr(n: number): string { return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : String(n); }
const AV = ["#543CDA", "#14B8A6", "#3B82F6", "#F59E0B", "#EC4899", "#8B5CF6"];

export default async function AuthorsPage({ searchParams }: { searchParams: Promise<{ page?: string; per?: string; q?: string }> }): Promise<ReactNode> {
  const { page: pageParam, per, q } = await searchParams;
  const filters = filterClause([{ column: "a.name", value: q, mode: "ilike" }]);
  await requireCmsAccess();

  // The count carries the same filter as the rows, so the pager describes what is on screen.
  const { rows: [tot] } = await cmsDb().query<{ n: string }>(
    `SELECT count(*)::text n FROM cms_author a WHERE true${filters.sql}`, filters.values);
  const total = Number(tot?.n ?? 0);
  const perPage = perPageFrom(per);
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const page = currentPage(pageParam, pageCount);

  const { rows } = await cmsDb().query<Row>(
    `SELECT a.id, a.name, a.email, a.role, a.expertise, a.active,
            (SELECT count(*) FROM cms_content WHERE author_id=a.id AND kind='insight' AND status='published')::text pub,
            (SELECT COALESCE(sum(views),0) FROM cms_content WHERE author_id=a.id)::text views
       FROM cms_author a WHERE true${filters.sql}
      ORDER BY a.name
      LIMIT $${filters.values.length + 1} OFFSET $${filters.values.length + 2}`,
    [...filters.values, perPage, (page - 1) * perPage]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900">Authors</h1>
          <p className="mt-1 text-[0.86rem] text-slate-500">Manage author profiles and contributors.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/cms/authors/new" className="inline-flex items-center gap-1.5 rounded-lg bg-[#543CDA] px-4 py-2 text-[0.82rem] font-600 text-white hover:bg-[#4330B8]"><Plus size={15} strokeWidth={2.4} /> New Author</Link>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-subtle">
        <ListFilters searchPlaceholder="Search authors by name..." />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left">
            <thead><tr className="border-b border-slate-200 bg-slate-50 text-[0.66rem] uppercase tracking-wide text-slate-500"><th className="px-5 py-3 font-600">Author</th><th className="px-5 py-3 font-600">Role</th><th className="px-5 py-3 font-600">Expertise</th><th className="px-5 py-3 font-600">Published Insights</th><th className="px-5 py-3 font-600">Total Views</th><th className="px-5 py-3 font-600">Status</th><th className="px-5 py-3 text-right font-600">Actions</th></tr></thead>
            <tbody>
              {rows.map((a, i) => (
                <tr key={a.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                  <td className="px-5 py-3">
                    <Link href={`/cms/authors/${a.id}`} className="flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full font-mono text-[0.64rem] font-700 text-white" style={{ background: AV[i % AV.length] }}>{a.name.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase()}</span>
                      <span className="min-w-0"><span className="block text-[0.85rem] font-600 text-slate-900">{a.name}</span><span className="block truncate text-[0.74rem] text-slate-500">{a.email ?? ""}</span></span>
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-[0.82rem] text-slate-600">{a.role}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap items-center gap-1">
                      {a.expertise.slice(0, 2).map((e) => <span key={e} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[0.7rem] font-500 text-slate-600">{e}</span>)}
                      {a.expertise.length > 2 ? <span className="text-[0.7rem] font-600 text-slate-500">+{a.expertise.length - 2}</span> : null}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[0.84rem] font-600 text-slate-800">{a.pub}</td>
                  <td className="px-5 py-3 text-[0.84rem] font-600 text-slate-800">{abbr(+a.views)}</td>
                  <td className="px-5 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-600 ${a.active ? "bg-[#DCFCE7] text-[#15803D]" : "bg-slate-100 text-slate-600"}`}>{a.active ? "Active" : "Inactive"}</span></td>
                  
                  <td className="px-5 py-3 text-right"><RecordActions entity="author" id={String(a.id)} editHref={`/cms/authors/${a.id}/edit`} label={a.name} back="/cms/authors" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-5 py-3 text-[0.8rem] text-slate-500">
          <Pagination page={page} pageCount={pageCount} total={total} basePath="/cms/authors" noun="authors" perPage={perPage} />
        </div>
      </div>
    </div>
  );
}
