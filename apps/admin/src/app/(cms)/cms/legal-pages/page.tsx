/**
 * Legal Pages list (CMS design). Policy pages (privacy, terms, cookies, etc.) with their current version,
 * last-updated date, and status. Columns match the design: a select checkbox, title, version, last
 * updated, status, and actions. Admin only. Reads nexoris_cms.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { Plus, Scale } from "lucide-react";
import { requireCmsAccess } from "../../../../lib/auth.js";
import { cmsDb } from "../../../../lib/cms-db.js";
import { Pagination, currentPage, perPageFrom } from "../../../../components/cms/Pagination.js";
import { ListFilters } from "../../../../components/cms/ListFilters.js";
import { filterClause } from "../../../../lib/list-filters.js";
import { RowActions } from "../../../../components/cms/RowActions.js";

export const dynamic = "force-dynamic";

interface Row { id: string; title: string; slug: string; version: string | null; status: string; updated_at: string }
const STATUS: Record<string, { bg: string; fg: string; label: string }> = {
  published: { bg: "#DCFCE7", fg: "#16A34A", label: "Published" },
  draft: { bg: "#F1F5F9", fg: "#64748B", label: "Draft" },
  in_review: { bg: "#FEF3C7", fg: "#B45309", label: "In Review" },
  archived: { bg: "#F1F5F9", fg: "#94A3B8", label: "Archived" },
};

export default async function LegalPagesPage({ searchParams }: { searchParams: Promise<{ page?: string; per?: string; q?: string; status?: string }> }): Promise<ReactNode> {
  await requireCmsAccess();
  const { page: pageParam, per, q, status } = await searchParams;

  // The count and the page query must apply the same filter, or the pager describes a different
  // result set from the one on screen.
  const filters = filterClause([
    { column: "title", value: q, mode: "ilike" },
    { column: "status", value: status, mode: "eq" },
  ]);
  const { rows: [tot] } = await cmsDb().query<{ n: string }>(
    `SELECT count(*)::text n FROM cms_content WHERE kind='legal_page'${filters.sql}`,
    filters.values);
  const total = Number(tot?.n ?? 0);
  const perPage = perPageFrom(per);
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const page = currentPage(pageParam, pageCount);
  const { rows } = await cmsDb().query<Row>(
    `SELECT id, title, slug, version, status, COALESCE(updated_at, created_at)::text AS updated_at
       FROM cms_content WHERE kind='legal_page'${filters.sql}
      ORDER BY title
      LIMIT $${filters.values.length + 1} OFFSET $${filters.values.length + 2}`,
    [...filters.values, perPage, (page - 1) * perPage]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900">Legal Pages</h1>
          <p className="mt-1 text-[0.86rem] text-slate-500">Manage legal pages and policies with versioning.</p>
        </div>
        <Link href="/cms/legal-pages/new" className="inline-flex items-center gap-1.5 rounded-lg bg-[#543CDA] px-4 py-2 text-[0.82rem] font-600 text-white hover:bg-[#4330B8]"><Plus size={15} strokeWidth={2.4} /> Add Legal Page</Link>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-subtle">
        <ListFilters
          searchPlaceholder="Search legal pages by title..."
          selects={[{ param: "status", allLabel: "All statuses", options: [
              { value: "published", label: "Published" },
              { value: "draft", label: "Draft" },
              { value: "in_review", label: "In Review" },
              { value: "archived", label: "Archived" },
            ] }]}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead><tr className="border-b border-slate-200 bg-slate-50 text-[0.66rem] uppercase tracking-wide text-slate-500"><th className="w-10 px-5 py-3"><input type="checkbox" aria-label="Select all" className="h-3.5 w-3.5 rounded border-slate-300 accent-[#543CDA]" /></th><th className="px-5 py-3 font-600">Title</th><th className="px-5 py-3 font-600">Version</th><th className="px-5 py-3 font-600">Last Updated</th><th className="px-5 py-3 font-600">Status</th><th className="px-5 py-3 text-right font-600">Actions</th></tr></thead>
            <tbody>
              {rows.map((r) => {
                const s = STATUS[r.status] ?? STATUS.draft!;
                return (
                  <tr key={r.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                    <td className="px-5 py-3"><input type="checkbox" aria-label={`Select ${r.title}`} className="h-3.5 w-3.5 rounded border-slate-300 accent-[#543CDA]" /></td>
                    <td className="px-5 py-3"><Link href={`/cms/legal-pages/${r.id}`} className="inline-flex items-center gap-2 text-[0.85rem] font-600 text-slate-900 hover:text-[#543CDA]"><Scale size={14} className="text-slate-500" />{r.title}</Link></td>
                    <td className="px-5 py-3"><span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[0.74rem] text-slate-600">v{r.version ?? "1.0"}</span></td>
                    <td className="px-5 py-3 text-[0.8rem] text-slate-500">{new Date(r.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                    <td className="px-5 py-3"><span className="inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-600" style={{ background: s.bg, color: s.fg }}>{s.label}</span></td>
                    <td className="px-5 py-3 text-right"><RowActions id={r.id} kind="legal_page" status={r.status} editHref={`/cms/legal-pages/${r.id}`} viewHref={`https://nexoristech.com/${r.slug}`} back="/cms/legal-pages" label={r.title} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-5 py-3 text-[0.8rem] text-slate-500">
          <Pagination page={page} pageCount={pageCount} total={total} basePath="/cms/legal-pages" noun="legal pages" perPage={perPage} />
        </div>
      </div>
    </div>
  );
}
