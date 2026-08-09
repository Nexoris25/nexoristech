/**
 * Executive Dashboard (Image 9). Greeting and date range, a four-KPI row, a revenue-overview area
 * chart beside the pipeline-summary donut, and a row of recent activities, top-performing services,
 * and team performance rings. Built to the design; the switcher in the top bar moves between the
 * Executive, CEO, Personal, and Marketing dashboards.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, FileText, Trophy, UserPlus, Wallet, Contact, ReceiptText, ArrowRight } from "lucide-react";
import { requireStaff } from "../../../lib/auth.js";
import { db } from "../../../lib/db.js";
import { STAGES } from "../../../lib/crm-constants.js";
import { RangeFilter } from "../../../components/cms/RangeFilter.js";
import { resolvePeriod, PERIODS } from "../../../lib/period.js";
import { AreaChart, Donut, ProgressRing, Bar } from "../../../components/charts.js";
import { ChartHover, type HoverPoint } from "../../../components/ChartHover.js";

export const dynamic = "force-dynamic";

const LAGOS = "Africa/Lagos";

function greeting(): string {
  const h = Number(new Intl.DateTimeFormat("en-NG", { timeZone: LAGOS, hour: "numeric", hour12: false }).format(new Date()));
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

/**
 * The overview reads from the database. It previously carried hardcoded figures — a revenue total, a
 * lead count, a pipeline, a dated range — which looked authoritative and reported nothing. An overview
 * that cannot be trusted is worse than one that admits it has no data, so every panel below either shows
 * a real number or says it is empty.
 *
 * Icon chips all use the brand tint. Giving each card its own pastel colour carries no meaning and is
 * the sort of decoration that reads as filler.
 */
const BRAND_TINT = "#EEEBFC";
const BRAND_FG = "#543CDA";

interface Kpi { label: string; value: string; delta: string | null; up: boolean; href: string; icon: typeof Wallet }

const nairaShort = (v: number): string => {
  if (v >= 1_000_000) return `₦${(v / 1_000_000).toFixed(v >= 10_000_000 ? 1 : 2)}M`;
  if (v >= 1_000) return `₦${Math.round(v / 1_000)}K`;
  return `₦${v.toLocaleString("en-NG")}`;
};
/** Month on month, as a percentage. Null when there is no prior month to compare against. */
const delta = (now: number, prev: number): { text: string | null; up: boolean } => {
  if (prev <= 0) return { text: null, up: now > 0 };
  const pct = ((now - prev) / prev) * 100;
  return { text: `${Math.abs(pct).toFixed(1)}%`, up: pct >= 0 };
};

/** Today in Lagos, which is the timezone the business operates in. */
function todayLabel(): string {
  return new Intl.DateTimeFormat("en-NG", { timeZone: LAGOS, day: "numeric", month: "long", year: "numeric" }).format(new Date());
}

interface AuditActivity { action: string; entity: string; after: unknown; actor: string | null; created_at: string }

const ACTIVITY_META: Record<string, { icon: ReactNode; color: string }> = {
  "einvoice-created": { icon: <FileText size={13} strokeWidth={2} />, color: "#543CDA" },
  "einvoice-submit": { icon: <FileText size={13} strokeWidth={2} />, color: "#6A55F2" },
  "einvoice-payment": { icon: <FileText size={13} strokeWidth={2} />, color: "#22C55E" },
  "einvoice-lifecycle": { icon: <FileText size={13} strokeWidth={2} />, color: "#3B82F6" },
  "einvoice-deliver": { icon: <FileText size={13} strokeWidth={2} />, color: "#543CDA" },
  "expense-recorded": { icon: <FileText size={13} strokeWidth={2} />, color: "#F59E0B" },
  "payroll-generate": { icon: <FileText size={13} strokeWidth={2} />, color: "#543CDA" },
  "stage-change": { icon: <Trophy size={13} strokeWidth={2} />, color: "#F59E0B" },
  create: { icon: <UserPlus size={13} strokeWidth={2} />, color: "#3B82F6" },
  "grant-access": { icon: <UserPlus size={13} strokeWidth={2} />, color: "#543CDA" },
};
function describeActivity(a: AuditActivity): string {
  const d = (a.after ?? {}) as Record<string, unknown>;
  switch (a.action) {
    case "einvoice-created": return `Invoice raised for ${String(d.client ?? d.customer ?? "a customer")}`;
    case "einvoice-submit": return `Invoice ${d.nrs_status === "Accepted" ? "accepted by NRS" : "submitted to NRS"}`;
    case "einvoice-payment": return `Payment of ₦${Number(d.amount ?? 0).toLocaleString("en-NG")} recorded`;
    case "einvoice-lifecycle": return `Invoice moved to ${String(d.lifecycle_status ?? "next stage")}`;
    case "einvoice-deliver": return `Invoice ${String(d.channel ?? "delivered")} to the customer`;
    case "expense-recorded": return `Expense recorded: ${String(d.description ?? "")}`;
    case "payroll-generate": return "A pay run was generated";
    case "stage-change": return `Lead moved ${String(d.status ?? "forward")}`;
    case "grant-access": return `Access granted: ${String(d.module ?? "")}`;
    case "create": return "A new user was created";
    default: return a.action.replace(/-/g, " ");
  }
}
function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export default async function ExecutiveDashboard(
  { searchParams }: { searchParams: Promise<{ range?: string }> },
): Promise<ReactNode> {
  const staff = await requireStaff();
  const firstName = staff.name.split(/\s+/)[0] ?? staff.name;
  const pool = db();

  // Every figure below that has a "vs previous" reading is measured over this window and compared
  // against the window of equal length immediately before it. Bounds are half-open, so a row landing
  // exactly on the boundary is counted once.
  const period = resolvePeriod((await searchParams).range, "mtd");
  const win = [period.start, period.end, period.previousStart, period.previousEnd];
  const [{ rows: money }, { rows: leadStats }, { rows: stages }, { rows: services }, { rows: teams }, { rows: activity }, { rows: daily }] = await Promise.all([
    // Revenue is what has actually been collected; outstanding is what is still owed on live documents.
    pool.query<{ collected: string; collected_prev: string; outstanding: string }>(
      // Outstanding is deliberately unbounded: what is owed is owed now, whatever window is selected.
      `SELECT
         coalesce(sum(amount_paid) FILTER (WHERE issue_date >= $1 AND issue_date < $2),0)::text AS collected,
         coalesce(sum(amount_paid) FILTER (WHERE issue_date >= $3 AND issue_date < $4),0)::text AS collected_prev,
         coalesce(sum(total - amount_paid) FILTER (WHERE lifecycle_status <> 'Closed' AND total > amount_paid),0)::text AS outstanding
       FROM einvoice WHERE doc_type = 'Invoice'`, win),
    pool.query<{ new_leads: string; new_leads_prev: string; won: string; won_prev: string }>(
      `SELECT
         count(*) FILTER (WHERE created_at >= $1 AND created_at < $2)::text AS new_leads,
         count(*) FILTER (WHERE created_at >= $3 AND created_at < $4)::text AS new_leads_prev,
         count(*) FILTER (WHERE status = 'Won' AND coalesce(won_at, created_at) >= $1 AND coalesce(won_at, created_at) < $2)::text AS won,
         count(*) FILTER (WHERE status = 'Won' AND coalesce(won_at, created_at) >= $3 AND coalesce(won_at, created_at) < $4)::text AS won_prev
       FROM lead`, win),
    pool.query<{ status: string; n: string }>(
      "SELECT status, count(*)::text AS n FROM lead WHERE status NOT IN ('Won','Lost') GROUP BY status"),
    pool.query<{ service_line: string; revenue: string }>(
      `SELECT coalesce(service_line, 'Unassigned') AS service_line, sum(deal_value)::text AS revenue
         FROM lead WHERE status = 'Won' AND deal_value > 0
        GROUP BY 1 ORDER BY sum(deal_value) DESC LIMIT 5`),
    // Revenue targets only: sales_target also holds a deal-count metric, which is not money and must
    // not be compared against won value.
    pool.query<{ label: string; target: string; achieved: string }>(
      `SELECT coalesce(s.name, 'Unassigned') AS label, t.target::text AS target,
              coalesce((SELECT sum(l.deal_value) FROM lead l WHERE l.assigned_to = t.staff_id AND l.status = 'Won'),0)::text AS achieved
         FROM sales_target t LEFT JOIN staff s ON s.id = t.staff_id
        WHERE t.metric = 'won_value' AND t.target > 0
        ORDER BY t.target DESC LIMIT 5`),
    pool.query<AuditActivity>(
      `SELECT a.action, a.entity, a.after, s.name AS actor, a.created_at::text
         FROM audit_log a LEFT JOIN staff s ON s.id = a.actor_id
        ORDER BY a.created_at DESC LIMIT 6`),
    // Payments received per day this month, as a running cumulative so the curve reads as revenue
    // building through the month rather than as unrelated daily spikes.
    pool.query<{ day: string; amount: string }>(
      `SELECT to_char(payment_date, 'DD Mon') AS day, sum(amount)::text AS amount
         FROM einvoice_payment
        WHERE payment_date >= $1 AND payment_date < $2
        GROUP BY payment_date ORDER BY payment_date`, [period.start, period.end]),
  ]);

  const m = money[0]!;
  const l = leadStats[0]!;
  const revenueDelta = delta(Number(m.collected), Number(m.collected_prev));
  const leadsDelta = delta(Number(l.new_leads), Number(l.new_leads_prev));
  const wonDelta = delta(Number(l.won), Number(l.won_prev));

  const KPIS: Kpi[] = [
    { label: "Revenue Collected", value: nairaShort(Number(m.collected)), delta: revenueDelta.text, up: revenueDelta.up, href: "/finance", icon: Wallet },
    { label: "New Leads", value: l.new_leads, delta: leadsDelta.text, up: leadsDelta.up, href: "/crm", icon: Contact },
    // A trophy, not a target: the target is what you are aiming at, the trophy is what you won.
    { label: "Won Opportunities", value: l.won, delta: wonDelta.text, up: wonDelta.up, href: "/crm/board", icon: Trophy },
    { label: "Outstanding Invoices", value: nairaShort(Number(m.outstanding)), delta: null, up: false, href: "/finance/receivables", icon: ReceiptText },
  ];

  // Open pipeline, in the CRM's own stage order so the donut reads the same way as the board.
  const STAGE_COLORS = ["#543CDA", "#6A55F2", "#9C8CF0", "#F59E0B", "#3B82F6", "#22C55E", "#EF4444"];
  const byStatus = new Map(stages.map((r) => [r.status, Number(r.n)]));
  const PIPELINE = STAGES
    .map((label, i) => ({ label, value: byStatus.get(label) ?? 0, color: STAGE_COLORS[i % STAGE_COLORS.length]! }))
    .filter((p) => p.value > 0);
  const totalOpps = PIPELINE.reduce((s, p) => s + p.value, 0);

  let running = 0;
  const revenueSeries = daily.map((d) => { running += Number(d.amount); return running / 1_000_000; });
  const revenueAxis = daily.length > 1
    ? [daily[0]!.day, daily[daily.length - 1]!.day]
    : daily.length === 1 ? [daily[0]!.day] : [];
  const revenueTop = Math.max(1, ...revenueSeries);
  // The line is cumulative, so a reader needs both the running total and what came in that day; the
  // chart could previously only be read against its gridlines.
  const naira = (m: number): string => (m >= 1 ? `₦${m.toFixed(2)}M` : `₦${Math.round(m * 1000)}K`);
  const revenuePoints: HoverPoint[] = daily.map((d, i) => ({
    label: d.day,
    series: [
      { label: "Received to date", color: "#543CDA", value: naira(revenueSeries[i] ?? 0) },
      { label: "That day", color: "#94A3B8", value: naira(Number(d.amount) / 1_000_000) },
    ],
  }));
  const yTicks = [revenueTop, revenueTop * 0.66, revenueTop * 0.33, 0]
    .map((v) => (v <= 0 ? "₦0" : v >= 1 ? `₦${v.toFixed(1)}M` : `₦${Math.round(v * 1000)}K`));

  const topService = Math.max(1, ...services.map((x) => Number(x.revenue)));
  const SERVICES = services.map((x, i) => ({
    label: x.service_line,
    value: nairaShort(Number(x.revenue)),
    pct: Math.round((Number(x.revenue) / topService) * 100),
    color: STAGE_COLORS[i % STAGE_COLORS.length]!,
  }));

  const TEAMS = teams.map((t, i) => ({
    label: t.label,
    target: nairaShort(Number(t.target)),
    pct: Number(t.target) > 0 ? Math.min(100, Math.round((Number(t.achieved) / Number(t.target)) * 100)) : 0,
    color: STAGE_COLORS[i % STAGE_COLORS.length]!,
  }));

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900 sm:text-[1.6rem]">{greeting()}, {firstName} <span className="align-middle">👋</span></h1>
          <p className="mt-1 text-[0.88rem] text-slate-500">Here&apos;s what&apos;s happening at Nexoris Technologies today.</p>
        </div>
        {/* Selecting a period re-runs every query on this page against that window. */}
        <RangeFilter defaultValue={period.value} options={PERIODS.map((o) => ({ value: o.value, label: o.label }))} />
      </div>

      {/* KPI row */}
      <div className="mt-5 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((k) => (
          <Link key={k.label} href={k.href} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle transition hover:-translate-y-0.5 hover:border-[#543CDA]/30 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: BRAND_TINT, color: BRAND_FG }}><k.icon size={17} /></span>
              <ArrowRight size={15} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#543CDA]" />
            </div>
            <p className="mt-3 text-[0.8rem] font-500 text-slate-500">{k.label}</p>
            <p className="mt-1 font-mono text-[1.5rem] font-700 leading-none text-slate-900">{k.value}</p>
            {/* A movement is only shown when there is a prior period to compare with, and it is coloured
                by direction rather than always green. */}
            {k.delta ? (
              <p className={`mt-2 inline-flex items-center gap-1 text-[0.74rem] font-600 ${k.up ? "text-[#15803D]" : "text-[#B91C1C]"}`}>
                {k.up ? <TrendingUp size={12} strokeWidth={2.4} /> : <TrendingDown size={12} strokeWidth={2.4} />} {k.delta}
                <span className="font-400 text-slate-500">vs previous period</span>
              </p>
            ) : (
              <p className="mt-2 text-[0.74rem] text-slate-500">No prior period to compare</p>
            )}
          </Link>
        ))}
      </div>

      {/* Revenue + Pipeline */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[0.98rem] font-700 text-slate-900">Revenue Overview</h2>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="font-mono text-[1.5rem] font-700 leading-none text-slate-900">{nairaShort(Number(m.collected))}</span>
                {revenueDelta.text ? (
                  <span className={`inline-flex items-center gap-0.5 text-[0.74rem] font-600 ${revenueDelta.up ? "text-[#15803D]" : "text-[#B91C1C]"}`}>
                    {revenueDelta.up ? <TrendingUp size={12} strokeWidth={2.4} /> : <TrendingDown size={12} strokeWidth={2.4} />} {revenueDelta.text}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-[0.72rem] text-slate-500">{period.label} to {todayLabel()}</p>
            </div>
            {/* The second picker that stood here offered its own range and changed nothing. The page
                has one period, chosen above, and this chart follows it. */}
          </div>
          {/* An empty period draws nothing rather than an invented curve. */}
          {revenueSeries.length === 0 ? (
            <p className="mt-4 py-16 text-center text-[0.84rem] text-slate-500">No payments received in this period.</p>
          ) : (
            <div className="mt-4 flex">
              <div className="flex flex-col justify-between py-1 pr-3 font-mono text-[0.66rem] text-slate-500">
                {yTicks.map((y, i) => <span key={`${y}-${i}`}>{y}</span>)}
              </div>
              <div className="min-w-0 flex-1">
                <ChartHover points={revenuePoints} height={200}>
                  <AreaChart values={revenueSeries} height={200} gridlines={4} endDot />
                </ChartHover>
                <div className="mt-1.5 flex justify-between font-mono text-[0.66rem] text-slate-500">
                  {revenueAxis.map((x) => <span key={x}>{x}</span>)}
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.98rem] font-700 text-slate-900">Pipeline Summary</h2>
          <div className="mt-4 flex flex-col items-center gap-4">
            <Donut segments={PIPELINE} centerTop={totalOpps} centerBottom="Total Opportunities" />
            <ul className="flex w-full flex-col gap-2">
              {PIPELINE.map((p) => (
                <li key={p.label} className="flex items-center gap-2 text-[0.8rem]">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
                  <span className="flex-1 text-slate-600">{p.label}</span>
                  <span className="font-mono font-600 text-slate-900">{p.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      {/* Activities + Services + Teams */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.95rem] font-700 text-slate-900">Recent Activities</h2>
          {activity.length === 0 ? (
            <p className="mt-4 text-[0.82rem] text-slate-500">No activity recorded yet.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3.5">
              {activity.map((a, i) => {
                const m = ACTIVITY_META[a.action] ?? { icon: <FileText size={13} strokeWidth={2} />, color: "#543CDA" };
                return (
                  <li key={i} className="flex items-start gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-white" style={{ background: m.color }}>{m.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.82rem] text-slate-800">{describeActivity(a)}</span>
                      <span className="block text-[0.72rem] text-slate-500">{a.actor ?? "System"} · {timeAgo(a.created_at)}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <Link href="/audit" className="mt-4 inline-block text-[0.8rem] font-600 text-[#543CDA] hover:text-[#4330B8]">View all activities</Link>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <div className="flex items-center justify-between">
            <h2 className="text-[0.95rem] font-700 text-slate-900">Top Performing Services</h2>
            <Link href="/finance/reports" className="inline-flex items-center gap-0.5 text-[0.76rem] font-600 text-[#543CDA] hover:text-[#4330B8]">Reports <ArrowRight size={13} /></Link>
          </div>
          <ul className="mt-4 flex flex-col gap-3.5">
            {SERVICES.map((s) => (
              <li key={s.label}>
                <div className="flex items-center justify-between text-[0.8rem]">
                  <span className="min-w-0 truncate pr-2 text-slate-700">{s.label}</span>
                  <span className="font-mono font-600 text-slate-900">{s.value}</span>
                </div>
                <div className="mt-1.5"><Bar pct={s.pct} color={s.color} /></div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <div className="flex items-center justify-between">
            <h2 className="text-[0.95rem] font-700 text-slate-900">Team Performance</h2>
            <Link href="/crm/performance" className="inline-flex items-center gap-0.5 text-[0.76rem] font-600 text-[#543CDA] hover:text-[#4330B8]">Details <ArrowRight size={13} /></Link>
          </div>
          <ul className="mt-4 flex flex-col gap-4">
            {TEAMS.map((t) => (
              <li key={t.label} className="flex items-center gap-3">
                <ProgressRing value={t.pct} size={56} thickness={7} color={t.color}>
                  <span className="font-mono text-[0.72rem] font-700 text-slate-900">{t.pct}%</span>
                </ProgressRing>
                <span>
                  <span className="block text-[0.85rem] font-600 text-slate-900">{t.label}</span>
                  <span className="block text-[0.74rem] text-slate-500">Target: {t.target}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
