/**
 * Redirect List (CMS SEO Operations design). Manage and monitor URL redirects with hit tracking. KPIs by
 * type (301/302/410) and 30-day hits, plus the redirects table. CMS access only. Responsive: the table
 * scrolls inside its own container down to 360px.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { Plus, ArrowRightLeft, MoveRight, Ban, MousePointerClick } from "lucide-react";
import { Pagination, currentPage, perPageFrom } from "../../../../../components/cms/Pagination.js";
import { ListFilters } from "../../../../../components/cms/ListFilters.js";
import { filterClause } from "../../../../../lib/list-filters.js";
import { requireCmsAccess } from "../../../../../lib/auth.js";
import { cmsDb } from "../../../../../lib/cms-db.js";
import { RecordActions } from "../../../../../components/cms/RecordActions.js";

export const dynamic = "force-dynamic";

interface Row { id: string; old_url: string; new_url: string | null; type: string; status: string; hits: number; last_used: string | null }
interface Kpis { total: string; r301: string; r302: string; r410: string; hits: string }
const TYPE_COLOR: Record<string, { bg: string; fg: string }> = {
  "301": { bg: "#DCFCE7", fg: "#16A34A" }, "302": { bg: "#FEF3C7", fg: "#B45309" }, "307": { bg: "#EDE9FE", fg: "#6D28D9" }, "410": { bg: "#FEE2E2", fg: "#DC2626" },
};

export default async function RedirectsPage({ searchParams }: { searchParams: Promise<{ page?: string; per?: string; q?: string; type?: string }> }): Promise<ReactNode> {
  await requireCmsAccess();
  const { page: pageParam, per, q, type } = await searchParams;
  const pool = cmsDb();
  // Filters apply to the listed rows. The KPI tiles above stay unfiltered on purpose: they describe
  // the whole redirect table, and narrowing them with the search would make them a different metric.
  const filters = filterClause([
    { column: "old_url", value: q, mode: "ilike" },
    { column: "type", value: type, mode: "eq" },
  ]);
  const { rows: [ft] } = await pool.query<{ n: string }>(
    `SELECT count(*)::text n FROM cms_redirect WHERE true${filters.sql}`, filters.values);
  const total = Number(ft?.n ?? 0);
  const perPage = perPageFrom(per);
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const page = currentPage(pageParam, pageCount);
  const [{ rows }, { rows: [k] }] = await Promise.all([
    pool.query<Row>(
      `SELECT id, old_url, new_url, type, status, hits, last_used::text
         FROM cms_redirect WHERE true${filters.sql}
        ORDER BY hits DESC
        LIMIT $${filters.values.length + 1} OFFSET $${filters.values.length + 2}`,
      [...filters.values, perPage, (page - 1) * perPage]),
    pool.query<Kpis>(
      `SELECT count(*)::text total, count(*) FILTER (WHERE type='301')::text r301, count(*) FILTER (WHERE type='302')::text r302,
              count(*) FILTER (WHERE type='410')::text r410, COALESCE(sum(hits),0)::text hits FROM cms_redirect`),
  ]);
  const kpis = [
    { icon: ArrowRightLeft, label: "Total Redirects", value: k?.total ?? "0", tint: "#EEEBFC", fg: "#543CDA" },
    { icon: MoveRight, label: "301 Redirects", value: k?.r301 ?? "0", tint: "#DCFCE7", fg: "#16A34A" },
    { icon: MoveRight, label: "302 Redirects", value: k?.r302 ?? "0", tint: "#FEF3C7", fg: "#B45309" },
    { icon: Ban, label: "410 Gone", value: k?.r410 ?? "0", tint: "#FEE2E2", fg: "#DC2626" },
    { icon: MousePointerClick, label: "Redirect Hits (total)", value: Number(k?.hits ?? 0).toLocaleString(), tint: "#EEEBFC", fg: "#543CDA" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900">Redirects</h1>
          <p className="mt-1 text-[0.86rem] text-slate-500">Manage and monitor all URL redirects.</p>
        </div>
        <Link href="/cms/seo/redirects/new" className="inline-flex items-center gap-1.5 rounded-lg bg-[#543CDA] px-4 py-2 text-[0.82rem] font-600 text-white hover:bg-[#4330B8]"><Plus size={15} strokeWidth={2.4} /> New Redirect</Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {kpis.map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle">
            <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: c.tint, color: c.fg }}><c.icon size={17} /></span>
            <p className="mt-3 text-[1.4rem] font-700 text-slate-900">{c.value}</p>
            <p className="text-[0.74rem] text-slate-500">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-subtle">
        <ListFilters
          searchPlaceholder="Search redirects by source URL..."
          selects={[{ param: "type", allLabel: "All types", options: [
            { value: "301", label: "301 permanent" },
            { value: "302", label: "302 temporary" },
            { value: "410", label: "410 gone" },
          ] }]}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead><tr className="border-b border-slate-200 bg-slate-50 text-[0.66rem] uppercase tracking-wide text-slate-500"><th className="px-5 py-3 font-600">Old URL</th><th className="px-5 py-3 font-600">New URL</th><th className="px-5 py-3 font-600">Type</th><th className="px-5 py-3 font-600">Hits (30d)</th><th className="px-5 py-3 font-600">Status</th><th className="px-5 py-3 font-600">Last Used</th><th className="px-5 py-3 text-right font-600">Actions</th></tr></thead>
            <tbody>
              {rows.map((r) => {
                const t = TYPE_COLOR[r.type] ?? TYPE_COLOR["301"]!;
                return (
                  <tr key={r.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                    <td className="px-5 py-3"><span className="block max-w-[16rem] truncate font-mono text-[0.78rem] text-slate-700">{r.old_url}</span></td>
                    <td className="px-5 py-3"><span className="block max-w-[16rem] truncate font-mono text-[0.78rem] text-slate-500">{r.new_url ?? "—"}</span></td>
                    <td className="px-5 py-3"><span className="inline-flex rounded-md px-2 py-0.5 text-[0.72rem] font-700" style={{ background: t.bg, color: t.fg }}>{r.type}</span></td>
                    <td className="px-5 py-3 text-[0.84rem] font-600 text-slate-800">{r.hits.toLocaleString()}</td>
                    <td className="px-5 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-600 ${r.status === "Active" ? "bg-[#DCFCE7] text-[#15803D]" : "bg-slate-100 text-slate-600"}`}>{r.status}</span></td>
                    <td className="px-5 py-3 text-[0.8rem] text-slate-500">{r.last_used ? new Date(r.last_used).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</td>
                    <td className="px-5 py-3 text-right"><RecordActions entity="redirect" id={String(r.id)} editHref={`/cms/seo/redirects/${r.id}`} label={r.old_url} back="/cms/seo/redirects" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-5 py-3 text-[0.8rem] text-slate-500">
          <Pagination page={page} pageCount={pageCount} total={total} basePath="/cms/seo/redirects" noun="redirects" perPage={perPage} />
        </div>
      </div>
    </div>
  );
}
