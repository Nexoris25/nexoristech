/**
 * Compliance Reports (PRD 15): the submission summary, acceptance and rejection breakdowns, and the
 * document volume by month, over the NRS documents. Read-only rollups from the einvoice table so a
 * report can never disagree with the documents. Export streams the current year as CSV.
 */
import type { ReactNode } from "react";
import { BarChart3, Download } from "lucide-react";
import { requireFiscal } from "../../../../lib/fiscal/permissions.js";
import { db } from "../../../../lib/db.js";

export const dynamic = "force-dynamic";

interface Month { m: string; issued: string; accepted: string; rejected: string }

export default async function ComplianceReports(): Promise<ReactNode> {
  await requireFiscal("INVOICE_VIEW");
  const year = new Date().getFullYear();
  const pool = db();
  const [{ rows: sum }, { rows: months }] = await Promise.all([
    pool.query<{ total: string; accepted: string; rejected: string; pending: string; cancelled: string }>(
      `SELECT count(*)::text total, count(*) FILTER (WHERE nrs_status='Accepted')::text accepted,
              count(*) FILTER (WHERE nrs_status='Rejected')::text rejected,
              count(*) FILTER (WHERE nrs_status IN ('NotSubmitted','Submitting'))::text pending,
              count(*) FILTER (WHERE lifecycle_status='Closed')::text cancelled FROM einvoice`),
    pool.query<Month>(
      `WITH m AS (SELECT generate_series(1,12) n)
       SELECT to_char(make_date($1,m.n,1),'Mon') m,
              (SELECT count(*) FROM einvoice e WHERE extract(year FROM e.created_at)=$1 AND extract(month FROM e.created_at)=m.n)::text issued,
              (SELECT count(*) FROM einvoice e WHERE extract(year FROM e.created_at)=$1 AND extract(month FROM e.created_at)=m.n AND e.nrs_status='Accepted')::text accepted,
              (SELECT count(*) FROM einvoice e WHERE extract(year FROM e.created_at)=$1 AND extract(month FROM e.created_at)=m.n AND e.nrs_status='Rejected')::text rejected
         FROM m ORDER BY m.n`, [year]),
  ]);
  const s = sum[0]!;
  const total = Number(s.total);
  const acceptRate = total ? Math.round((Number(s.accepted) / total) * 100) : 0;
  const rejectRate = total ? Math.round((Number(s.rejected) / total) * 100) : 0;
  const maxVol = Math.max(...months.map((m) => Number(m.issued)), 1);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900">Compliance Reports</h1>
          <p className="mt-1 text-[0.88rem] text-slate-500">Submission summary, acceptance and rejection, and document volume.</p>
        </div>
        <a href="/api/einvoice/export" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-[0.83rem] font-600 text-slate-700 hover:bg-slate-50"><Download size={15} /> Export Reports</a>
      </div>

      {/* Submission summary */}
      <section className="mt-5">
        <h2 className="text-[0.95rem] font-700 text-slate-900">Submission summary</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[["Total", s.total, "text-slate-900"], ["Accepted", s.accepted, "text-[#15803D]"], ["Rejected", s.rejected, "text-[#B91C1C]"], ["In progress", s.pending, "text-[#B45309]"], ["Cancelled", s.cancelled, "text-slate-500"]].map(([label, val, tint]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle"><p className="text-[0.74rem] text-slate-500">{label}</p><p className={`mt-1 text-[1.3rem] font-700 ${tint}`}>{val}</p></div>
          ))}
        </div>
      </section>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.95rem] font-700 text-slate-900">Acceptance report</h2>
          <p className="mt-2 text-[2rem] font-700 text-[#15803D]">{acceptRate}%</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#16A34A]" style={{ width: `${acceptRate}%` }} /></div>
          <p className="mt-2 text-[0.78rem] text-slate-500">{s.accepted} of {s.total} accepted by the NRS</p>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.95rem] font-700 text-slate-900">Rejection report</h2>
          <p className="mt-2 text-[2rem] font-700 text-[#B91C1C]">{rejectRate}%</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#B91C1C]" style={{ width: `${rejectRate}%` }} /></div>
          <p className="mt-2 text-[0.78rem] text-slate-500">{s.rejected} rejected · work them in the Submission Centre</p>
        </section>
      </div>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
        <h2 className="flex items-center gap-2 text-[0.95rem] font-700 text-slate-900"><BarChart3 size={17} className="text-[#543CDA]" /> Invoice volume · {year}</h2>
        <div className="mt-4 flex items-end gap-2 overflow-x-auto pb-2">
          {months.map((m) => (
            <div key={m.m} className="flex min-w-[2.2rem] flex-1 flex-col items-center gap-1">
              <div className="flex h-28 w-full items-end justify-center"><div className="w-2/3 rounded-t bg-[#543CDA]" style={{ height: `${(Number(m.issued) / maxVol) * 100}%` }} title={`${m.issued} issued`} /></div>
              <span className="text-[0.68rem] text-slate-500">{m.m}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
