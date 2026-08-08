/**
 * Insights list (CMS design). The blog/insight articles that power the public site. Rows show the title,
 * category, author, status, views and publish date. Titles use the short title so long headlines never
 * crowd the table. Status pills cover the editorial lifecycle (published / in review / draft / scheduled).
 * Admin only. Reads nexoris_cms.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, Plus, Search, Eye } from "lucide-react";
import { requireCmsAccess } from "../../../../lib/auth.js";
import { Pagination, currentPage, perPageFrom } from "../../../../components/cms/Pagination.js";
import { ListFilters } from "../../../../components/cms/ListFilters.js";
import { filterClause } from "../../../../lib/list-filters.js";
import { cmsDb } from "../../../../lib/cms-db.js";
import { RowActions } from "../../../../components/cms/RowActions.js";

export const dynamic = "force-dynamic";

interface Row { id: string; title: string; short_title: string | null; slug: string; category: string | null; author: string | null; status: string; views: string; published_at: string | null; }
function abbr(n: number): string { return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : String(n); }

const STATUS: Record<string, { bg: string; fg: string; label: string }> = {
  published: { bg: "#DCFCE7", fg: "#16A34A", label: "Published" },
  in_review: { bg: "#FEF3C7", fg: "#B45309", label: "In Review" },
  draft: { bg: "#F1F5F9", fg: "#64748B", label: "Draft" },
  scheduled: { bg: "#EDE9FE", fg: "#6D28D9", label: "Scheduled" },
  archived: { bg: "#F1F5F9", fg: "#94A3B8", label: "Archived" },
};

export default async function InsightsPage({ searchParams }: { searchParams: Promise<{ page?: string; per?: string; q?: string; status?: string }> }): Promise<ReactNode> {
  const { page: pageParam, per, q, status } = await searchParams;

  // Both the count and the page query must apply the same filter, or the pager describes a
  // different result set from the one on screen.
  const filters = filterClause([
    { column: "c.title", value: q, mode: "ilike" },
    { column: "c.status", value: status, mode: "eq" },
  ]);
  // Counted before the rows are fetched so the requested page can be clamped: asking for a page past
  // the end should show the last page, not an empty table.
  const { rows: [pgTot] } = await cmsDb().query<{ n: string }>(
    `SELECT count(*)::text n FROM cms_content c WHERE c.kind='insight'${filters.sql}`,
    filters.values);
  const total = Number(pgTot?.n ?? 0);
  const perPage = perPageFrom(per);
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const page = currentPage(pageParam, pageCount);

  await requireCmsAccess();
  const { rows } = await cmsDb().query<Row>(
    `SELECT c.id, c.title, c.short_title, c.slug, cat.name AS category, a.name AS author, c.status, c.views::text,
            c.published_at::text
       FROM cms_content c
       LEFT JOIN cms_category cat ON cat.id = c.category_id
       LEFT JOIN cms_author a ON a.id = c.author_id
      WHERE c.kind = 'insight'${filters.sql}
      ORDER BY c.published_at DESC NULLS LAST, c.created_at DESC
      LIMIT $${filters.values.length + 1} OFFSET $${filters.values.length + 2}`,
    [...filters.values, perPage, (page - 1) * perPage]);


  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900">Insights</h1>
          <p className="mt-1 text-[0.86rem] text-slate-500">Create and manage the articles that power your public site.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/cms/insights/new" className="inline-flex items-center gap-1.5 rounded-lg bg-[#543CDA] px-4 py-2 text-[0.82rem] font-600 text-white hover:bg-[#4330B8]"><Plus size={15} strokeWidth={2.4} /> New Insight</Link>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-subtle">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3">
          <div className="relative min-w-0 flex-1 sm:max-w-sm"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input placeholder="Search insights..." className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-[0.83rem] focus:border-[#543CDA] focus:bg-white focus:outline-none" /></div>
          <div className="relative"><select className="cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-[0.8rem] font-600 text-slate-600"><option>Category: All</option></select><ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500" /></div>
          <div className="relative"><select className="cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-[0.8rem] font-600 text-slate-600"><option>Author: All</option></select><ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500" /></div>
        </div>
        <ListFilters
          searchPlaceholder="Search insights by title..."
          selects={[{
            param: "status",
            allLabel: "All statuses",
            options: [
              { value: "published", label: "Published" },
              { value: "in_review", label: "In Review" },
              { value: "draft", label: "Draft" },
              { value: "scheduled", label: "Scheduled" },
              { value: "archived", label: "Archived" },
            ],
          }]}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead><tr className="border-b border-slate-200 bg-slate-50 text-[0.66rem] uppercase tracking-wide text-slate-500"><th className="px-5 py-3 font-600">Title</th><th className="px-5 py-3 font-600">Category</th><th className="px-5 py-3 font-600">Author</th><th className="px-5 py-3 font-600">Status</th><th className="px-5 py-3 font-600">Views</th><th className="px-5 py-3 font-600">Published</th><th className="px-5 py-3 text-right font-600">Actions</th></tr></thead>
            <tbody>
              {rows.map((r) => {
                const s = STATUS[r.status] ?? STATUS.draft!;
                return (
                  <tr key={r.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                    <td className="px-5 py-3"><Link href={`/cms/insights/${r.id}`} title={r.title} className="block max-w-[22rem] truncate text-[0.85rem] font-600 text-slate-900 hover:text-[#543CDA]">{r.short_title ?? r.title}</Link></td>
                    <td className="px-5 py-3">{r.category ? <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[0.72rem] font-500 text-slate-600">{r.category}</span> : <span className="text-slate-300">—</span>}</td>
                    <td className="px-5 py-3 text-[0.82rem] text-slate-600">{r.author ?? "—"}</td>
                    <td className="px-5 py-3"><span className="inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-600" style={{ background: s.bg, color: s.fg }}>{s.label}</span></td>
                    <td className="px-5 py-3"><span className="inline-flex items-center gap-1 text-[0.82rem] font-600 text-slate-700"><Eye size={13} className="text-slate-500" />{abbr(+r.views)}</span></td>
                    <td className="px-5 py-3 text-[0.8rem] text-slate-600">{r.published_at ? new Date(r.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : <span className="text-slate-300">—</span>}</td>
                    <td className="px-5 py-3 text-right"><RowActions id={r.id} kind="insight" status={r.status} editHref={`/cms/insights/${r.id}`} viewHref={`https://nexoristech.com/insights/${r.slug}`} back="/cms/insights" label={r.title} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-5 py-3 text-[0.8rem] text-slate-500">
          <Pagination page={page} pageCount={pageCount} total={total} basePath="/cms/insights" noun="insights" perPage={perPage} />
        </div>
      </div>
    </div>
  );
}
