/**
 * Programmatic SEO proposals: service and industry combinations from the catalogue, ranked by real
 * Search Console demand. Sorted by search volume, then difficulty (lowest first), then priority.
 *
 * Each row's actions are real: approve turns the proposal into a draft page, reject closes it. They
 * were a "…" button with no handler, so a proposal could be read and never acted on.
 *
 * CMS access only. Responsive: the table scrolls inside its own container down to 360px.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { Pause, Play, Sparkles } from "lucide-react";
import { requireCmsAccess } from "../../../../lib/auth.js";
import { cmsDb } from "../../../../lib/cms-db.js";
import { Pagination, currentPage, perPageFrom } from "../../../../components/cms/Pagination.js";
import { ProposalActions } from "./ProposalActions.js";
import { pseoSettings, MIN_SEARCH_VOLUME, DEMAND_WINDOW_DAYS } from "../../../../lib/pseo-settings.js";

export const dynamic = "force-dynamic";

interface Row {
  id: string;
  keyword: string;
  industry: string | null;
  search_volume: number;
  difficulty: number | null;
  priority: string;
  status: string;
}

const PRIORITY: Record<string, { bg: string; fg: string }> = {
  High: { bg: "#FEE2E2", fg: "#DC2626" },
  Medium: { bg: "#FEF3C7", fg: "#B45309" },
  Low: { bg: "#F1F5F9", fg: "#64748B" },
};
const STATUS: Record<string, { bg: string; fg: string }> = {
  Pending: { bg: "#FEF3C7", fg: "#B45309" },
  Approved: { bg: "#DCFCE7", fg: "#16A34A" },
  Rejected: { bg: "#FEE2E2", fg: "#DC2626" },
};

export default async function ProposalsPage({ searchParams }: {
  searchParams: Promise<{ page?: string; per?: string; generated?: string; demand?: string; paused?: string; generation?: string; denied?: string }>;
}): Promise<ReactNode> {
  const sp = await searchParams;
  await requireCmsAccess();
  const pseo = await pseoSettings();

  const { rows: [count] } = await cmsDb().query<{ n: string }>("SELECT count(*)::text n FROM cms_proposal");
  const total = Number(count?.n ?? 0);
  const perPage = perPageFrom(sp.per);
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const page = currentPage(sp.page, pageCount);

  const { rows } = await cmsDb().query<Row>(
    `SELECT id, keyword, industry, search_volume, difficulty, priority, status
       FROM cms_proposal
      ORDER BY search_volume DESC NULLS LAST,
               difficulty ASC NULLS LAST,
               CASE priority WHEN 'High' THEN 0 WHEN 'Medium' THEN 1 ELSE 2 END,
               created_at DESC
      LIMIT $1 OFFSET $2`,
    [perPage, (page - 1) * perPage]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900">Proposals</h1>
          <p className="mt-1 text-[0.86rem] text-slate-600">
            Service and industry combinations from your catalogue, ranked by real Search Console demand.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* The pause switch. Generation writes pages onto a live site, so it must be stoppable. */}
          <form action="/api/cms/pseo-toggle" method="post">
            <input type="hidden" name="enabled" value={pseo.enabled ? "0" : "1"} />
            <button type="submit"
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[0.82rem] font-600 ${
                pseo.enabled
                  ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  : "border-[#FDE68A] bg-[#FFFBEB] text-[#B45309] hover:bg-[#FEF3C7]"
              }`}>
              {pseo.enabled ? <><Pause size={14} /> Pause generation</> : <><Play size={14} /> Resume generation</>}
            </button>
          </form>
          <form action="/api/cms/proposals/generate" method="post">
            <input type="hidden" name="days" value={String(DEMAND_WINDOW_DAYS)} />
            <button type="submit" disabled={!pseo.enabled}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#543CDA] px-4 py-2 text-[0.82rem] font-600 text-white hover:bg-[#4330B8] disabled:cursor-not-allowed disabled:bg-slate-300">
              <Sparkles size={14} /> Generate from demand
            </button>
          </form>
        </div>
      </div>

      <div className={`mt-4 flex flex-wrap items-start gap-2.5 rounded-xl border p-3.5 ${
        pseo.enabled ? "border-slate-200 bg-slate-50/70" : "border-[#FDE68A] bg-[#FFFBEB]"
      }`}>
        {pseo.enabled ? <Play size={15} className="mt-0.5 shrink-0 text-[#15803D]" /> : <Pause size={15} className="mt-0.5 shrink-0 text-[#B45309]" />}
        <p className="text-[0.8rem] leading-relaxed text-slate-700">
          {pseo.enabled
            ? <>Generation is <strong className="font-700 text-[#15803D]">on</strong>.</>
            : <>Generation is <strong className="font-700 text-[#B45309]">paused</strong>. Nothing new will be proposed or written until it is resumed.</>}
          {" "}A keyword qualifies only at <strong className="font-700">{MIN_SEARCH_VOLUME}</strong> or more
          Search Console impressions over the last <strong className="font-700">{DEMAND_WINDOW_DAYS} days</strong>.
          {pseo.changedBy ? <span className="block text-[0.74rem] text-slate-600">Last changed by {pseo.changedBy}{pseo.changedAt ? ` on ${new Date(pseo.changedAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}` : ""}.</span> : null}
        </p>
      </div>

      {sp.paused ? (
        <p role="status" className="mt-3 rounded-lg bg-[#FEF3C7] px-3.5 py-2.5 text-[0.83rem] font-600 text-[#B45309]">
          Generation is paused, so nothing was produced. Resume it to run again.
        </p>
      ) : null}
      {sp.denied ? (
        <p role="alert" className="mt-3 rounded-lg bg-[#FEE2E2] px-3.5 py-2.5 text-[0.83rem] font-600 text-[#B91C1C]">
          You do not have permission to change programmatic generation.
        </p>
      ) : null}

      {sp.generated ? (
        <p className="mt-4 rounded-lg bg-[#DCFCE7] px-3.5 py-2.5 text-[0.83rem] font-600 text-[#15803D]">
          {sp.generated} proposals refreshed from the catalogue
          {sp.demand ? `, ${sp.demand} with recorded Search Console demand` : ""}. Highest demand first.
        </p>
      ) : null}

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-subtle">

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[0.66rem] uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-600">Keyword / Topic</th>
                <th className="px-5 py-3 font-600">Industry</th>
                <th className="px-5 py-3 font-600">Search Volume</th>
                <th className="px-5 py-3 font-600">Difficulty</th>
                <th className="px-5 py-3 font-600">Priority</th>
                <th className="px-5 py-3 font-600">Status</th>
                <th className="px-5 py-3 text-right font-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-[0.85rem] text-slate-600">
                    No proposals yet. Generate from demand to build the list from Search Console.
                  </td>
                </tr>
              ) : rows.map((r) => {
                const p = PRIORITY[r.priority] ?? PRIORITY.Medium!;
                const s = STATUS[r.status] ?? STATUS.Pending!;
                return (
                  <tr key={r.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                    <td className="px-5 py-3">
                      <Link href={`/cms/proposals/${r.id}`} className="text-[0.85rem] font-600 text-slate-900 hover:text-[#543CDA]">{r.keyword}</Link>
                    </td>
                    <td className="px-5 py-3 text-[0.82rem] text-slate-600">{r.industry ?? "—"}</td>
                    <td className="px-5 py-3 text-[0.84rem] font-600 text-slate-800">{r.search_volume.toLocaleString("en-NG")}</td>
                    <td className="px-5 py-3 text-[0.82rem] text-slate-600">{r.difficulty == null ? "—" : `${r.difficulty}/100`}</td>
                    <td className="px-5 py-3"><span className="inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-600" style={{ background: p.bg, color: p.fg }}>{r.priority}</span></td>
                    <td className="px-5 py-3"><span className="inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-600" style={{ background: s.bg, color: s.fg }}>{r.status}</span></td>
                    <td className="px-5 py-3 text-right">
                      <ProposalActions id={r.id} keyword={r.keyword} status={r.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 px-5 pb-4 pt-1">
          <Pagination page={page} pageCount={pageCount} total={total} basePath="/cms/proposals" noun="proposals" perPage={perPage}
            params={{ ...(sp.generated ? { generated: sp.generated } : {}), ...(sp.demand ? { demand: sp.demand } : {}) }} />
        </div>
      </div>
    </div>
  );
}
