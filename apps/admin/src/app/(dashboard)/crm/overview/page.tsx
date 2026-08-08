/**
 * CRM - Dashboard / Overview (Batch 3, screen 41). The CRM's own overview: a KPI row, the pipeline
 * by stage, the lead-source split, recent activities, and the tasks that need attention. Every
 * figure is live from the lead book; Oge scores the leads behind the hot-lead and alert signals.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, ArrowRight, Sparkles, Trophy, UserPlus, Briefcase, Coins } from "lucide-react";
import { requireStaff } from "../../../../lib/auth.js";
import { db } from "../../../../lib/db.js";
import { buildActionCenter } from "../../../../lib/action-center.js";
import { PRIORITY_STYLE, SOURCE_LABEL } from "../../../../lib/lead-ui.js";
import { Donut, Bar } from "../../../../components/charts.js";

export const dynamic = "force-dynamic";

const FUNNEL = ["New", "Contacted", "Qualified", "Scoping Call Booked", "Proposal Sent", "Negotiation", "Won"] as const;
const STAGE_COLOR: Record<string, string> = {
  New: "#543CDA",
  Contacted: "#6A55F2",
  Qualified: "#F59E0B",
  "Scoping Call Booked": "#3B82F6",
  "Proposal Sent": "#EF4444",
  Negotiation: "#8B5CF6",
  Won: "#22C55E",
};
const SOURCE_COLOR = ["#543CDA", "#22C55E", "#F59E0B", "#3B82F6", "#EF4444", "#8B5CF6", "#94A3B8"];

function naira(n: number): string {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}k`;
  return `₦${n.toLocaleString("en-NG")}`;
}

function timeAgo(iso: string): string {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
}

function Delta({ value }: { value: number | null }): ReactNode {
  if (value === null) return <span className="text-[0.72rem] text-slate-500">vs last month</span>;
  const up = value >= 0;
  return (
    <span className={`inline-flex items-center gap-1 text-[0.74rem] font-600 ${up ? "text-[#15803D]" : "text-[#DC2626]"}`}>
      {up ? <TrendingUp size={12} strokeWidth={2.4} /> : <TrendingDown size={12} strokeWidth={2.4} />}
      {up ? "+" : ""}{value}% <span className="font-400 text-slate-500">vs last month</span>
    </span>
  );
}

export default async function CrmOverviewPage(): Promise<ReactNode> {
  const staff = await requireStaff();
  const pool = db();
  const now = new Date();
  const scope = staff.role === "salesperson" ? staff.id : undefined;
  const where = scope ? "WHERE assigned_to = $1" : "";
  const params = scope ? [scope] : [];

  const [kpiRes, stageRes, sourceRes, actRes, actions] = await Promise.all([
    pool.query<{ nl: string; pnl: string; opps: string; won: string; pwon: string; wv: string; pwv: string }>(
      `SELECT count(*) FILTER (WHERE created_at >= date_trunc('month', now()))::text nl,
              count(*) FILTER (WHERE created_at >= date_trunc('month', now()) - interval '1 month' AND created_at < date_trunc('month', now()))::text pnl,
              count(*) FILTER (WHERE status NOT IN ('Won','Lost'))::text opps,
              count(*) FILTER (WHERE status='Won' AND won_at >= date_trunc('month', now()))::text won,
              count(*) FILTER (WHERE status='Won' AND won_at >= date_trunc('month', now()) - interval '1 month' AND won_at < date_trunc('month', now()))::text pwon,
              coalesce(sum(deal_value) FILTER (WHERE status='Won' AND won_at >= date_trunc('month', now())),0)::bigint::text wv,
              coalesce(sum(deal_value) FILTER (WHERE status='Won' AND won_at >= date_trunc('month', now()) - interval '1 month' AND won_at < date_trunc('month', now())),0)::bigint::text pwv
         FROM lead ${where}`,
      params,
    ),
    pool.query<{ status: string; c: number; v: string }>(
      `SELECT status, count(*)::int c, coalesce(sum(deal_value),0)::bigint::text v FROM lead ${where} GROUP BY status`,
      params,
    ),
    pool.query<{ source: string; c: number }>(`SELECT source, count(*)::int c FROM lead ${where} GROUP BY source ORDER BY c DESC`, params),
    pool.query<{ id: string; note: string | null; type: string; created_at: string; actor: string | null; name: string | null }>(
      `SELECT la.lead_id::text id, la.note, la.type, la.created_at, s.name actor, l.name
         FROM lead_activity la LEFT JOIN staff s ON s.id = la.actor_id LEFT JOIN lead l ON l.id = la.lead_id
         ${scope ? "WHERE l.assigned_to = $1" : ""} ORDER BY la.created_at DESC LIMIT 5`,
      params,
    ),
    buildActionCenter(pool, now, scope),
  ]);

  const k = kpiRes.rows[0]!;
  const pct = (c: number, p: number): number | null => (p > 0 ? Math.round(((c - p) / p) * 100) : null);
  const stageMap = new Map(stageRes.rows.map((r) => [r.status, r]));
  const totalLeads = sourceRes.rows.reduce((s, r) => s + r.c, 0);
  const funnelMax = Math.max(1, ...FUNNEL.map((s) => stageMap.get(s)?.c ?? 0));

  const kpis = [
    { label: "New Leads", value: k.nl, delta: pct(Number(k.nl), Number(k.pnl)), icon: UserPlus },
    { label: "Opportunities", value: k.opps, delta: null, icon: Briefcase },
    { label: "Won Deals", value: k.won, delta: pct(Number(k.won), Number(k.pwon)), icon: Trophy },
    { label: "Sales Won Value", value: naira(Number(k.wv)), delta: pct(Number(k.wv), Number(k.pwv)), icon: Coins },
  ];

  const segments = sourceRes.rows.map((r, i) => ({ label: r.source, value: r.c, color: SOURCE_COLOR[i % SOURCE_COLOR.length]! }));

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900">CRM Overview</h1>
          <p className="mt-1 text-[0.88rem] text-slate-500">Your pipeline, sources, and what needs attention.</p>
        </div>
        {/* The period picker that stood here offered This Week / This Month / This Quarter and none of
            the three did anything: the options were buttons with no handler, and every figure below is
            queried against the calendar month regardless. Rather than leave a control that lies about
            what it does, the window it actually uses is stated. */}
        <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[0.82rem] font-600 text-slate-600">
          This calendar month
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-4">
        {kpis.map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
            <span className="flex items-center gap-2">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#EEEBFC] text-[#543CDA]"><c.icon size={16} strokeWidth={2} /></span>
              <span className="text-[0.8rem] font-500 text-slate-600">{c.label}</span>
            </span>
            <p className="mt-2 font-mono text-[1.55rem] font-700 leading-none text-slate-900">{c.value}</p>
            <p className="mt-2"><Delta value={c.delta} /></p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <div className="flex items-center justify-between">
            <h2 className="text-[0.98rem] font-700 text-slate-900">Pipeline Overview</h2>
            <Link href="/crm/board" className="text-[0.8rem] font-600 text-[#543CDA] hover:text-[#4330B8]">View pipeline</Link>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {FUNNEL.map((stage) => {
              const row = stageMap.get(stage);
              const count = row?.c ?? 0;
              const value = Number(row?.v ?? "0");
              return (
                <div key={stage} className="grid grid-cols-[minmax(94px,140px)_1fr_auto] items-center gap-3">
                  <span className="truncate text-[0.8rem] text-slate-700">{stage}</span>
                  <Bar pct={(count / funnelMax) * 100} color={STAGE_COLOR[stage] ?? "#543CDA"} />
                  <span className="w-24 text-right">
                    <span className="font-mono text-[0.8rem] font-700 text-slate-900">{count}</span>
                    {value > 0 ? <span className="ml-1.5 font-mono text-[0.72rem] text-slate-500">{naira(value)}</span> : null}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.98rem] font-700 text-slate-900">Lead Source</h2>
          {totalLeads === 0 ? (
            <p className="mt-4 text-[0.85rem] text-slate-500">No leads yet.</p>
          ) : (
            <div className="mt-4 flex flex-col items-center gap-4">
              <Donut segments={segments} size={150} centerTop={totalLeads} centerBottom="Total Leads" />
              <ul className="flex w-full flex-col gap-1.5">
                {segments.map((s) => (
                  <li key={s.label} className="flex items-center gap-2 text-[0.78rem]">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                    <span className="min-w-0 flex-1 truncate text-slate-600">{SOURCE_LABEL[s.label] ?? s.label}</span>
                    <span className="font-mono text-slate-900">{s.value}</span>
                    <span className="w-9 text-right font-mono text-slate-500">{Math.round((s.value / totalLeads) * 100)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-subtle">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
            <h2 className="text-[0.95rem] font-700 text-slate-900">Recent Activities</h2>
          </div>
          {actRes.rows.length === 0 ? (
            <p className="px-5 py-6 text-[0.86rem] text-slate-500">Activity appears here as leads move.</p>
          ) : (
            <ul className="flex flex-col gap-3.5 px-5 py-4">
              {actRes.rows.map((a, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#543CDA]" />
                  <span className="min-w-0 flex-1">
                    <Link href={`/crm/${a.id}`} className="block truncate text-[0.84rem] text-slate-800 hover:text-[#543CDA]">{a.note ?? a.type}</Link>
                    <span className="block truncate text-[0.72rem] text-slate-500">{[a.name, a.actor].filter(Boolean).join(" · ")}</span>
                  </span>
                  <span className="shrink-0 text-[0.72rem] text-slate-500">{timeAgo(a.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-subtle">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
            <h2 className="flex items-center gap-2 text-[0.95rem] font-700 text-slate-900">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-gradient-to-br from-[#543CDA] to-[#6A55F2] text-white"><Sparkles size={13} strokeWidth={2.2} /></span>
              Needs attention
              {actions.length > 0 ? <span className="rounded-full bg-[#EEEBFC] px-2 py-0.5 text-[0.7rem] font-600 text-[#543CDA]">{actions.length}</span> : null}
            </h2>
            <Link href="/action-center" className="text-[0.8rem] font-600 text-[#543CDA] hover:text-[#4330B8]">View all</Link>
          </div>
          {actions.length === 0 ? (
            <p className="px-5 py-6 text-[0.86rem] leading-relaxed text-slate-500">Nothing needs attention. Oge flags a lead here the moment an SLA runs short or a follow-up falls due.</p>
          ) : (
            <ul className="flex flex-col">
              {actions.slice(0, 5).map((item, i) => (
                <li key={item.id}>
                  <Link href={item.href} className={`group flex items-center gap-3 px-5 py-3 hover:bg-slate-50 ${i > 0 ? "border-t border-slate-100" : ""}`}>
                    <span className={`inline-flex w-[62px] shrink-0 justify-center rounded-full px-2 py-1 text-[0.68rem] font-700 ${PRIORITY_STYLE[item.priority].chip}`}>{item.priority}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.84rem] font-600 text-slate-900">{item.title}</span>
                      <span className="block truncate text-[0.72rem] text-slate-500">{item.detail}</span>
                    </span>
                    <ArrowRight size={15} strokeWidth={2} className="shrink-0 text-slate-300 group-hover:text-[#543CDA]" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
