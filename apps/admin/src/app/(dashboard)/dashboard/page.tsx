/**
 * The dashboard home: the platform overview that belongs to the shell, not to any one module
 * (PRD 11). It carries the cross-module KPI row, the Action Center (deterministic alerts computed
 * live from the data, most urgent first), the module activity feed, and the module map. CRM
 * figures are live; Finance, HR, and Payroll cards show an honest "goes live soon" state until
 * their modules land, never an invented number. The CRM's own working screens (SLA board,
 * pipeline, sources) live inside /crm.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  ChevronRight,
  Coins,
  Contact,
  Flame,
  Inbox,
  Sparkles,
  Trophy,
  UsersRound,
  Wallet,
} from "lucide-react";
import { requireStaff } from "../../../lib/auth.js";
import { db } from "../../../lib/db.js";
import { businessDayDeadline } from "../../../lib/business-days.js";
import { Sparkline } from "../../../components/Sparkline.js";

export const dynamic = "force-dynamic";

const LAGOS = "Africa/Lagos";

interface AlertLead {
  id: string;
  name: string | null;
  company: string | null;
  band: string | null;
  status: string;
  nurture_date: string | null;
  assigned_name: string | null;
  created_at: string;
}

interface ActivityRow {
  kind: "arrival" | "stage" | "note";
  ref: string | null;
  name: string | null;
  score: number | null;
  band: string | null;
  note: string | null;
  actor: string | null;
  at: string;
}

type Priority = "High" | "Medium" | "Low";

interface ActionItem {
  priority: Priority;
  title: string;
  detail: string;
  href: string;
  assignee: string;
}

const PRIORITY_ORDER: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 };

const PRIORITY_CLASS: Record<Priority, string> = {
  High: "bg-purple-600 text-white",
  Medium: "bg-purple-100 text-purple-700",
  Low: "border border-neutral-200 bg-neutral-50 text-neutral-600",
};

function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-NG", {
      timeZone: LAGOS,
      hour: "numeric",
      hour12: false,
    }).format(new Date()),
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
         FROM generate_series(
                date_trunc('day', now()) - interval '13 days',
                date_trunc('day', now()),
                interval '1 day') AS d
         LEFT JOIN lead ON date_trunc('day', lead.created_at) = d
        GROUP BY d ORDER BY d`,
    ),
    pool.query<AlertLead>(
      `SELECT l.id, l.name, l.company, l.band, l.status, l.nurture_date,
              s.name AS assigned_name, l.created_at
         FROM lead l
         LEFT JOIN staff s ON s.id = l.assigned_to
        WHERE l.status = 'New'
           OR (l.status = 'Nurture' AND l.nurture_date IS NOT NULL AND l.nurture_date <= current_date)
        ORDER BY l.created_at ASC
        LIMIT 40`,
    ),
    pool.query<ActivityRow>(
      `SELECT * FROM (
         SELECT 'arrival'::text AS kind, l.id::text AS ref, l.name, l.score, l.band,
                NULL::text AS note, NULL::text AS actor, l.created_at AS at
           FROM lead l
         UNION ALL
         SELECT 'stage', a.entity_id, NULL, NULL, NULL,
                a.after->>'status', s.name, a.created_at
           FROM audit_log a
           LEFT JOIN staff s ON s.id = a.actor_id
          WHERE a.action = 'stage-change'
       ) events
       ORDER BY at DESC
       LIMIT 8`,
    ),
  ]);

  const k = kpiRes.rows[0]!;
  const monthLeads = Number(k.month_leads);
  const prevMonthLeads = Number(k.prev_month_leads);
  const delta =
    prevMonthLeads > 0
      ? Math.round(((monthLeads - prevMonthLeads) / prevMonthLeads) * 100)
      : null;
  const sparkValues = seriesRes.rows.map((r) => Number(r.count));

  // The Action Center: deterministic alerts computed from the live data (PRD 11.2), most urgent
  // first. Oge's arrival scoring supplies the Hot band that raises a lead's urgency.
  const actions: ActionItem[] = [];
  for (const lead of alertRes.rows) {
    const label = lead.name ?? "Unnamed lead";
    const assignee = lead.assigned_name ?? "Unassigned";
    const href = `/crm/${lead.id}`;
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
    } else {
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
  const topActions = actions.slice(0, 7);

  const today = new Intl.DateTimeFormat("en-NG", {
    timeZone: LAGOS,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);
  const firstName = staff.name.split(/\s+/)[0] ?? staff.name;

  const liveCards: {
    label: string;
    value: string;
    sub: ReactNode;
    spark?: boolean;
  }[] = [
    {
      label: "Leads this month",
      value: String(monthLeads),
      sub:
        delta === null ? (
          <>14-day trend at right</>
        ) : (
          <span className="text-purple-700">
            {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}% vs last month
          </span>
        ),
      spark: true,
    },
    {
      label: "Hot leads open",
      value: k.hot_open,
      sub: <>scored 70+ by Oge on arrival</>,
    },
    {
      label: "Deals won this month",
      value: k.won_month,
      sub: <>Sales Won Value follows with deal values</>,
    },
  ];

  const soonCards: { label: string; module: string }[] = [
    { label: "Open invoices", module: "Finance" },
    { label: "Active employees", module: "HR" },
    { label: "Next pay run", module: "Payroll" },
  ];

  const modules: {
    icon: ReactNode;
    name: string;
    line: string;
    href?: string;
  }[] = [
    {
      icon: <Contact size={16} strokeWidth={2} />,
      name: "CRM",
      line: "Live · leads, pipeline, and the AI assists",
      href: "/crm",
    },
    {
      icon: <Wallet size={16} strokeWidth={2} />,
      name: "Finance",
      line: "Next build · invoicing ready for NRS e-invoicing",
    },
    {
      icon: <UsersRound size={16} strokeWidth={2} />,
      name: "HR",
      line: "Planned · the one place a person is created",
    },
    {
      icon: <Coins size={16} strokeWidth={2} />,
      name: "Payroll",
      line: "Planned · PAYE, pension, and NHF built in",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-roboto text-dash-title font-700 text-ink-950">
            {greeting()}, {firstName}
          </h1>
          <p className="mt-1 text-label text-neutral-600">
            Here is what is happening across Nexoris Technologies today.
          </p>
        </div>
        <span className="rounded-card border border-purple-200 bg-white px-3 py-1.5 text-label text-neutral-600">
          {today}
        </span>
      </div>

      {/* Cross-module KPI row: live CRM figures, honest states for modules not yet live. */}
      <div className="mt-6 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {liveCards.map((card) => (
          <div
            key={card.label}
            className="rounded-card border border-purple-200 bg-white p-4 shadow-subtle"
          >
            <span className="block text-[0.68rem] font-600 uppercase tracking-wide text-neutral-600">
              {card.label}
            </span>
            <span className="mt-2 block font-mono text-[1.35rem] font-700 leading-none text-ink-950">
              {card.value}
            </span>
            <span className="mt-2 flex items-center justify-between gap-2">
              <span className="text-[0.7rem] text-neutral-600">{card.sub}</span>
              {card.spark ? <Sparkline values={sparkValues} /> : null}
            </span>
          </div>
        ))}
        {soonCards.map((card) => (
          <div
            key={card.label}
            className="rounded-card border border-dashed border-neutral-200 bg-white/60 p-4"
          >
            <span className="block text-[0.68rem] font-600 uppercase tracking-wide text-neutral-600/80">
              {card.label}
            </span>
            <span className="mt-2 block font-mono text-[1.35rem] font-700 leading-none text-neutral-600/50">
              –
            </span>
            <span className="mt-2 block text-[0.7rem] text-neutral-600/80">
              {card.module} goes live soon
            </span>
          </div>
        ))}
      </div>

      {/* Action Center + Module activity */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.55fr_1fr]">
        <div className="rounded-card border border-purple-200 bg-white p-4 shadow-subtle sm:p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-dash-section font-700 text-ink-950">
              Action Center
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[0.68rem] font-600 text-purple-700">
                <Sparkles size={11} strokeWidth={2} />
                {actions.length} open
              </span>
            </h2>
            <Link
              href="/crm"
              className="inline-flex cursor-pointer items-center gap-0.5 text-label font-600 text-purple-600 hover:text-purple-700"
            >
              Open CRM <ChevronRight size={14} strokeWidth={2.2} />
            </Link>
          </div>
          {topActions.length === 0 ? (
            <p className="mt-3 text-label text-neutral-600">
              Nothing needs attention right now. New alerts appear here the moment
              an SLA runs short, a hot lead waits, or a nurture date arrives, and
              Finance, HR, and Payroll will feed this same inbox when they go live.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col">
              {topActions.map((item, i) => (
                <li key={`${item.href}-${item.title}`}>
                  <Link
                    href={item.href}
                    className={`flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 px-1 py-2.5 hover:bg-purple-100/40 sm:flex-nowrap ${
                      i > 0 ? "border-t border-purple-200/50" : ""
                    }`}
                  >
                    <span
                      className={`inline-flex w-[72px] shrink-0 justify-center rounded-full px-2 py-0.5 text-[0.68rem] font-700 ${PRIORITY_CLASS[item.priority]}`}
                    >
                      {item.priority}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-dash-data font-600 text-ink-950">
                        {item.title}
                      </span>
                      <span className="block truncate text-[0.72rem] text-neutral-600">
                        {item.detail}
                      </span>
                    </span>
                    <span className="shrink-0 text-[0.72rem] text-neutral-600">
                      {item.assignee}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-card border border-purple-200 bg-white p-4 shadow-subtle sm:p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-dash-section font-700 text-ink-950">
              Module activity
            </h2>
            <span className="text-[0.72rem] text-neutral-600">Latest</span>
          </div>
          {activityRes.rows.length === 0 ? (
            <p className="mt-3 text-label text-neutral-600">
              Activity appears here as leads arrive and move through the pipeline.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-3">
              {activityRes.rows.map((event, i) => (
                <li key={`${event.kind}-${event.ref}-${i}`} className="flex items-start gap-2.5">
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-card ${
                      event.kind === "arrival"
                        ? "bg-purple-100 text-purple-600"
                        : "bg-ink-950 text-purple-100"
                    }`}
                  >
                    {event.kind === "arrival" ? (
                      <Inbox size={13} strokeWidth={2} />
                    ) : event.note === "Won" ? (
                      <Trophy size={13} strokeWidth={2} />
                    ) : (
                      <ArrowUpRight size={13} strokeWidth={2} />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    {event.kind === "arrival" ? (
                      <Link
                        href={`/crm/${event.ref}`}
                        className="block cursor-pointer truncate text-dash-data font-600 text-ink-950 hover:text-purple-700"
                      >
                        New lead: {event.name ?? "Unnamed"}
                      </Link>
                    ) : (
                      <Link
                        href={`/crm/${event.ref}`}
                        className="block cursor-pointer truncate text-dash-data font-600 text-ink-950 hover:text-purple-700"
                      >
                        Lead moved to {event.note}
                      </Link>
                    )}
                    <span className="block truncate text-[0.72rem] text-neutral-600">
                      {event.kind === "arrival"
                        ? `CRM · scored ${event.score ?? "–"} ${event.band ?? ""} by Oge`
                        : `CRM · by ${event.actor ?? "the team"}`}
                    </span>
                  </span>
                  <span className="shrink-0 text-[0.68rem] text-neutral-600">
                    {timeAgo(event.at, now)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Module map */}
      <div className="mt-4 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
        {modules.map((module) =>
          module.href ? (
            <Link
              key={module.name}
              href={module.href}
              className="group flex cursor-pointer items-center gap-3 rounded-card border border-purple-200 bg-white p-4 shadow-subtle transition-colors hover:border-purple-500"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-card bg-purple-600 text-white">
                {module.icon}
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1 text-dash-data font-700 text-ink-950">
                  {module.name}
                  <ChevronRight
                    size={13}
                    strokeWidth={2.4}
                    className="text-purple-600 transition-transform group-hover:translate-x-0.5"
                  />
                </span>
                <span className="block truncate text-[0.72rem] text-neutral-600">
                  {module.line}
                </span>
              </span>
            </Link>
          ) : (
            <div
              key={module.name}
              className="flex items-center gap-3 rounded-card border border-dashed border-neutral-200 bg-white/60 p-4"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-card bg-purple-100 text-purple-600/70">
                {module.icon}
              </span>
              <span className="min-w-0">
                <span className="block text-dash-data font-700 text-neutral-600">
                  {module.name}
                </span>
                <span className="block truncate text-[0.72rem] text-neutral-600/80">
                  {module.line}
                </span>
              </span>
            </div>
          ),
        )}
      </div>

      {staff.role !== "salesperson" ? (
        <p className="mt-4 flex items-start gap-2 rounded-card border border-purple-200 bg-purple-100/50 px-4 py-3 text-[0.78rem] leading-relaxed text-neutral-600">
          <AlertTriangle size={14} strokeWidth={2} className="mt-0.5 shrink-0 text-purple-600" />
          <span>
            <span className="font-600 text-ink-950">One inbox, every module.</span>{" "}
            The Action Center above already watches the CRM. As Finance, HR, and
            Payroll go live, overdue invoices, leave approvals, pay-run reviews,
            and statutory deadlines land in this same list, alongside{" "}
            <Flame size={11} strokeWidth={2} className="inline text-purple-600" /> AI
            checks like payroll anomaly flags and overdue-invoice escalation drafts.
          </span>
        </p>
      ) : null}
    </div>
  );
}
