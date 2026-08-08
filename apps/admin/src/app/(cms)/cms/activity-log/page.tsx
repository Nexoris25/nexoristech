/**
 * Activity Log (CMS Workflow design). Tracks all activities across the platform: headline KPIs and a feed
 * table (time, user, module, item, action, status). Derived live from cms_activity. CMS access only.
 * Responsive: the table scrolls inside its own container down to 360px.
 */
import type { ReactNode } from "react";
import { Activity as ActivityIcon, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Pagination, currentPage, perPageFrom } from "../../../../components/cms/Pagination.js";
import { ListFilters } from "../../../../components/cms/ListFilters.js";
import { filterClause } from "../../../../lib/list-filters.js";
import { requireCmsAccess } from "../../../../lib/auth.js";
import { cmsDb } from "../../../../lib/cms-db.js";

export const dynamic = "force-dynamic";

interface Row { id: string; actor_name: string | null; action: string; subject: string | null; category: string | null; status: string | null; created_at: string }
interface Kpis { total: string; ok: string; failed: string; warning: string }
const AV = ["#543CDA", "#14B8A6", "#3B82F6", "#F59E0B", "#EC4899", "#8B5CF6"];
const STATUS: Record<string, { bg: string; fg: string }> = {
  Published: { bg: "#DCFCE7", fg: "#16A34A" }, Completed: { bg: "#DCFCE7", fg: "#16A34A" }, Live: { bg: "#DCFCE7", fg: "#16A34A" },
  "In Review": { bg: "#FEF3C7", fg: "#B45309" }, Scheduled: { bg: "#EDE9FE", fg: "#6D28D9" }, Draft: { bg: "#F1F5F9", fg: "#64748B" },
  Returned: { bg: "#FEE2E2", fg: "#DC2626" }, Failed: { bg: "#FEE2E2", fg: "#DC2626" },
};

function ago(iso: string): string {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default async function ActivityLogPage({ searchParams }: { searchParams: Promise<{ page?: string; per?: string; q?: string; category?: string }> }): Promise<ReactNode> {
  await requireCmsAccess();
  const { page: pageParam, per, q, category } = await searchParams;
  const pool = cmsDb();
  const filters = filterClause([
    { column: "subject", value: q, mode: "ilike" },
    { column: "category", value: category, mode: "eq" },
  ]);
  const { rows: [ft] } = await pool.query<{ n: string }>(
    `SELECT count(*)::text n FROM cms_activity WHERE true${filters.sql}`, filters.values);
  const total = Number(ft?.n ?? 0);
  const perPage = perPageFrom(per);
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const page = currentPage(pageParam, pageCount);
  const [{ rows }, { rows: [k] }] = await Promise.all([
    pool.query<Row>(
      `SELECT id, actor_name, action, subject, category, status, created_at::text
         FROM cms_activity WHERE true${filters.sql}
        ORDER BY created_at DESC
        LIMIT $${filters.values.length + 1} OFFSET $${filters.values.length + 2}`,
      [...filters.values, perPage, (page - 1) * perPage]),
    pool.query<Kpis>(
      `SELECT count(*)::text total,
              count(*) FILTER (WHERE status IN ('Completed','Published','Live'))::text ok,
              count(*) FILTER (WHERE status='Failed')::text failed,
              count(*) FILTER (WHERE status IN ('Returned','Warning'))::text warning
         FROM cms_activity`),
  ]);
  const kpis = [
    { icon: ActivityIcon, label: "Total Activities", value: Number(k?.total ?? 0).toLocaleString(), tint: "#EEEBFC", fg: "#543CDA" },
    { icon: CheckCircle2, label: "Successful", value: Number(k?.ok ?? 0).toLocaleString(), tint: "#DCFCE7", fg: "#16A34A" },
    { icon: XCircle, label: "Failed", value: Number(k?.failed ?? 0).toLocaleString(), tint: "#FEE2E2", fg: "#DC2626" },
    { icon: AlertTriangle, label: "Warning", value: Number(k?.warning ?? 0).toLocaleString(), tint: "#FEF3C7", fg: "#B45309" },
  ];

  return (
    <div>
      <h1 className="text-[1.4rem] font-700 text-slate-900">Activity Log</h1>
      <p className="mt-1 text-[0.86rem] text-slate-500">Track all activities across the platform.</p>

      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle">
            <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: c.tint, color: c.fg }}><c.icon size={17} /></span>
            <p className="mt-3 text-[1.5rem] font-700 text-slate-900">{c.value}</p>
            <p className="text-[0.78rem] text-slate-500">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-subtle">
        <ListFilters
          searchPlaceholder="Search activity by subject..."
          selects={[{ param: "category", allLabel: "All categories", options: [
            { value: "Workflow", label: "Workflow" },
            { value: "Content", label: "Content" },
            { value: "SEO", label: "SEO" },
            { value: "Media", label: "Media" },
          ] }]}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead><tr className="border-b border-slate-200 bg-slate-50 text-[0.66rem] uppercase tracking-wide text-slate-500"><th className="px-5 py-3 font-600">Time</th><th className="px-5 py-3 font-600">User</th><th className="px-5 py-3 font-600">Module</th><th className="px-5 py-3 font-600">Item</th><th className="px-5 py-3 font-600">Action</th><th className="px-5 py-3 font-600">Status</th></tr></thead>
            <tbody>
              {rows.map((r, i) => {
                const s = r.status ? (STATUS[r.status] ?? { bg: "#F1F5F9", fg: "#64748B" }) : null;
                return (
                  <tr key={r.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                    <td className="px-5 py-3 text-[0.8rem] text-slate-500">{ago(r.created_at)}</td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-2">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full font-mono text-[0.58rem] font-700 text-white" style={{ background: AV[i % AV.length] }}>{(r.actor_name ?? "?").split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase()}</span>
                        <span className="text-[0.82rem] font-600 text-slate-800">{r.actor_name ?? "System"}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3"><span className="rounded-md bg-slate-100 px-2 py-0.5 text-[0.72rem] font-500 text-slate-600">{r.category ?? "—"}</span></td>
                    <td className="px-5 py-3"><span className="block max-w-[16rem] truncate text-[0.82rem] text-slate-600">{r.subject ?? "—"}</span></td>
                    <td className="px-5 py-3 text-[0.82rem] text-slate-600">{r.action}</td>
                    <td className="px-5 py-3">{s ? <span className="inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-600" style={{ background: s.bg, color: s.fg }}>{r.status}</span> : <span className="text-slate-300">—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-5 py-3 text-[0.8rem] text-slate-500">
          <Pagination page={page} pageCount={pageCount} total={total} basePath="/cms/activity-log" noun="activities" perPage={perPage} />
        </div>
      </div>
    </div>
  );
}
