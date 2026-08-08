/**
 * AI Analytics (PRD §10). Usage analytics for Oge, measured from `cms_ai_usage`.
 *
 * Every figure was previously hardcoded — 8,412 requests, 18.6M tokens, $84.20, a 1.38s average — because
 * nothing recorded any of it. The screen could not be wired to real data; the data had to be captured
 * first, so each call to the gateway now writes a usage row and this reads them.
 *
 * Token counts appear only when the gateway reports them, and cost is not shown at all: per-model
 * pricing is not configured anywhere in the platform, and a number invented for a money field is the
 * worst kind to invent.
 */
import type { ReactNode } from "react";
import { Sparkles, Coins, Timer, AlertTriangle } from "lucide-react";
import { requireCmsAccess } from "../../../../../lib/auth.js";
import { cmsDb } from "../../../../../lib/cms-db.js";

export const dynamic = "force-dynamic";

interface Activity { id: string; actor_name: string | null; action: string; subject: string | null; status: string | null; created_at: string }
function ago(iso: string): string { const s = (Date.now() - new Date(iso).getTime()) / 1000; if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`; if (s < 86400) return `${Math.floor(s / 3600)}h ago`; return `${Math.floor(s / 86400)}d ago`; }
const STATUS: Record<string, { bg: string; fg: string }> = { Completed: { bg: "#DCFCE7", fg: "#16A34A" }, Published: { bg: "#DCFCE7", fg: "#16A34A" }, "In Review": { bg: "#FEF3C7", fg: "#B45309" }, Returned: { bg: "#FEE2E2", fg: "#DC2626" } };

export default async function AiAnalyticsPage(): Promise<ReactNode> {
  await requireCmsAccess();
  const pool = cmsDb();
  const [{ rows: activities }, { rows: totals }, { rows: byFeature }, { rows: byModel }] = await Promise.all([
    pool.query<Activity>(
      "SELECT id, actor_name, action, subject, status, created_at::text FROM cms_activity ORDER BY created_at DESC LIMIT 10"),
    // Last 30 days, so the figures describe a period rather than all time.
    pool.query<{ requests: string; tokens: string | null; avg_ms: string | null; failures: string }>(
      `SELECT count(*)::text AS requests,
              sum(coalesce(prompt_tokens,0) + coalesce(completion_tokens,0))::text AS tokens,
              round(avg(duration_ms))::text AS avg_ms,
              count(*) FILTER (WHERE NOT ok)::text AS failures
         FROM cms_ai_usage WHERE created_at > now() - interval '30 days'`),
    pool.query<{ name: string; c: string }>(
      `SELECT feature AS name, count(*)::text AS c FROM cms_ai_usage
        WHERE created_at > now() - interval '30 days' GROUP BY feature ORDER BY count(*) DESC LIMIT 8`),
    pool.query<{ name: string; c: string }>(
      `SELECT coalesce(model, 'Not reported') AS name, count(*)::text AS c FROM cms_ai_usage
        WHERE created_at > now() - interval '30 days' GROUP BY model ORDER BY count(*) DESC LIMIT 8`),
  ]);

  const t = totals[0];
  const requests = Number(t?.requests ?? 0);
  const tokens = Number(t?.tokens ?? 0);
  const avgMs = t?.avg_ms ? Number(t.avg_ms) : null;
  const failures = Number(t?.failures ?? 0);
  const pct = (c: string, all: number): number => (all > 0 ? Math.round((Number(c) / all) * 100) : 0);
  const featureUsage = byFeature.map((r) => ({ name: r.name, pct: pct(r.c, requests) }));
  const modelUsage = byModel.map((r) => ({ name: r.name, pct: pct(r.c, requests) }));
  const abbr = (n: number): string => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n));

  const kpis = [
    { icon: Sparkles, label: "AI requests (30 days)", value: requests.toLocaleString("en-NG"), tint: "#EEEBFC", fg: "#543CDA" },
    { icon: Coins, label: "Tokens reported", value: tokens > 0 ? abbr(tokens) : "—", tint: "#EEEBFC", fg: "#543CDA" },
    { icon: Timer, label: "Average response", value: avgMs !== null ? `${(avgMs / 1000).toFixed(2)}s` : "—", tint: "#DCFCE7", fg: "#15803D" },
    { icon: AlertTriangle, label: "Failed calls", value: failures.toLocaleString("en-NG"), tint: failures > 0 ? "#FEE2E2" : "#F1F5F9", fg: failures > 0 ? "#DC2626" : "#475569" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2.5">
        <h1 className="text-[1.4rem] font-700 text-slate-900">AI Analytics</h1>
      </div>
      <p className="mt-1 text-[0.86rem] text-slate-500">Measured from every Oge call in the last 30 days. Cost is not shown: per-model pricing is not configured.</p>

      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle">
            <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: c.tint, color: c.fg }}><c.icon size={17} /></span>
            <p className="mt-3 text-[1.5rem] font-700 text-slate-900">{c.value}</p>
            <p className="text-[0.78rem] text-slate-500">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.95rem] font-700 text-slate-900">Usage by Feature</h2>
          <ul className="mt-3 flex flex-col gap-2.5">
            {featureUsage.map((f) => (
              <li key={f.name} className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-[0.82rem] font-600 text-slate-700">{f.name}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-[#543CDA]" style={{ width: `${f.pct}%` }} /></span>
                <span className="w-10 shrink-0 text-right text-[0.78rem] font-600 text-slate-500">{f.pct}%</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.95rem] font-700 text-slate-900">Requests by Model</h2>
          <ul className="mt-3 flex flex-col gap-2.5">
            {modelUsage.map((m) => (
              <li key={m.name} className="flex items-center gap-3">
                <span className="w-40 shrink-0 text-[0.82rem] font-600 text-slate-700">{m.name}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-[#6A55F2]" style={{ width: `${m.pct}%` }} /></span>
                <span className="w-10 shrink-0 text-right text-[0.78rem] font-600 text-slate-500">{m.pct}%</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white shadow-subtle">
        <div className="border-b border-slate-100 px-5 py-3.5"><h2 className="text-[0.95rem] font-700 text-slate-900">Recent AI Activity</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead><tr className="border-b border-slate-200 bg-slate-50 text-[0.66rem] uppercase tracking-wide text-slate-500"><th className="px-5 py-3 font-600">Time</th><th className="px-5 py-3 font-600">User</th><th className="px-5 py-3 font-600">Activity</th><th className="px-5 py-3 text-right font-600">Status</th></tr></thead>
            <tbody>
              {activities.map((a) => {
                const s = a.status ? (STATUS[a.status] ?? { bg: "#F1F5F9", fg: "#64748B" }) : null;
                return (
                  <tr key={a.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                    <td className="px-5 py-3 text-[0.8rem] text-slate-500">{ago(a.created_at)}</td>
                    <td className="px-5 py-3 text-[0.82rem] font-600 text-slate-800">{a.actor_name ?? "Oge AI"}</td>
                    <td className="px-5 py-3"><span className="block max-w-[22rem] truncate text-[0.82rem] text-slate-600">{a.action}{a.subject ? ` “${a.subject}”` : ""}</span></td>
                    <td className="px-5 py-3 text-right">{s ? <span className="inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-600" style={{ background: s.bg, color: s.fg }}>{a.status}</span> : <span className="text-slate-300">—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
