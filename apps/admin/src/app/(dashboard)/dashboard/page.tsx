/**
 * The dashboard home: the platform overview owned by the shell (PRD 11). A cross-module KPI row
 * (live CRM figures plus honest "soon" cards for Finance, HR, Payroll), the top of the Action
 * Center (shared with /action-center so they never disagree), a module activity feed, and the
 * module map. CRM's own working screens live under /crm. Nothing is invented.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Coins,
  Contact,
  Flame,
  Inbox,
  Sparkles,
  TrendingUp,
  Trophy,
  UsersRound,
  Wallet,
} from "lucide-react";
import { requireStaff } from "../../../lib/auth.js";
import { db } from "../../../lib/db.js";
import { Sparkline } from "../../../components/Sparkline.js";
import { buildActionCenter } from "../../../lib/action-center.js";
import { PRIORITY_STYLE, rating } from "../../../lib/lead-ui.js";

export const dynamic = "force-dynamic";

const LAGOS = "Africa/Lagos";

interface ActivityRow {
  kind: "arrival" | "stage";
  ref: string | null;
  name: string | null;
  score: number | null;
  band: string | null;
  note: string | null;
  actor: string | null;
  at: string;
}

function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-NG", { timeZone: LAGOS, hour: "numeric", hour12: false }).format(
      new Date(),
    ),
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function timeAgo(at: string, now: Date): string {
  const mins = Math.max(0, Math.round((now.getTime() - new Date(at).getTime()) / 60_000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default async function DashboardPage(): Promise<ReactNode> {
  const staff = await requireStaff();
  const pool = db();
  const now = new Date();
  const scope = staff.role === "salesperson" ? staff.id : undefined;

  const [kpiRes, seriesRes, actions, activityRes] = await Promise.all([
    pool.query<{ month_leads: string; prev_month_leads: string; hot_open: string; won_month: string }>(
      `SELECT
         count(*) FILTER (WHERE created_at >= date_trunc('month', now()))                 AS month_leads,
         count(*) FILTER (WHERE created_at >= date_trunc('month', now()) - interval '1 month'
                            AND created_at <  date_trunc('month', now()))                AS prev_month_leads,
         count(*) FILTER (WHERE band = 'Hot' AND status NOT IN ('Won', 'Lost'))          AS hot_open,
         count(*) FILTER (WHERE status = 'Won' AND created_at >= date_trunc('month', now())) AS won_month
       FROM lead`,
    ),
    pool.query<{ count: string }>(
      `SELECT count(lead.id) AS count
         FROM generate_series(date_trunc('day', now()) - interval '13 days',
                              date_trunc('day', now()), interval '1 day') AS d
         LEFT JOIN lead ON date_trunc('day', lead.created_at) = d
        GROUP BY d ORDER BY d`,
    ),
    buildActionCenter(pool, now, scope),
    pool.query<ActivityRow>(
      `SELECT * FROM (
         SELECT 'arrival'::text AS kind, l.id::text AS ref, l.name, l.score, l.band,
                NULL::text AS note, NULL::text AS actor, l.created_at AS at FROM lead l
         UNION ALL
         SELECT 'stage', a.entity_id, NULL, NULL, NULL, a.after->>'status', s.name, a.created_at
           FROM audit_log a LEFT JOIN staff s ON s.id = a.actor_id WHERE a.action = 'stage-change'
       ) events ORDER BY at DESC LIMIT 7`,
    ),
  ]);

  const k = kpiRes.rows[0]!;
  const monthLeads = Number(k.month_leads);
  const prevMonthLeads = Number(k.prev_month_leads);
  const delta =
    prevMonthLeads > 0 ? Math.round(((monthLeads - prevMonthLeads) / prevMonthLeads) * 100) : null;
  const sparkValues = seriesRes.rows.map((r) => Number(r.count));
  const topActions = actions.slice(0, 6);

  const today = new Intl.DateTimeFormat("en-NG", {
    timeZone: LAGOS,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);
  const firstName = staff.name.split(/\s+/)[0] ?? staff.name;

  const liveCards = [
    {
      label: "Leads this month",
      value: String(monthLeads),
      sub:
        delta === null ? (
          <>14-day trend</>
        ) : (
          <span className="inline-flex items-center gap-0.5 text-[#0E7A5B]">
            <TrendingUp size={12} strokeWidth={2.4} /> {delta >= 0 ? "+" : ""}
            {delta}% vs last month
          </span>
        ),
      icon: <Inbox size={16} strokeWidth={2} />,
      tint: "bg-purple-100 text-purple-600",
      spark: true,
    },
    { label: "Hot leads open", value: k.hot_open, sub: <>scored 70+ by Oge</>, icon: <Flame size={16} strokeWidth={2} />, tint: "bg-[#FDECEA] text-[#C0362C]" },
    { label: "Deals won this month", value: k.won_month, sub: <>Sales Won Value joins with deals</>, icon: <Trophy size={16} strokeWidth={2} />, tint: "bg-[#E4F5EE] text-[#0E7A5B]" },
  ];
  const soonCards = [
    { label: "Open invoices", module: "Finance", icon: <Wallet size={16} strokeWidth={2} /> },
    { label: "Active employees", module: "HR", icon: <UsersRound size={16} strokeWidth={2} /> },
    { label: "Next pay run", module: "Payroll", icon: <Coins size={16} strokeWidth={2} /> },
  ];
  const modules = [
    { icon: <Contact size={18} strokeWidth={2} />, name: "CRM", line: "Leads, pipeline, and the AI assists", href: "/crm" },
    { icon: <Wallet size={18} strokeWidth={2} />, name: "Finance", line: "Invoicing, ready for NRS e-invoicing", href: undefined },
    { icon: <UsersRound size={18} strokeWidth={2} />, name: "HR", line: "The one place a person is created", href: undefined },
    { icon: <Coins size={18} strokeWidth={2} />, name: "Payroll", line: "PAYE, pension, and NHF built in", href: undefined },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-roboto text-[1.7rem] font-700 leading-tight text-ink-950">
            {greeting()}, {firstName}
          </h1>
          <p className="mt-1 text-[0.95rem] text-neutral-600">
            Here is what is happening across Nexoris Technologies today.
          </p>
        </div>
        <span className="rounded-card border border-purple-200 bg-white px-3.5 py-2 text-[0.85rem] font-500 text-neutral-600 shadow-subtle">
          {today}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 xl:grid-cols-3">
        {liveCards.map((card) => (
          <div key={card.label} className="rounded-card border border-purple-200 bg-white p-5 shadow-subtle transition-shadow hover:shadow-medium">
            <div className="flex items-center justify-between">
              <span className={`grid h-9 w-9 place-items-center rounded-card ${card.tint}`}>{card.icon}</span>
              {card.spark ? <Sparkline values={sparkValues} /> : null}
            </div>
            <p className="mt-3 font-mono text-[1.85rem] font-700 leading-none text-ink-950">{card.value}</p>
            <p className="mt-1.5 text-[0.85rem] font-500 text-ink-950">{card.label}</p>
            <p className="mt-0.5 text-[0.78rem] text-neutral-600">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-4 min-[520px]:grid-cols-3">
        {soonCards.map((card) => (
          <div key={card.label} className="flex items-center gap-3 rounded-card border border-dashed border-neutral-200 bg-white/60 px-4 py-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-card bg-neutral-100 text-neutral-600/70">{card.icon}</span>
            <span className="min-w-0">
              <span className="block text-[0.85rem] font-500 text-ink-950">{card.label}</span>
              <span className="block text-[0.75rem] text-neutral-600/80">{card.module} goes live soon</span>
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-card border border-purple-200 bg-white shadow-subtle">
          <div className="flex items-center justify-between border-b border-purple-200/70 px-5 py-3.5">
            <h2 className="flex items-center gap-2 text-[1.05rem] font-700 text-ink-950">
              <span className="grid h-7 w-7 place-items-center rounded-card bg-purple-600 text-white">
                <Sparkles size={15} strokeWidth={2} />
              </span>
              Action Center
              {actions.length > 0 ? (
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[0.72rem] font-600 text-purple-700">
                  {actions.length}
                </span>
              ) : null}
            </h2>
            <Link href="/action-center" className="inline-flex cursor-pointer items-center gap-0.5 text-[0.82rem] font-600 text-purple-600 hover:text-purple-700">
              View all <ChevronRight size={15} strokeWidth={2.2} />
            </Link>
          </div>
          {topActions.length === 0 ? (
            <p className="px-5 py-6 text-[0.9rem] leading-relaxed text-neutral-600">
              Nothing needs attention right now. Alerts appear here the moment an SLA runs short, a
              hot lead waits, or a follow-up falls due.
            </p>
          ) : (
            <ul className="flex flex-col">
              {topActions.map((item, i) => {
                const p = PRIORITY_STYLE[item.priority];
                return (
                  <li key={item.id}>
                    <Link href={item.href} className={`group flex items-center gap-3 px-5 py-3 hover:bg-neutral-50 ${i > 0 ? "border-t border-purple-200/50" : ""}`}>
                      <span className={`inline-flex w-[70px] shrink-0 justify-center rounded-full px-2 py-1 text-[0.7rem] font-700 ${p.chip}`}>
                        {item.priority}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.9rem] font-600 text-ink-950">{item.title}</span>
                        <span className="block truncate text-[0.78rem] text-neutral-600">{item.module} · {item.detail}</span>
                      </span>
                      <span className="hidden shrink-0 text-[0.78rem] text-neutral-600 sm:block">{item.assignee}</span>
                      <ArrowRight size={15} strokeWidth={2} className="shrink-0 text-neutral-300 transition-colors group-hover:text-purple-600" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-card border border-purple-200 bg-white shadow-subtle">
          <div className="flex items-center justify-between border-b border-purple-200/70 px-5 py-3.5">
            <h2 className="text-[1.05rem] font-700 text-ink-950">Activity</h2>
            <span className="text-[0.78rem] text-neutral-600">Latest</span>
          </div>
          {activityRes.rows.length === 0 ? (
            <p className="px-5 py-6 text-[0.9rem] text-neutral-600">Activity appears here as leads arrive and move.</p>
          ) : (
            <ul className="flex flex-col gap-4 px-5 py-4">
              {activityRes.rows.map((event, i) => {
                const r = rating(event.band);
                return (
                  <li key={`${event.kind}-${event.ref}-${i}`} className="flex items-start gap-3">
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-card ${event.kind === "arrival" ? "bg-purple-100 text-purple-600" : event.note === "Won" ? "bg-[#E4F5EE] text-[#0E7A5B]" : "bg-ink-950 text-purple-100"}`}>
                      {event.kind === "arrival" ? <Inbox size={14} strokeWidth={2} /> : event.note === "Won" ? <Trophy size={14} strokeWidth={2} /> : <ArrowUpRight size={14} strokeWidth={2} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <Link href={`/crm/${event.ref}`} className="block cursor-pointer truncate text-[0.88rem] font-600 text-ink-950 hover:text-purple-700">
                        {event.kind === "arrival" ? `New lead: ${event.name ?? "Unnamed"}` : `Moved to ${event.note}`}
                      </Link>
                      <span className="mt-0.5 flex items-center gap-1.5 text-[0.76rem] text-neutral-600">
                        {event.kind === "arrival" ? (
                          <>
                            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: r.dot }} />
                            Scored {event.score ?? "–"} {event.band ?? ""}
                          </>
                        ) : (
                          <>by {event.actor ?? "the team"}</>
                        )}
                      </span>
                    </span>
                    <span className="shrink-0 text-[0.72rem] text-neutral-600">{timeAgo(event.at, now)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
        {modules.map((module) =>
          module.href ? (
            <Link key={module.name} href={module.href} className="group flex items-center gap-3 rounded-card border border-purple-200 bg-white p-4 shadow-subtle transition-all hover:-translate-y-0.5 hover:border-purple-500 hover:shadow-medium">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-card bg-purple-600 text-white">{module.icon}</span>
              <span className="min-w-0">
                <span className="flex items-center gap-1 text-[0.92rem] font-700 text-ink-950">
                  {module.name}
                  <span className="rounded-full bg-[#E4F5EE] px-1.5 py-px text-[0.6rem] font-600 uppercase tracking-wide text-[#0E7A5B]">Live</span>
                </span>
                <span className="block truncate text-[0.76rem] text-neutral-600">{module.line}</span>
              </span>
              <ChevronRight size={16} strokeWidth={2.2} className="ml-auto shrink-0 text-purple-600 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : (
            <div key={module.name} className="flex items-center gap-3 rounded-card border border-dashed border-neutral-200 bg-white/60 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-card bg-neutral-100 text-neutral-600/70">{module.icon}</span>
              <span className="min-w-0">
                <span className="block text-[0.92rem] font-700 text-neutral-600">{module.name}</span>
                <span className="block truncate text-[0.76rem] text-neutral-600/80">{module.line}</span>
              </span>
              <span className="ml-auto shrink-0 rounded-full border border-neutral-200 px-2 py-0.5 text-[0.6rem] font-600 uppercase tracking-wide text-neutral-600/70">Soon</span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
