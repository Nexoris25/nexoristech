/**
 * AI Dashboard Overview (CMS Oge AI Workspace design, PRD §10). A snapshot of Oge's usage: request volume,
 * tokens, cost, success rate, average response time, and knowledge-base size, plus a requests-by-feature
 * breakdown, recent AI activity (live from cms_activity), and quick actions. Usage figures are the current
 * period estimates; recent activity and KB size are real. CMS access only. Responsive.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { Sparkles, Coins, CheckCircle2, Timer, Database, Library, SlidersHorizontal, BarChart3, ChevronRight } from "lucide-react";
import { requireCmsAccess } from "../../../../lib/auth.js";
import { cmsDb } from "../../../../lib/cms-db.js";

export const dynamic = "force-dynamic";

interface Activity { id: string; actor_name: string | null; action: string; subject: string | null; status: string | null; created_at: string }
function ago(iso: string): string { const s = (Date.now() - new Date(iso).getTime()) / 1000; if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`; if (s < 86400) return `${Math.floor(s / 3600)}h ago`; return `${Math.floor(s / 86400)}d ago`; }

export default async function AiDashboardPage(): Promise<ReactNode> {
  await requireCmsAccess();
  const pool = cmsDb();
  const [{ rows: activities }, { rows: [kb] }, { rows: [usage] }, { rows: featureRows }] = await Promise.all([
    pool.query<Activity>("SELECT id, actor_name, action, subject, status, created_at::text FROM cms_activity WHERE category IN ('AI Workspace','Workflow') ORDER BY created_at DESC LIMIT 6"),
    pool.query<{ sources: string }>("SELECT (SELECT count(*) FROM cms_content WHERE status='published' AND kind IN ('insight','case_study','legal_page','generated_page'))::text sources"),
    // Measured from cms_ai_usage. Requests, success rate and latency are recorded per call; token
    // counts appear only when the gateway reports them.
    pool.query<{ today: string; ok: string; avg_ms: string | null; tokens: string | null }>(
      `SELECT count(*)::text AS today,
              count(*) FILTER (WHERE ok)::text AS ok,
              round(avg(duration_ms))::text AS avg_ms,
              sum(coalesce(prompt_tokens,0) + coalesce(completion_tokens,0))::text AS tokens
         FROM cms_ai_usage WHERE created_at > now() - interval '24 hours'`),
    pool.query<{ name: string; c: string }>(
      `SELECT feature AS name, count(*)::text AS c FROM cms_ai_usage
        WHERE created_at > now() - interval '30 days' GROUP BY feature ORDER BY count(*) DESC LIMIT 6`),
  ]);
  const kbSources = Number(kb?.sources ?? 0) + 36; // published CMS grounding + 36 hardcoded marketing pages

  const requestsToday = Number(usage?.today ?? 0);
  const okToday = Number(usage?.ok ?? 0);
  const tokensToday = Number(usage?.tokens ?? 0);
  const avgMs = usage?.avg_ms ? Number(usage.avg_ms) : null;
  const successRate = requestsToday > 0 ? Math.round((okToday / requestsToday) * 1000) / 10 : null;
  const abbr = (n: number): string => (n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n));

  const kpis = [
    { icon: Sparkles, label: "AI requests (24h)", value: requestsToday.toLocaleString("en-NG"), delta: "", tint: "#EEEBFC", fg: "#543CDA" },
    { icon: Coins, label: "Tokens reported", value: tokensToday > 0 ? abbr(tokensToday) : "—", delta: "", tint: "#EEEBFC", fg: "#543CDA" },
    { icon: CheckCircle2, label: "Success rate", value: successRate !== null ? `${successRate}%` : "—", delta: "", tint: "#DCFCE7", fg: "#15803D" },
    { icon: Timer, label: "Average response", value: avgMs !== null ? `${(avgMs / 1000).toFixed(2)}s` : "—", delta: "", tint: "#EDE9FE", fg: "#6D28D9" },
    { icon: Database, label: "Knowledge sources", value: kbSources.toLocaleString("en-NG"), delta: "", tint: "#EEEBFC", fg: "#543CDA" },
  ];

  // Feature split from recorded calls. An empty ring is the truth before anything has been generated.
  const featureTotal = featureRows.reduce((sum, r) => sum + Number(r.c), 0);
  const RING = ["#543CDA", "#6A55F2", "#3B82F6", "#14B8A6", "#F59E0B", "#CBD5E1"];
  const features = featureRows.map((r, i) => ({
    name: r.name,
    pct: featureTotal > 0 ? Math.round((Number(r.c) / featureTotal) * 1000) / 10 : 0,
    color: RING[i % RING.length]!,
  }));
  let acc = 0;
  const segs = features.map((f) => { const s = acc / 100 * 360; acc += f.pct; return { ...f, s, e: acc / 100 * 360 }; });
  const grad = segs.map((s) => `${s.color} ${s.s}deg ${s.e}deg`).join(", ");
  const quick = [
    { icon: Library, label: "Open Knowledge Base", href: "/cms/ai/knowledge-base" },
    { icon: SlidersHorizontal, label: "AI Configuration", href: "/cms/ai/configuration" },
    { icon: BarChart3, label: "View AI Analytics", href: "/cms/ai/analytics" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2.5">
        <h1 className="text-[1.4rem] font-700 text-slate-900">AI Dashboard</h1>
      </div>
      <p className="mt-1 text-[0.86rem] text-slate-500">Measured from every Oge call. The figures below cover the last 24 hours; a dash means nothing has been recorded yet.</p>

      <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
        {kpis.map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle">
            <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: c.tint, color: c.fg }}><c.icon size={17} /></span>
            <p className="mt-3 text-[1.35rem] font-700 text-slate-900">{c.value}</p>
            <p className="text-[0.74rem] text-slate-500">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <div className="flex items-center justify-between"><h2 className="text-[0.95rem] font-700 text-slate-900">Recent AI Activity</h2><Link href="/cms/ai/analytics" className="text-[0.78rem] font-600 text-[#543CDA] hover:underline">View all</Link></div>
          <div className="mt-3 flex flex-col divide-y divide-slate-100">
            {activities.map((a) => (
              <div key={a.id} className="flex items-center gap-3 py-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#EEEBFC] text-[#543CDA]"><Sparkles size={15} /></span>
                <span className="min-w-0 flex-1"><span className="block truncate text-[0.84rem] font-600 text-slate-800">{a.actor_name ?? "Oge AI"} {a.action}{a.subject ? ` “${a.subject}”` : ""}</span><span className="block text-[0.72rem] text-slate-500">{ago(a.created_at)}</span></span>
                {a.status ? <span className="shrink-0 rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[0.68rem] font-600 text-[#15803D]">{a.status}</span> : null}
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-col gap-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
            <div>
              <h2 className="text-[0.95rem] font-700 text-slate-900">Requests by feature</h2>
              <p className="text-[0.76rem] text-slate-600">Over the last 30 days, so a quiet day does not empty the chart.</p>
            </div>
            <div className="mt-3 flex items-center gap-4">
              <div className="relative grid h-24 w-24 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(${grad})` }}>
                <div className="grid h-16 w-16 place-items-center rounded-full bg-white text-center"><span className="text-[0.7rem] font-600 text-slate-500">Features</span></div>
              </div>
              <ul className="flex flex-col gap-1 text-[0.76rem]">
                {features.map((f) => <li key={f.name} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: f.color }} /><span className="w-24 text-slate-600">{f.name}</span><span className="font-600 text-slate-800">{f.pct}%</span></li>)}
              </ul>
            </div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
            <h2 className="text-[0.95rem] font-700 text-slate-900">Quick Actions</h2>
            <ul className="mt-2 flex flex-col gap-1">
              {quick.map((q) => <li key={q.label}><Link href={q.href} className="flex items-center gap-2 rounded-lg px-3 py-2 text-[0.84rem] font-600 text-slate-600 hover:bg-slate-50 hover:text-[#543CDA]"><q.icon size={15} className="text-slate-500" />{q.label}<ChevronRight size={15} className="ml-auto text-slate-500" /></Link></li>)}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
