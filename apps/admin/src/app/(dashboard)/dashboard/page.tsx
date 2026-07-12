/**
 * The dashboard home: the platform overview owned by the shell (PRD 11). A cross-module KPI row
 * (live CRM figures plus honest "soon" cards for Finance, HR, Payroll), the Action Center of
 * deterministic, priority-coloured alerts computed live from the data, a module activity feed, and
 * the module map. CRM's own working screens live under /crm. Nothing is invented; unbuilt modules
 * show a reserved state, never a fake number.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
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
  UserRoundPlus,
  UsersRound,
  Wallet,
} from "lucide-react";
import { requireStaff } from "../../../lib/auth.js";
import { db } from "../../../lib/db.js";
import { businessDayDeadline } from "../../../lib/business-days.js";
import { Sparkline } from "../../../components/Sparkline.js";
import { PRIORITY_STYLE, rating, type Priority } from "../../../lib/lead-ui.js";

export const dynamic = "force-dynamic";

const LAGOS = "Africa/Lagos";

interface AlertLead {
  id: string;
  name: string | null;
  company: string | null;
  band: string | null;
  status: string;
  nurture_date: string | null;
  followup_stage: string | null;
  followup_due: string | null;
  assigned_name: string | null;
  created_at: string;
}

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

interface ActionItem {
  priority: Priority;
  title: string;
  detail: string;
  href: string;
  assignee: string;
}

const PRIORITY_ORDER: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 };

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

function hoursLabel(ms: number): string {
  return `${Math.abs(Math.round(ms / 3_600_000))}h`;
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

  const [kpiRes, seriesRes, alertRes, activityRes] = await Promise.all([
    pool.query<{
      month_leads: string;
      prev_month_leads: string;
      hot_open: string;
      won_month: string;
    }>(
      `SELECT
         count(*) FILTER (WHERE created_at >= date_trunc('month', now()))                 AS month_leads,
         count(*) FILTER (WHERE created_at >= date_trunc('month', now()) - interval '1 month'
                            AND created_at <  date_trunc('month', now()))                AS prev_month_leads,
         count(*) FILTER (WHERE band = 'Hot' AND status NOT IN ('Won', 'Lost'))          AS hot_open,
         count(*) FILTER (WHERE status = 'Won'
                            AND created_at >= date_trunc('month', now()))                AS won_month
       FROM lead`,
    ),
    pool.query<{ count: string }>(
      `SELECT count(lead.id) AS count
         FROM generate_series(date_trunc('day', now()) - interval '13 days',
                              date_trunc('day', now()), interval '1 day') AS d
         LEFT JOIN lead ON date_trunc('day', lead.created_at) = d
        GROUP BY d ORDER BY d`,
    ),
    pool.query<AlertLead>(
      `SELECT l.id, l.name, l.company, l.band, l.status, l.nurture_date,
              l.followup_stage, l.followup_due::text, s.name AS assigned_name, l.created_at
         FROM lead l
         LEFT JOIN staff s ON s.id = l.assigned_to
        WHERE l.status = 'New'
           OR (l.status = 'Nurture' AND l.nurture_date IS NOT NULL AND l.nurture_date <= current_date)
           OR (l.followup_due IS NOT NULL AND l.followup_due <= current_date AND l.followup_sent_at IS NULL)
        ORDER BY l.created_at ASC LIMIT 40`,
    ),
    pool.query<ActivityRow>(
      `SELECT * FROM (
         SELECT 'arrival'::text AS kind, l.id::text AS ref, l.name, l.score, l.band,
                NULL::text AS note, NULL::text AS actor, l.created_at AS at
           FROM lead l
         UNION ALL
         SELECT 'stage', a.entity_id, NULL, NULL, NULL, a.after->>'status', s.name, a.created_at
           FROM audit_log a LEFT JOIN staff s ON s.id = a.actor_id
          WHERE a.action = 'stage-change'
       ) events ORDER BY at DESC LIMIT 7`,
    ),
  ]);

  const k = kpiRes.rows[0]!;
  const monthLeads = Number(k.month_leads);
  const prevMonthLeads = Number(k.prev_month_leads);
  const delta =
    prevMonthLeads > 0 ? Math.round(((monthLeads - prevMonthLeads) / prevMonthLeads) * 100) : null;
  const sparkValues = seriesRes.rows.map((r) => Number(r.count));

  const actions: ActionItem[] = [];
  for (const lead of alertRes.rows) {
    const label = lead.name ?? "Unnamed lead";
    const assignee = lead.assigned_name ?? "Unassigned";
    const href = `/crm/${lead.id}`;
    if (
      lead.followup_due !== null &&
      new Date(lead.followup_due) <= now &&
      lead.status !== "New"
    ) {
      actions.push({
        priority: lead.band === "Hot" ? "High" : "Medium",
        title: `Follow-up due: ${label}`,
        detail: `CRM · ${lead.followup_stage ?? "stage"} follow-up ready, no reply logged`,
        href,
        assignee,
      });
    }
    if (lead.status === "New") {
      const due = businessDayDeadline(new Date(lead.created_at), 1);
      if (now > due) {
        actions.push({
          priority: "High",
          title: `First-response SLA breached: ${label}`,
          detail: `CRM · breached by ${hoursLabel(now.getTime() - due.getTime())}`,
          href,
          assignee,
        });
      } else if (due.getTime() - now.getTime() <= 24 * 3_600_000) {
        actions.push({
          priority: lead.band === "Hot" ? "High" : "Medium",
          title: `First response due: ${label}`,
          detail: `CRM · due in ${hoursLabel(due.getTime() - now.getTime())}${
            lead.band === "Hot" ? " · scored Hot by Oge" : ""
          }`,
          href,
          assignee,
        });
      } else if (lead.band === "Hot") {
        actions.push({
          priority: "Medium",
          title: `Hot lead awaiting first response: ${label}`,
          detail: "CRM · scored Hot by Oge on arrival",
          href,
          assignee,
        });
      }
      if (!lead.assigned_name) {
        actions.push({
          priority: "Medium",
          title: `Unassigned lead: ${label}`,
          detail: `CRM · ${lead.company ?? "no company given"}`,
          href,
          assignee: "Admin",
        });
      }
    } else if (lead.status === "Nurture") {
      actions.push({
        priority: "Low",
        title: `Nurture revival due: ${label}`,
        detail: "CRM · the revival date has arrived",
        href,
        assignee,
      });
    }
  }
  actions.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
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
    {
      label: "Hot leads open",
      value: k.hot_open,
      sub: <>scored 70+ by Oge</>,
      icon: <Flame size={16} strokeWidth={2} />,
      tint: "bg-[#FDECEA] text-[#C0362C]",
    },
    {
      label: "Deals won this month",
      value: k.won_month,
      sub: <>Sales Won Value joins with deals</>,
      icon: <Trophy size={16} strokeWidth={2} />,
      tint: "bg-[#E4F5EE] text-[#0E7A5B]",
    },
  ];

  const soonCards = [
    { label: "Open invoices", module: "Finance", icon: <Wallet size={16} strokeWidth={2} /> },
    { label: "Active employees", module: "HR", icon: <UsersRound size={16} strokeWidth={2} /> },
    { label: "Next pay run", module: "Payroll", icon: <Coins size={16} strokeWidth={2} /> },
  ];

  const modules = [
    { icon: <Contact size={18} strokeWidth={2} />, name: "CRM", line: "Leads, pipeline, and the AI assists", href: "/crm", live: true },
    { icon: <Wallet size={18} strokeWidth={2} />, name: "Finance", line: "Invoicing, ready for NRS e-invoicing", href: undefined, live: false },
    { icon: <UsersRound size={18} strokeWidth={2} />, name: "HR", line: "The one place a person is created", href: undefined, live: false },
    { icon: <Coins size={18} strokeWidth={2} />, name: "Payroll", line: "PAYE, pension, and NHF built in", href: undefined, live: false },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      {/* Greeting */}
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

      {/* KPI row */}
      <div className="mt-6 grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 xl:grid-cols-3">
        {liveCards.map((card) => (
          <div
            key={card.label}
            className="rounded-card border border-purple-200 bg-white p-5 shadow-subtle transition-shadow hover:shadow-medium"
          >
            <div className="flex items-center justify-between">
              <span className={`grid h-9 w-9 place-items-center rounded-card ${card.tint}`}>
                {card.icon}
              </span>
              {card.spark ? <Sparkline values={sparkValues} /> : null}
            </div>
            <p className="mt-3 font-mono text-[1.85rem] font-700 leading-none text-ink-950">
              {card.value}
            </p>
            <p className="mt-1.5 text-[0.85rem] font-500 text-ink-950">{card.label}</p>
            <p className="mt-0.5 text-[0.78rem] text-neutral-600">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-4 min-[520px]:grid-cols-3">
        {soonCards.map((card) => (
          <div
            key={card.label}
            className="flex items-center gap-3 rounded-card border border-dashed border-neutral-200 bg-white/60 px-4 py-3"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-card bg-neutral-100 text-neutral-600/70">
              {card.icon}
            </span>
            <span className="min-w-0">
              <span className="block text-[0.85rem] font-500 text-ink-950">{card.label}</span>
              <span className="block text-[0.75rem] text-neutral-600/80">
                {card.module} goes live soon
              </span>
            </span>
          </div>
        ))}
      </div>

      {/* Action Center + activity */}
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
            <Link
              href="/crm"
              className="inline-flex cursor-pointer items-center gap-0.5 text-[0.82rem] font-600 text-purple-600 hover:text-purple-700"
            >
              Open CRM <ChevronRight size={15} strokeWidth={2.2} />
            </Link>
          </div>
          {topActions.length === 0 ? (
            <p className="px-5 py-6 text-[0.9rem] leading-relaxed text-neutral-600">
              Nothing needs attention right now. Alerts appear here the moment an SLA runs short, a
              hot lead waits, or a follow-up falls due, and Finance, HR, and Payroll will feed this
              same inbox when they go live.
            </p>
          ) : (
            <ul className="flex flex-col">
              {topActions.map((item, i) => {
                const p = PRIORITY_STYLE[item.priority];
                return (
                  <li key={`${item.href}-${item.title}`}>
                    <Link
                      href={item.href}
                      className={`group flex items-center gap-3 px-5 py-3 hover:bg-neutral-50 ${
                        i > 0 ? "border-t border-purple-200/50" : ""
                      }`}
                    >
                      <span
                        className={`inline-flex w-[70px] shrink-0 justify-center rounded-full px-2 py-1 text-[0.7rem] font-700 ${p.chip}`}
                      >
                        {item.priority}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.9rem] font-600 text-ink-950">
                          {item.title}
                        </span>
                        <span className="block truncate text-[0.78rem] text-neutral-600">
                          {item.detail}
                        </span>
                      </span>
                      <span className="hidden shrink-0 text-[0.78rem] text-neutral-600 sm:block">
                        {item.assignee}
                      </span>
                      <ArrowRight
                        size={15}
                        strokeWidth={2}
                        className="shrink-0 text-neutral-300 transition-colors group-hover:text-purple-600"
                      />
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
            <p className="px-5 py-6 text-[0.9rem] text-neutral-600">
              Activity appears here as leads arrive and move through the pipeline.
            </p>
          ) : (
            <ul className="flex flex-col gap-4 px-5 py-4">
              {activityRes.rows.map((event, i) => {
                const r = rating(event.band);
                return (
                  <li key={`${event.kind}-${event.ref}-${i}`} className="flex items-start gap-3">
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-card ${
                        event.kind === "arrival"
                          ? "bg-purple-100 text-purple-600"
                          : event.note === "Won"
                            ? "bg-[#E4F5EE] text-[#0E7A5B]"
                            : "bg-ink-950 text-purple-100"
                      }`}
                    >
                      {event.kind === "arrival" ? (
                        <Inbox size={14} strokeWidth={2} />
                      ) : event.note === "Won" ? (
                        <Trophy size={14} strokeWidth={2} />
                      ) : (
                        <ArrowUpRight size={14} strokeWidth={2} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <Link
                        href={`/crm/${event.ref}`}
                        className="block cursor-pointer truncate text-[0.88rem] font-600 text-ink-950 hover:text-purple-700"
                      >
                        {event.kind === "arrival"
                          ? `New lead: ${event.name ?? "Unnamed"}`
                          : `Moved to ${event.note}`}
                      </Link>
                      <span className="mt-0.5 flex items-center gap-1.5 text-[0.76rem] text-neutral-600">
                        {event.kind === "arrival" ? (
                          <>
                            <span
                              className="inline-block h-1.5 w-1.5 rounded-full"
                              style={{ background: r.dot }}
                            />
                            Scored {event.score ?? "–"} {event.band ?? ""}
                          </>
                        ) : (
                          <>by {event.actor ?? "the team"}</>
                        )}
                      </span>
                    </span>
                    <span className="shrink-0 text-[0.72rem] text-neutral-600">
                      {timeAgo(event.at, now)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Module map */}
      <div className="mt-4 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
        {modules.map((module) =>
          module.href ? (
            <Link
              key={module.name}
              href={module.href}
              className="group flex items-center gap-3 rounded-card border border-purple-200 bg-white p-4 shadow-subtle transition-all hover:-translate-y-0.5 hover:border-purple-500 hover:shadow-medium"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-card bg-purple-600 text-white">
                {module.icon}
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1 text-[0.92rem] font-700 text-ink-950">
                  {module.name}
                  <span className="rounded-full bg-[#E4F5EE] px-1.5 py-px text-[0.6rem] font-600 uppercase tracking-wide text-[#0E7A5B]">
                    Live
                  </span>
                </span>
                <span className="block truncate text-[0.76rem] text-neutral-600">{module.line}</span>
              </span>
              <ChevronRight
                size={16}
                strokeWidth={2.2}
                className="ml-auto shrink-0 text-purple-600 transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          ) : (
            <div
              key={module.name}
              className="flex items-center gap-3 rounded-card border border-dashed border-neutral-200 bg-white/60 p-4"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-card bg-neutral-100 text-neutral-600/70">
                {module.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-[0.92rem] font-700 text-neutral-600">{module.name}</span>
                <span className="block truncate text-[0.76rem] text-neutral-600/80">
                  {module.line}
                </span>
              </span>
              <span className="ml-auto shrink-0 rounded-full border border-neutral-200 px-2 py-0.5 text-[0.6rem] font-600 uppercase tracking-wide text-neutral-600/70">
                Soon
              </span>
            </div>
          ),
        )}
      </div>

      {staff.role !== "salesperson" ? (
        <p className="mt-4 flex items-start gap-2.5 rounded-card border border-purple-200 bg-purple-100/40 px-4 py-3.5 text-[0.84rem] leading-relaxed text-neutral-600">
          <AlertTriangle size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-purple-600" />
          <span>
            <span className="font-600 text-ink-950">One inbox, every module.</span> The Action Center
            already watches the CRM. As Finance, HR, and Payroll go live, overdue invoices, leave
            approvals, pay-run reviews, and statutory deadlines land in this same list, alongside AI
            checks such as payroll anomaly flags and overdue-invoice escalation drafts.{" "}
            <UserRoundPlus size={12} strokeWidth={2} className="inline text-purple-600" />
          </span>
        </p>
      ) : null}
    </div>
  );
}
