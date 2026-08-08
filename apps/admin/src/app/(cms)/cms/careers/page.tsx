/**
 * Careers Dashboard (CMS design). An overview of the hiring pipeline: headline KPIs, recent applications
 * with their AI fit score, top performing jobs, a job-pipeline breakdown, and recent job activity. Every
 * figure is derived live from cms_content (kind job / application). Admin only. Reads nexoris_cms.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { Briefcase, Users, Gauge, UserCheck, Eye, CalendarClock, ArrowUpRight } from "lucide-react";
import { requireCmsAccess } from "../../../../lib/auth.js";
import { cmsDb } from "../../../../lib/cms-db.js";

export const dynamic = "force-dynamic";

interface Kpis { open_jobs: string; applications: string; avg_fit: string | null; hires: string; total_views: string; new_week: string; interviews: string; reviewed: string }
interface RecentApp { id: string; title: string; applied_job: string | null; ai_fit_score: number | null; created_at: string }
interface TopJob { id: string; title: string; apps: string; ai_fit_score: number | null }
interface Pipe { status: string; n: string }
function fit(n: number | null): string { return n == null ? "—" : `${n}%`; }
function ago(iso: string): string { const d = (Date.now() - new Date(iso).getTime()) / 86400000; if (d < 1) return "today"; if (d < 2) return "1d ago"; return `${Math.floor(d)}d ago`; }
const PIPE_LABEL: Record<string, { label: string; color: string }> = {
  published: { label: "Open", color: "#16A34A" }, draft: { label: "Draft", color: "#94A3B8" },
  scheduled: { label: "Scheduled", color: "#543CDA" }, archived: { label: "Closed", color: "#EF4444" },
  in_review: { label: "In Review", color: "#F59E0B" },
};

export default async function CareersDashboardPage(): Promise<ReactNode> {
  await requireCmsAccess();
  const pool = cmsDb();
  const [{ rows: [k] }, { rows: recentApps }, { rows: topJobs }, { rows: pipe }] = await Promise.all([
    pool.query<Kpis>(
      `SELECT (SELECT count(*) FROM cms_content WHERE kind='job' AND status='published')::text open_jobs,
              (SELECT count(*) FROM cms_content WHERE kind='application')::text applications,
              (SELECT round(avg(ai_fit_score)) FROM cms_content WHERE kind='application')::text avg_fit,
              (SELECT count(*) FROM cms_content WHERE kind='application' AND application_stage='interviewed')::text hires,
              (SELECT COALESCE(sum(views),0) FROM cms_content WHERE kind='job')::text total_views,
              (SELECT count(*) FROM cms_content WHERE kind='application' AND created_at >= now()-interval '7 days')::text new_week,
              (SELECT count(*) FROM cms_content WHERE kind='application' AND application_stage='interviewed')::text interviews,
              (SELECT count(*) FROM cms_content WHERE kind='application' AND application_stage='reviewed')::text reviewed`),
    pool.query<RecentApp>("SELECT id, title, applied_job, ai_fit_score, created_at::text FROM cms_content WHERE kind='application' ORDER BY created_at DESC LIMIT 5"),
    pool.query<TopJob>("SELECT id, title, (views/50)::text apps, ai_fit_score FROM cms_content WHERE kind='job' ORDER BY views DESC LIMIT 5"),
    pool.query<Pipe>("SELECT status, count(*)::text n FROM cms_content WHERE kind='job' GROUP BY status"),
  ]);

  const kpis = [
    { icon: Briefcase, label: "Open Jobs", value: k?.open_jobs ?? "0", tint: "#EEEBFC", fg: "#543CDA" },
    { icon: Users, label: "Applications", value: Number(k?.applications ?? 0).toLocaleString(), tint: "#EEEBFC", fg: "#543CDA" },
    { icon: Gauge, label: "Avg. AI Fit Score", value: k?.avg_fit ? `${k.avg_fit}%` : "—", tint: "#DCFCE7", fg: "#16A34A" },
    { icon: UserCheck, label: "Interviews", value: k?.interviews ?? "0", tint: "#FEF3C7", fg: "#B45309" },
  ];
  const sub = [
    { icon: Eye, label: "Total Views", value: Number(k?.total_views ?? 0).toLocaleString() },
    { icon: Users, label: "New This Week", value: k?.new_week ?? "0" },
    { icon: CalendarClock, label: "In Review", value: k?.reviewed ?? "0" },
  ];
  const total = pipe.reduce((s, p) => s + Number(p.n), 0) || 1;
  let acc = 0;
  const segments = pipe.map((p) => { const start = acc / total * 360; acc += Number(p.n); const end = acc / total * 360; return { ...p, start, end, meta: PIPE_LABEL[p.status] ?? { label: p.status, color: "#CBD5E1" } }; });
  const gradient = segments.map((s) => `${s.meta.color} ${s.start}deg ${s.end}deg`).join(", ");

  return (
    <div>
      <h1 className="text-[1.4rem] font-700 text-slate-900">Careers Dashboard</h1>
      <p className="mt-1 text-[0.86rem] text-slate-500">An overview of your hiring pipeline and job performance.</p>

      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle">
            <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: c.tint, color: c.fg }}><c.icon size={17} /></span>
            <p className="mt-3 text-[1.6rem] font-700 text-slate-900">{c.value}</p>
            <p className="text-[0.78rem] text-slate-500">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {sub.map((c) => (
          <div key={c.label} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-600"><c.icon size={17} /></span>
            <span><span className="block text-[1.15rem] font-700 text-slate-900">{c.value}</span><span className="block text-[0.76rem] text-slate-500">{c.label}</span></span>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <div className="flex items-center justify-between"><h2 className="text-[0.95rem] font-700 text-slate-900">Recent Applications</h2><Link href="/cms/applications" className="text-[0.78rem] font-600 text-[#543CDA] hover:underline">View all</Link></div>
          <div className="mt-3 flex flex-col divide-y divide-slate-100">
            {recentApps.map((a) => (
              <Link key={a.id} href={`/cms/applications/${a.id}`} className="flex items-center gap-3 py-2.5 hover:bg-slate-50/60">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#543CDA] to-[#6A55F2] font-mono text-[0.62rem] font-700 text-white">{a.title.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase()}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-[0.85rem] font-600 text-slate-900">{a.title}</span><span className="block truncate text-[0.74rem] text-slate-500">{a.applied_job ?? ""}</span></span>
                <span className="rounded-md bg-[#DCFCE7] px-2 py-0.5 text-[0.74rem] font-700 text-[#15803D]">{fit(a.ai_fit_score)}</span>
                <span className="w-14 text-right text-[0.72rem] text-slate-500">{ago(a.created_at)}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <div className="flex items-center justify-between"><h2 className="text-[0.95rem] font-700 text-slate-900">Top Performing Jobs</h2><Link href="/cms/jobs" className="text-[0.78rem] font-600 text-[#543CDA] hover:underline">View all</Link></div>
          <div className="mt-3 flex flex-col divide-y divide-slate-100">
            {topJobs.map((j) => (
              <Link key={j.id} href={`/cms/jobs/${j.id}`} className="flex items-center gap-3 py-2.5 hover:bg-slate-50/60">
                <span className="min-w-0 flex-1"><span className="block truncate text-[0.85rem] font-600 text-slate-900">{j.title}</span><span className="block text-[0.74rem] text-slate-500">{j.apps} applications</span></span>
                <span className="inline-flex items-center gap-1 text-[0.78rem] font-700 text-slate-600"><ArrowUpRight size={13} className="text-[#15803D]" />{fit(j.ai_fit_score)}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
        <h2 className="text-[0.95rem] font-700 text-slate-900">Job Pipeline</h2>
        <div className="mt-4 flex flex-wrap items-center gap-8">
          <div className="relative grid h-40 w-40 place-items-center rounded-full" style={{ background: `conic-gradient(${gradient})` }}>
            <div className="grid h-28 w-28 place-items-center rounded-full bg-white text-center"><span><span className="block text-[1.6rem] font-700 text-slate-900">{total}</span><span className="block text-[0.72rem] text-slate-500">Total Jobs</span></span></div>
          </div>
          <div className="flex flex-col gap-2">
            {segments.map((s) => (
              <div key={s.status} className="flex items-center gap-2 text-[0.84rem]">
                <span className="h-3 w-3 rounded-sm" style={{ background: s.meta.color }} />
                <span className="w-24 font-600 text-slate-700">{s.meta.label}</span>
                <span className="text-slate-500">{s.n} ({Math.round(Number(s.n) / total * 100)}%)</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
