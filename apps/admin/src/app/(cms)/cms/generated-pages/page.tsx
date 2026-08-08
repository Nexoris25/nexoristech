/**
 * Generated Pages list (CMS Programmatic SEO design, PRD §9.6). AI-generated programmatic landing pages.
 * Columns match the design: page title, template, industry, target keyword, a circular SEO score, a
 * readiness percentage (the PRD §9.7 data-readiness gate), status, updated, and actions. CMS access only.
 * Responsive: the table scrolls inside its own container down to 360px.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireCmsAccess } from "../../../../lib/auth.js";
import { cmsDb } from "../../../../lib/cms-db.js";
import { RowActions } from "../../../../components/cms/RowActions.js";
import { ListFilters } from "../../../../components/cms/ListFilters.js";
import { filterClause } from "../../../../lib/list-filters.js";
import { Pagination, currentPage, perPageFrom } from "../../../../components/cms/Pagination.js";

export const dynamic = "force-dynamic";

interface Row { id: string; title: string; short_title: string | null; slug: string; template: string | null; industry: string | null; target_keyword: string | null; seo_score: number | null; readiness_score: number | null; status: string; updated_at: string }
const STATUS: Record<string, { bg: string; fg: string; label: string }> = {
  published: { bg: "#DCFCE7", fg: "#16A34A", label: "Published" },
  in_review: { bg: "#FEF3C7", fg: "#B45309", label: "In Review" },
  draft: { bg: "#F1F5F9", fg: "#64748B", label: "Draft" },
  archived: { bg: "#F1F5F9", fg: "#94A3B8", label: "Archived" },
};
function scoreColor(n: number | null): string { return n == null ? "#94A3B8" : n >= 85 ? "#16A34A" : n >= 70 ? "#B45309" : "#DC2626"; }
function ScoreBadge({ value }: { value: number | null }): ReactNode {
  if (value == null) return <span className="text-slate-300">—</span>;
  const r = 13, c = 2 * Math.PI * r, off = c - (value / 100) * c, color = scoreColor(value);
  return (
    <span className="relative inline-grid h-9 w-9 place-items-center">
      <svg viewBox="0 0 32 32" className="h-9 w-9 -rotate-90"><circle cx="16" cy="16" r={r} fill="none" stroke="#EEF2F7" strokeWidth="3" /><circle cx="16" cy="16" r={r} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} /></svg>
      <span className="absolute text-[0.66rem] font-700" style={{ color }}>{value}</span>
    </span>
  );
}

export default async function GeneratedPagesPage({ searchParams }: { searchParams: Promise<{ page?: string; per?: string; q?: string; status?: string }> }): Promise<ReactNode> {
  await requireCmsAccess();
  const { page: pageParam, per, q, status } = await searchParams;
  const pool = cmsDb();

  // Count first, so the page number can be clamped before the rows are fetched: asking for page 900 of
  // 99 should show the last page rather than an empty table.
  const filters = filterClause([
    { column: "title", value: q, mode: "ilike" },
    { column: "status", value: status, mode: "eq" },
  ]);
  const { rows: [tot] } = await pool.query<{ n: string }>(
    `SELECT count(*)::text n FROM cms_content WHERE kind='generated_page'${filters.sql}`,
    filters.values);
  const total = Number(tot?.n ?? 0);
  const perPage = perPageFrom(per);
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const page = currentPage(pageParam, pageCount);

  const { rows } = await pool.query<Row>(
    `SELECT id, title, short_title, slug, template, industry, target_keyword, seo_score, readiness_score, status,
            COALESCE(updated_at, created_at)::text AS updated_at
       FROM cms_content WHERE kind='generated_page'${filters.sql}
      ORDER BY COALESCE(updated_at, created_at) DESC
      LIMIT $${filters.values.length + 1} OFFSET $${filters.values.length + 2}`,
    [...filters.values, perPage, (page - 1) * perPage]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900">Generated Pages</h1>
          <p className="mt-1 text-[0.86rem] text-slate-500">Manage all your AI-generated programmatic landing pages.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/cms/generated-pages/new" className="inline-flex items-center gap-1.5 rounded-lg bg-[#543CDA] px-4 py-2 text-[0.82rem] font-600 text-white hover:bg-[#4330B8]"><Plus size={15} strokeWidth={2.4} /> Create Generated Page</Link>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-subtle">
        <ListFilters
          searchPlaceholder="Search generated pages by title..."
          selects={[{ param: "status", allLabel: "All statuses", options: [
            { value: "published", label: "Published" },
            { value: "draft", label: "Draft" },
            { value: "in_review", label: "In Review" },
            { value: "scheduled", label: "Scheduled" },
            { value: "archived", label: "Archived" },
          ] }]}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead><tr className="border-b border-slate-200 bg-slate-50 text-[0.66rem] uppercase tracking-wide text-slate-500"><th className="px-5 py-3 font-600">Page Title</th><th className="px-5 py-3 font-600">Template</th><th className="px-5 py-3 font-600">Industry</th><th className="px-5 py-3 font-600">Target Keyword</th><th className="px-5 py-3 font-600">SEO Score</th><th className="px-5 py-3 font-600">Readiness</th><th className="px-5 py-3 font-600">Status</th><th className="px-5 py-3 font-600">Updated</th><th className="px-5 py-3 text-right font-600">Actions</th></tr></thead>
            <tbody>
              {rows.map((r) => {
                const s = STATUS[r.status] ?? STATUS.draft!;
                return (
                  <tr key={r.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                    <td className="px-5 py-3"><Link href={`/cms/generated-pages/${r.id}`} title={r.title} className="block max-w-[16rem] truncate text-[0.85rem] font-600 text-slate-900 hover:text-[#543CDA]">{r.short_title ?? r.title}</Link></td>
                    <td className="px-5 py-3 text-[0.8rem] text-slate-600">{r.template ?? "—"}</td>
                    <td className="px-5 py-3 text-[0.82rem] text-slate-600">{r.industry ?? "—"}</td>
                    <td className="px-5 py-3"><span className="block max-w-[12rem] truncate text-[0.8rem] text-slate-500">{r.target_keyword ?? "—"}</span></td>
                    <td className="px-5 py-3"><ScoreBadge value={r.seo_score} /></td>
                    <td className="px-5 py-3"><span className="text-[0.84rem] font-700" style={{ color: scoreColor(r.readiness_score) }}>{r.readiness_score == null ? "—" : `${r.readiness_score}%`}</span></td>
                    <td className="px-5 py-3"><span className="inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-600" style={{ background: s.bg, color: s.fg }}>{s.label}</span></td>
                    <td className="px-5 py-3 text-[0.8rem] text-slate-500">{new Date(r.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                    <td className="px-5 py-3 text-right"><RowActions id={r.id} kind="generated_page" status={r.status} editHref={`/cms/generated-pages/${r.id}`} viewHref={`https://nexoristech.com/${r.slug}`} back="/cms/generated-pages" label={r.title} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* The old footer drew a static "1" badge that was not a control. */}
        <div className="border-t border-slate-100 px-5 pb-4 pt-1">
          <Pagination page={page} pageCount={pageCount} total={total} basePath="/cms/generated-pages" noun="pages" perPage={perPage} />
        </div>
      </div>
    </div>
  );
}
