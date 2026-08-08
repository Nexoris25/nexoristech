/**
 * CMS Dashboard Overview (owner's CMS design). The CMS is a module of the admin platform on its own
 * nexoris_cms database. Every figure here is a live query against that database - counts, statuses,
 * search metrics, top content, activity, and workflow - so the numbers update as content is created,
 * reviewed, and published. Period deltas compare the last 30 days with the 30 before. Admin only.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import {
  FileText, FileCode, Briefcase, FolderOpen, Users, Eye, Download,
  TrendingUp, TrendingDown, ArrowRight, Plus, Image as ImageIcon, LayoutTemplate, ListChecks, Bot,
} from "lucide-react";
import { requireCmsAccess } from "../../../lib/auth.js";
import { cmsDb } from "../../../lib/cms-db.js";
import { AreaChart, Donut } from "../../../components/charts.js";
import { SearchConsolePanel } from "../../../components/cms/SearchConsolePanel.js";
import { RangeFilter } from "../../../components/cms/RangeFilter.js";
import { fetchGscLatestDays } from "../../../lib/google/gsc.js";
import { fetchGa4Totals, fetchGa4TopPages } from "../../../lib/google/ga4.js";
import { GSC_RANGES, GSC_COLORS, resolveRange } from "../../../lib/google/gsc-constants.js";

export const dynamic = "force-dynamic";

const fmt = (n: number): string => n.toLocaleString("en-NG");
const fmtGscDay = (isoDate: string): string => new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "2-digit" });
function abbr(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`;
  return fmt(n);
}
const pct1 = (n: number): string => `${n >= 0 ? "" : ""}${n.toFixed(1)}%`;
function delta(recent: number, prev: number): number {
  if (prev <= 0) return recent > 0 ? 100 : 0;
  return ((recent - prev) / prev) * 100;
}

const STATUS_STYLE: Record<string, string> = {
  Published: "bg-[#DCFCE7] text-[#15803D]", "In Review": "bg-[#FEF3C7] text-[#B45309]",
  Completed: "bg-[#DBEAFE] text-[#1D4ED8]", New: "bg-[#EEEBFC] text-[#543CDA]",
};

export default async function CmsDashboard({ searchParams }: { searchParams: Promise<{ range?: string }> }): Promise<ReactNode> {
  const staff = await requireCmsAccess();
  const firstName = staff.name.split(/\s+/)[0] ?? staff.name;
  const activeRange = resolveRange((await searchParams).range);
  const rangeDays = activeRange.days;
  const pool = cmsDb();

  const [{ rows: k }, { rows: spark }, { rows: gscSeed }, { rows: statusRows }, { rows: insightTitles }, { rows: activity }, { rows: glance }, { rows: workflow }] = await Promise.all([
    pool.query<{ vi: string; ri: string; pi: string; vp: string; rp: string; pp: string; vj: string; rj: string; pj: string; va: string; ra: string; pa: string; vu: string; ru: string; pu: string; vv: string }>(
      // $1 is the selected window in days and $2 is twice it, so "recent" is the window the picker
      // names and "previous" is the equal-length window immediately before it.
      `SELECT
        (SELECT count(*) FROM cms_content WHERE kind='insight' AND status='published')::text vi,
        (SELECT count(*) FROM cms_content WHERE kind='insight' AND status='published' AND created_at >= now() - ($1 || ' days')::interval)::text ri,
        (SELECT count(*) FROM cms_content WHERE kind='insight' AND status='published' AND created_at >= now() - ($2 || ' days')::interval AND created_at < now() - ($1 || ' days')::interval)::text pi,
        (SELECT count(*) FROM cms_content WHERE kind='generated_page')::text vp,
        (SELECT count(*) FROM cms_content WHERE kind='generated_page' AND created_at >= now() - ($1 || ' days')::interval)::text rp,
        (SELECT count(*) FROM cms_content WHERE kind='generated_page' AND created_at >= now() - ($2 || ' days')::interval AND created_at < now() - ($1 || ' days')::interval)::text pp,
        (SELECT count(*) FROM cms_content WHERE kind='job' AND status='published')::text vj,
        (SELECT count(*) FROM cms_content WHERE kind='job' AND created_at >= now() - ($1 || ' days')::interval)::text rj,
        (SELECT count(*) FROM cms_content WHERE kind='job' AND created_at >= now() - ($2 || ' days')::interval AND created_at < now() - ($1 || ' days')::interval)::text pj,
        (SELECT count(*) FROM cms_media)::text va,
        (SELECT count(*) FROM cms_media WHERE created_at >= now() - ($1 || ' days')::interval)::text ra,
        (SELECT count(*) FROM cms_media WHERE created_at >= now() - ($2 || ' days')::interval AND created_at < now() - ($1 || ' days')::interval)::text pa,
        (SELECT count(*) FROM cms_author WHERE active)::text vu,
        (SELECT count(*) FROM cms_author WHERE active AND created_at >= now() - ($1 || ' days')::interval)::text ru,
        (SELECT count(*) FROM cms_author WHERE active AND created_at >= now() - ($2 || ' days')::interval AND created_at < now() - ($1 || ' days')::interval)::text pu,
        (SELECT count(*) FROM cms_content WHERE status='published')::text vv`,
      [String(rangeDays), String(rangeDays * 2)]),
    pool.query<{ insights: string; pages: string; jobs: string; assets: string; users: string }>(
      `SELECT
        (SELECT count(*) FROM cms_content WHERE kind='insight' AND status='published' AND created_at::date=d::date)::text insights,
        (SELECT count(*) FROM cms_content WHERE kind='generated_page' AND created_at::date=d::date)::text pages,
        (SELECT count(*) FROM cms_content WHERE kind='job' AND created_at::date=d::date)::text jobs,
        (SELECT count(*) FROM cms_media WHERE created_at::date=d::date)::text assets,
        (SELECT count(*) FROM cms_author WHERE created_at::date=d::date)::text users
       FROM generate_series(current_date - ($1::int - 1), current_date, interval '1 day') d ORDER BY d`,
      [rangeDays]),
    pool.query<{ label: string; clicks: string; impressions: string; page_views: string; avg_position: string }>(
      "SELECT to_char(day,'Mon DD') AS label, clicks::text, impressions::text, page_views::text, avg_position::text FROM cms_metric_daily ORDER BY day"),
    pool.query<{ status: string; c: string }>("SELECT status, count(*)::text c FROM cms_content GROUP BY status"),
    // Titles and slugs only. Ranking by cms_content.views ranked a column the seed filled and nothing
    // has ever incremented; the ordering now comes from Analytics and this is the lookup for the title.
    pool.query<{ title: string; slug: string | null }>(
      "SELECT title, slug FROM cms_content WHERE kind='insight' AND status='published'"),
    pool.query<{ actor_name: string; action: string; subject: string | null; category: string; status: string; created_at: string }>(
      "SELECT actor_name, action, subject, category, status, created_at::text FROM cms_activity ORDER BY created_at DESC LIMIT 5"),
    pool.query<{ kind: string; c: string }>("SELECT kind, count(*)::text c FROM cms_content GROUP BY kind"),
    pool.query<{ workflow_state: string; c: string }>("SELECT workflow_state, count(*)::text c FROM cms_content WHERE workflow_state IS NOT NULL GROUP BY workflow_state"),
  ]);
  const r = k[0]!;
  const series = (key: keyof (typeof spark)[number]): number[] => spark.map((row) => Number(row[key]));

  // Analytics answers what Search Console cannot: how many pages were actually viewed, and which.
  const [liveGsc, ga4, ga4Top] = await Promise.all([
    fetchGscLatestDays(rangeDays * 2),
    fetchGa4Totals(rangeDays),
    fetchGa4TopPages(rangeDays, 5),
  ]);

  // Rank by Analytics and look the title up by slug. A page Analytics knows but the CMS does not still
  // shows, under its path: it is real traffic, and hiding it would be the same silence as inventing it.
  const bySlug = new Map(insightTitles.filter((t) => t.slug).map((t) => [`/insights/${t.slug}`, t.title]));
  const topInsights = (ga4Top ?? [])
    .filter((row) => row.path.startsWith("/insights/"))
    .map((row) => ({ title: bySlug.get(row.path) ?? row.path, views: row.views }));
  const gscLive = Boolean(liveGsc && liveGsc.length);
  const gsc = gscLive
    ? liveGsc!.map((d) => ({ label: fmtGscDay(d.date), clicks: String(Math.round(d.clicks)), impressions: String(Math.round(d.impressions)), page_views: "0", avg_position: d.position.toFixed(1) }))
    : gscSeed;

  // One accent colour across the row: a KPI's colour should not imply a meaning it does not have, and a
  // sparkline must plot its own metric or nothing at all. Page views have no daily series in the CMS, so
  // that card shows no chart rather than borrowing another metric's shape.
  const ACCENT = "#543CDA";
  // `d` is null on a card with nothing to compare against, so it prints no trend rather than a
  // confident "0.0%".
  const kpis: { label: string; value: string; d: number | null; icon: typeof FileText; color: string; spark: number[] }[] = [
    { label: "Published Insights", value: fmt(+r.vi), d: delta(+r.ri, +r.pi), icon: FileText, color: ACCENT, spark: series("insights") },
    { label: "Generated Pages", value: fmt(+r.vp), d: delta(+r.rp, +r.pp), icon: FileCode, color: ACCENT, spark: series("pages") },
    { label: "Job Openings", value: fmt(+r.vj), d: delta(+r.rj, +r.pj), icon: Briefcase, color: ACCENT, spark: series("jobs") },
    { label: "Total Assets", value: fmt(+r.va), d: delta(+r.ra, +r.pa), icon: FolderOpen, color: ACCENT, spark: series("assets") },
    { label: "Active Users", value: fmt(+r.vu), d: delta(+r.ru, +r.pu), icon: Users, color: ACCENT, spark: series("users") },
    // Measured by Analytics over the selected window. It read sum(cms_content.views) before, which the
    // seed filled with 608,000 views that nobody ever had.
    { label: `Page views (${activeRange.label.replace("Last ", "")})`, value: ga4 ? abbr(ga4.pageViews) : "—", d: null, icon: Eye, color: ACCENT, spark: [] as number[] },
  ];

  // Google Search Console panel — the current window plus the previous equal-length window for compare.
  const gscWin = gsc.slice(-rangeDays);
  const gscPrev = gsc.slice(-rangeDays * 2, -rangeDays);
  const sum = (arr: typeof gsc, key: "clicks" | "impressions"): number => arr.reduce((s, x) => s + +x[key], 0);
  const avg = (arr: typeof gsc, key: "avg_position"): number => (arr.length ? arr.reduce((s, x) => s + +x[key], 0) / arr.length : 0);
  const curClicks = sum(gscWin, "clicks"), curImpr = sum(gscWin, "impressions");
  const curCtr = curImpr > 0 ? (curClicks / curImpr) * 100 : 0, curPos = avg(gscWin, "avg_position");
  const prvClicks = sum(gscPrev, "clicks"), prvImpr = sum(gscPrev, "impressions");
  const prvCtr = prvImpr > 0 ? (prvClicks / prvImpr) * 100 : 0, prvPos = avg(gscPrev, "avg_position");
  const pctChange = (cur: number, prev: number): number => (prev > 0 ? ((cur - prev) / prev) * 100 : 0);
  const half = Math.floor(gscWin.length / 2);
  /**
   * Movement within the selected window: its second half against its first.
   *
   * A window of one day has no halves. The old guard turned that empty first half into `|| 1` and
   * divided by it, so a single day of 591 impressions reported a rise of 59,000% — an artefact of the
   * arithmetic, not anything that happened. With too few points to split, there is no in-window trend
   * to report and this says zero rather than inventing one; the period-over-period figure is on the
   * Compare toggle, which is where that comparison belongs.
   */
  const trend = (arr: number[]): number => {
    if (half < 1) return 0;
    const a = arr.slice(0, half).reduce((s, x) => s + x, 0);
    if (a === 0) return 0;
    const b = arr.slice(half).reduce((s, x) => s + x, 0);
    return ((b - a) / a) * 100;
  };
  const ctrSeries = (arr: typeof gsc): number[] => arr.map((x) => (+x.impressions > 0 ? (+x.clicks / +x.impressions) * 100 : 0));
  const toDay = (x: (typeof gsc)[number]): { label: string; clicks: number; impressions: number; ctr: number; position: number } =>
    ({ label: x.label, clicks: +x.clicks, impressions: +x.impressions, ctr: +x.impressions > 0 ? (+x.clicks / +x.impressions) * 100 : 0, position: +x.avg_position });

  // Content status donut
  const STATUS_ORDER: [string, string, string][] = [
    ["published", "Published", "#543CDA"], ["in_review", "In Review", "#F59E0B"],
    ["draft", "Draft", "#3B82F6"], ["scheduled", "Scheduled", "#16A34A"], ["archived", "Archived", "#94A3B8"],
  ];
  const statusMap = new Map(statusRows.map((x) => [x.status, +x.c]));
  const totalContent = statusRows.reduce((s, x) => s + +x.c, 0);
  const donutSegs = STATUS_ORDER.map(([key, , color]) => ({ value: statusMap.get(key) ?? 0, color }));

  const glanceMap = new Map(glance.map((x) => [x.kind, +x.c]));
  const GLANCE: [string, string, string][] = [
    ["insight", "Insights", "#543CDA"], ["generated_page", "Generated Pages", "#16A34A"], ["case_study", "Case Studies", "#3B82F6"],
    ["testimonial", "Testimonials", "#F59E0B"], ["job", "Jobs", "#EF4444"], ["application", "Applications", "#6A55F2"], ["legal_page", "Legal Pages", "#0F766E"],
  ];

  const WF_ORDER: [string, string, string][] = [
    ["pending_review", "Pending Review", "#F59E0B"], ["ai_review", "AI Review", "#6A55F2"], ["editorial_review", "Editorial Review", "#3B82F6"],
    ["legal_review", "Legal Review", "#16A34A"], ["scheduled", "Scheduled", "#EF4444"], ["ready_to_publish", "Ready to Publish", "#543CDA"],
  ];
  const wfMap = new Map(workflow.map((x) => [x.workflow_state, +x.c]));

  const quickActions = [
    { label: "New Insight", icon: Plus, href: "/cms/insights/new" }, { label: "Create Job", icon: Briefcase, href: "/cms/jobs/new" },
    { label: "Upload Media", icon: ImageIcon, href: "/cms/media" }, { label: "New Template", icon: LayoutTemplate, href: "/cms/templates/new" },
    { label: "Review Queue", icon: ListChecks, href: "/cms/review-queue" }, { label: "AI Workspace", icon: Bot, href: "/cms/ai" },
  ];

  function Trend({ d }: { d: number }): ReactNode {
    const up = d >= 0;
    return <span className={`inline-flex items-center gap-0.5 text-[0.72rem] font-600 ${up ? "text-[#15803D]" : "text-[#B91C1C]"}`}>{up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{pct1(Math.abs(d))}</span>;
  }

  return (
    <div className="mx-auto max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[1.5rem] font-700 text-slate-900">Dashboard Overview</h1>
          <p className="mt-1 text-[0.88rem] text-slate-500">Welcome back, {firstName}! Here&apos;s what&apos;s happening with your CMS.</p>
        </div>
        <div className="flex items-center gap-2">
          <RangeFilter defaultValue="7d" options={GSC_RANGES.map((r) => ({ value: r.value, label: r.label }))} />
          <a href="/api/cms/report" className="inline-flex items-center gap-1.5 rounded-lg bg-[#543CDA] px-4 py-2 text-[0.82rem] font-600 text-white hover:bg-[#4330B8]"><Download size={15} /> Export Report</a>
        </div>
      </div>

      {/* KPI row */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle">
            <div className="flex items-start justify-between">
              <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: `${kpi.color}1A`, color: kpi.color }}><kpi.icon size={18} strokeWidth={2} /></span>
            </div>
            <p className="mt-2 text-[0.76rem] font-600 text-slate-500">{kpi.label}</p>
            <p className="mt-0.5 text-[1.5rem] font-700 leading-tight text-slate-900">{kpi.value}</p>
            {kpi.d !== null ? (
              <div className="mt-0.5"><Trend d={kpi.d} /> <span className="text-[0.68rem] text-slate-600">vs previous {activeRange.label.replace("Last ", "")}</span></div>
            ) : null}
            {kpi.spark.length > 1 ? <div className="mt-1 -mb-1 h-10"><AreaChart values={kpi.spark} color={kpi.color} height={40} /></div> : null}
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-5">
        {/* Google Search Console */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle xl:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-[1rem] font-700 text-slate-900">Google Search Console Performance</h2>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.68rem] font-700 ${gscLive ? "bg-[#DCFCE7] text-[#15803D]" : "bg-slate-100 text-slate-600"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${gscLive ? "bg-[#16A34A]" : "bg-slate-400"}`} />{gscLive ? "Live" : "Sample"}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[0.72rem] font-600 text-slate-600">
                {gscWin.length} {gscWin.length === 1 ? "day" : "days"}
              </span>
            </div>
          </div>
          <div className="mt-4">
            <SearchConsolePanel
              metrics={[
                { key: "clicks", label: "Total Clicks", color: GSC_COLORS.clicks, value: abbr(curClicks), delta: trend(gscWin.map((x) => +x.clicks)), compareValue: abbr(prvClicks), compareDelta: pctChange(curClicks, prvClicks) },
                { key: "impressions", label: "Total Impressions", color: GSC_COLORS.impressions, value: abbr(curImpr), delta: trend(gscWin.map((x) => +x.impressions)), compareValue: abbr(prvImpr), compareDelta: pctChange(curImpr, prvImpr) },
                { key: "ctr", label: "Average CTR", color: GSC_COLORS.ctr, value: `${curCtr.toFixed(2)}%`, delta: trend(ctrSeries(gscWin)), compareValue: `${prvCtr.toFixed(2)}%`, compareDelta: pctChange(curCtr, prvCtr) },
                { key: "position", label: "Average Position", color: GSC_COLORS.position, value: curPos.toFixed(1), delta: -trend(gscWin.map((x) => +x.avg_position)), compareValue: prvPos.toFixed(1), compareDelta: -pctChange(curPos, prvPos) },
              ]}
              days={gscWin.map(toDay)}
              prevDays={gscPrev.map(toDay)}
              compareLabel={activeRange.label.toLowerCase()}
            />
          </div>
        </section>

        {/* Content Status */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle xl:col-span-2">
          <h2 className="text-[1rem] font-700 text-slate-900">Content Status</h2>
          <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
            <Donut segments={donutSegs} size={160} thickness={22} centerTop={fmt(totalContent)} centerBottom="Total Content" />
            <ul className="w-full flex-1 space-y-2.5">
              {STATUS_ORDER.map(([key, label, color]) => {
                const c = statusMap.get(key) ?? 0;
                const p = totalContent ? (c / totalContent) * 100 : 0;
                return (
                  <li key={key} className="flex items-center gap-2.5 text-[0.82rem]">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
                    <span className="min-w-0 flex-1 truncate text-slate-600">{label}</span>
                    <span className="shrink-0 font-mono font-600 tabular-nums text-slate-900">{fmt(c)}</span>
                    <span className="w-14 shrink-0 text-right font-mono tabular-nums text-slate-500">{p.toFixed(1)}%</span>
                  </li>
                );
              })}
            </ul>
          </div>
          <Link href="/cms/insights" className="mt-4 flex items-center justify-center gap-1.5 border-t border-slate-100 pt-3 text-[0.8rem] font-600 text-[#543CDA]">View all content <ArrowRight size={14} /></Link>
        </section>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Recent Activity */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle xl:col-span-2">
          <h2 className="text-[1rem] font-700 text-slate-900">Recent Activity</h2>
          <ul className="mt-4 flex flex-col divide-y divide-slate-100">
            {activity.map((a, i) => (
              <li key={i} className="flex items-center gap-3 py-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#EEEBFC] font-mono text-[0.62rem] font-700 text-[#543CDA]">{(a.actor_name ?? "?").split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase()}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.83rem] text-slate-800"><span className="font-600">{a.actor_name}</span> {a.action}{a.subject ? <span className="font-600"> “{a.subject}”</span> : ""}</span>
                  <span className="block text-[0.72rem] text-slate-500">{a.category} · {new Date(a.created_at).toLocaleDateString("en-NG", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                </span>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[0.7rem] font-600 ${STATUS_STYLE[a.status] ?? "bg-slate-100 text-slate-600"}`}>{a.status}</span>
              </li>
            ))}
          </ul>
          <Link href="/cms/activity-log" className="mt-2 inline-flex items-center gap-1.5 text-[0.8rem] font-600 text-[#543CDA]">View all activity <ArrowRight size={14} /></Link>
        </section>

        {/* Top Performing Insights */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <div className="flex items-center justify-between"><h2 className="text-[1rem] font-700 text-slate-900">Most read insights</h2><Link href="/cms/insights" className="text-[0.76rem] font-600 text-[#543CDA]">View all</Link></div>
          <p className="mt-0.5 text-[0.76rem] text-slate-600">By page views in Analytics, over {activeRange.label.toLowerCase()}.</p>
          {topInsights.length === 0 ? (
            <p className="mt-4 text-[0.82rem] text-slate-600">
              {ga4Top === null
                ? "Google Analytics is not connected, so there is nothing to rank."
                : "No insight was read in this window."}
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {topInsights.map((t, i) => (
                <li key={t.title} className="flex items-center gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-slate-100 text-[0.72rem] font-700 text-slate-600">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-[0.82rem] font-500 text-slate-800">{t.title}</span>
                  <span className="shrink-0 font-mono text-[0.78rem] font-600 text-slate-900">{abbr(t.views)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Content at a Glance */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <div className="flex items-center justify-between"><h2 className="text-[1rem] font-700 text-slate-900">Content at a Glance</h2></div>
          <ul className="mt-3 flex flex-col divide-y divide-slate-100">
            {GLANCE.map(([key, label, color]) => (
              <li key={key} className="flex items-center gap-2.5 py-2 text-[0.83rem]"><span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} /><span className="flex-1 text-slate-600">{label}</span><span className="font-700 text-slate-900">{fmt(glanceMap.get(key) ?? 0)}</span></li>
            ))}
            <li className="flex items-center gap-2.5 py-2 text-[0.83rem]"><span className="h-2.5 w-2.5 rounded-full bg-[#94A3B8]" /><span className="flex-1 text-slate-600">Media Assets</span><span className="font-700 text-slate-900">{fmt(+r.va)}</span></li>
          </ul>
        </section>

        {/* Quick Actions */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle xl:col-span-2">
          <h2 className="text-[1rem] font-700 text-slate-900">Quick Actions</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {quickActions.map((q) => (
              <Link key={q.label} href={q.href} className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-5 text-center hover:border-[#543CDA]/40 hover:bg-[#F4F1FD]">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#EEEBFC] text-[#543CDA]"><q.icon size={19} strokeWidth={2} /></span>
                <span className="text-[0.8rem] font-600 text-slate-700">{q.label}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Workflow Overview */}
      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
        <div className="flex items-center justify-between"><h2 className="text-[1rem] font-700 text-slate-900">Workflow Overview</h2><Link href="/cms/review-queue" className="text-[0.76rem] font-600 text-[#543CDA]">View full workflow</Link></div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {WF_ORDER.map(([key, label, color]) => {
            const c = wfMap.get(key) ?? 0;
            const p = totalContent ? (c / totalContent) * 100 : 0;
            return (
              <div key={key} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <p className="text-[0.76rem] font-600 text-slate-600">{label}</p>
                <p className="mt-1 text-[1.35rem] font-700 text-slate-900">{fmt(c)}</p>
                <p className="text-[0.68rem] text-slate-500">items</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full" style={{ width: `${Math.min(100, p * 4)}%`, background: color }} /></div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
