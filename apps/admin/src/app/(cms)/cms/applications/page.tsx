/**
 * Job Applications. Every application received, with its AI fit score, verification state and stage.
 *
 * The row actions are real: open the application, or move it to a stage. They used to be a "…" button
 * with no handler, and the header carried an Export button and a "Bulk Actions" button that did nothing
 * either. Export now downloads a CSV; bulk actions were removed, because there is no bulk operation in
 * the platform and a button that promises one is worse than its absence.
 *
 * The per-row select boxes went with it, for the same reason: they selected rows for an action that did
 * not exist.
 *
 * CMS access only. Responsive: the table scrolls inside its own container down to 360px.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { CalendarCheck, Download, FileCheck2, Inbox, XCircle } from "lucide-react";
import { requireCmsAccess } from "../../../../lib/auth.js";
import { cmsDb } from "../../../../lib/cms-db.js";
import { Pagination, currentPage, perPageFrom } from "../../../../components/cms/Pagination.js";
import { ApplicationActions } from "./ApplicationActions.js";

export const dynamic = "force-dynamic";

interface Row {
  id: string;
  title: string;
  applicant_email: string | null;
  applied_job: string | null;
  ai_fit_score: number | null;
  ai_confidence: string | null;
  verification_status: string | null;
  application_stage: string | null;
  created_at: string;
}

const AVATAR = ["#543CDA", "#14B8A6", "#3B82F6", "#F59E0B", "#EC4899", "#8B5CF6"];
const STAGE: Record<string, { bg: string; fg: string; label: string }> = {
  new: { bg: "#DBEAFE", fg: "#2563EB", label: "New" },
  reviewed: { bg: "#EDE9FE", fg: "#6D28D9", label: "Reviewed" },
  interviewed: { bg: "#DCFCE7", fg: "#16A34A", label: "Interviewed" },
  rejected: { bg: "#FEE2E2", fg: "#DC2626", label: "Rejected" },
};
const VERIFY: Record<string, { bg: string; fg: string }> = {
  Verified: { bg: "#DCFCE7", fg: "#16A34A" },
  Reviewed: { bg: "#EDE9FE", fg: "#6D28D9" },
  Warning: { bg: "#FEF3C7", fg: "#B45309" },
  "Needs Review": { bg: "#FEE2E2", fg: "#DC2626" },
};

export default async function ApplicationsPage({ searchParams }: {
  searchParams: Promise<{ page?: string; per?: string; moved?: string }>;
}): Promise<ReactNode> {
  const sp = await searchParams;
  await requireCmsAccess();
  const pool = cmsDb();

  const { rows: [count] } = await pool.query<{ n: string }>(
    "SELECT count(*)::text n FROM cms_content WHERE kind='application'");
  const total = Number(count?.n ?? 0);
  const perPage = perPageFrom(sp.per);
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const page = currentPage(sp.page, pageCount);

  const [{ rows }, { rows: [stats] }] = await Promise.all([
    pool.query<Row>(
      `SELECT id, title, applicant_email, applied_job, ai_fit_score, ai_confidence, verification_status,
              application_stage, created_at::text FROM cms_content WHERE kind='application'
        ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [perPage, (page - 1) * perPage]),
    pool.query<{ new_c: string; reviewed: string; interviewed: string; rejected: string }>(
      `SELECT count(*) FILTER (WHERE application_stage='new')::text new_c,
              count(*) FILTER (WHERE application_stage='reviewed')::text reviewed,
              count(*) FILTER (WHERE application_stage='interviewed')::text interviewed,
              count(*) FILTER (WHERE application_stage='rejected')::text rejected
         FROM cms_content WHERE kind='application'`),
  ]);

  const kpis = [
    { icon: Inbox, label: "New", value: stats?.new_c ?? "0", tint: "#EEEBFC", fg: "#543CDA" },
    { icon: FileCheck2, label: "Reviewed", value: stats?.reviewed ?? "0", tint: "#EDE9FE", fg: "#6D28D9" },
    { icon: CalendarCheck, label: "Interviewed", value: stats?.interviewed ?? "0", tint: "#DCFCE7", fg: "#16A34A" },
    { icon: XCircle, label: "Rejected", value: stats?.rejected ?? "0", tint: "#FEE2E2", fg: "#DC2626" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900">Job Applications</h1>
          <p className="mt-1 text-[0.86rem] text-slate-600">Every application received, with its fit score and stage.</p>
        </div>
        <a href="/api/cms/export?report=applications" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[0.82rem] font-600 text-slate-700 hover:bg-slate-50">
          <Download size={14} /> Export CSV
        </a>
      </div>

      {sp.moved ? (
        <p role="status" className="mt-4 rounded-lg bg-[#DCFCE7] px-3.5 py-2.5 text-[0.83rem] font-600 text-[#15803D]">
          Application moved to {STAGE[sp.moved]?.label ?? sp.moved}.
        </p>
      ) : null}

      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle">
            <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: k.tint, color: k.fg }}><k.icon size={17} /></span>
            <p className="mt-3 text-[1.6rem] font-700 text-slate-900">{k.value}</p>
            <p className="text-[0.78rem] text-slate-600">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-subtle">

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[0.66rem] uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-600">Candidate</th>
                <th className="px-5 py-3 font-600">Job</th>
                <th className="px-5 py-3 font-600">AI Fit</th>
                <th className="px-5 py-3 font-600">Confidence</th>
                <th className="px-5 py-3 font-600">Verification</th>
                <th className="px-5 py-3 font-600">Status</th>
                <th className="px-5 py-3 font-600">Applied</th>
                <th className="px-5 py-3 text-right font-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-[0.85rem] text-slate-600">
                    No applications yet. They arrive here when someone applies through the careers pages.
                  </td>
                </tr>
              ) : rows.map((r, i) => {
                const st = STAGE[r.application_stage ?? "new"] ?? STAGE.new!;
                const v = VERIFY[r.verification_status ?? ""] ?? { bg: "#F1F5F9", fg: "#64748B" };
                const fit = r.ai_fit_score;
                const fitColor = fit == null ? "#94A3B8" : fit >= 85 ? "#16A34A" : fit >= 70 ? "#B45309" : "#DC2626";
                return (
                  <tr key={r.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                    <td className="px-5 py-3">
                      <Link href={`/cms/applications/${r.id}`} className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full font-mono text-[0.64rem] font-700 text-white" style={{ background: AVATAR[i % AVATAR.length] }}>
                          {r.title.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[0.85rem] font-600 text-slate-900">{r.title}</span>
                          <span className="block truncate text-[0.74rem] text-slate-600">{r.applicant_email ?? ""}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-[0.82rem] text-slate-600">{r.applied_job ?? "—"}</td>
                    <td className="px-5 py-3"><span className="text-[0.84rem] font-700" style={{ color: fitColor }}>{fit == null ? "—" : `${fit}%`}</span></td>
                    <td className="px-5 py-3 text-[0.82rem] text-slate-600">{r.ai_confidence ?? "—"}</td>
                    <td className="px-5 py-3"><span className="inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-600" style={{ background: v.bg, color: v.fg }}>{r.verification_status ?? "—"}</span></td>
                    <td className="px-5 py-3"><span className="inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-600" style={{ background: st.bg, color: st.fg }}>{st.label}</span></td>
                    <td className="px-5 py-3 text-[0.8rem] text-slate-600">{new Date(r.created_at).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}</td>
                    <td className="px-5 py-3 text-right">
                      <ApplicationActions id={r.id} name={r.title} stage={r.application_stage ?? "new"} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 px-5 pb-4 pt-1">
          <Pagination page={page} pageCount={pageCount} total={total} basePath="/cms/applications" noun="applications" perPage={perPage} />
        </div>
      </div>
    </div>
  );
}
