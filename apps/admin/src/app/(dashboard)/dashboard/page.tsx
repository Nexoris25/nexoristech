/**
 * The dashboard home (PRD 2.6), at the standard of the approved dashboard design (the homepage
 * product mockup at full scale). Every figure is live from the database: the KPI row with a real
 * 14-day sparkline, the first-response SLA board (business-day deadlines, most urgent first),
 * pipeline by stage, source performance, and the latest leads. Admins and viewers see the whole
 * team; a salesperson sees their own leads. Finance figures join this screen when the Finance
 * module lands; nothing here is invented.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  ChevronRight,
  Flame,
  Inbox,
  Trophy,
} from "lucide-react";
import { requireStaff } from "../../../lib/auth.js";
import { db } from "../../../lib/db.js";
import { businessDayDeadline } from "../../../lib/business-days.js";
import { STAGES } from "../../../lib/crm-constants.js";
import { Sparkline } from "../../../components/Sparkline.js";

export const dynamic = "force-dynamic";

const LAGOS = "Africa/Lagos";

interface SlaRow {
  id: string;
  name: string | null;
  company: string | null;
  band: string | null;
  created_at: string;
}
interface StageCount {
  status: string;
  c: number;
}
interface SourceRow {
  source: string;
  total: number;
  won: number;
}
interface RecentLead {
  id: string;
  name: string | null;
  company: string | null;
  source: string;
  score: number | null;
  band: string | null;
  status: string;
}

const BAND_CLASS: Record<string, string> = {
  Hot: "bg-purple-600 text-white",
  Warm: "bg-purple-100 text-purple-700",
  Cold: "border border-neutral-200 bg-neutral-50 text-neutral-600",
};

const SOURCE_LABEL: Record<string, string> = {
  "contact-form": "Contact form",
  "oge-chat": "Oge chat",
  "solution-finder": "Solution Finder",
  whatsapp: "WhatsApp",
  email: "Email",
  referral: "Referral",
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

export default async function DashboardPage(): Promise<ReactNode> {
  const staff = await requireStaff();
  const mine = staff.role === "salesperson";
  const where = mine ? "WHERE assigned_to = $1" : "";
  const and = mine ? "AND assigned_to = $1" : "";
  const params = mine ? [staff.id] : [];
  const pool = db();

  const [kpiRes, seriesRes, slaRes, stageRes, sourceRes, recentRes] =
    await Promise.all([
      pool.query<{ month_leads: string; prev_month_leads: string; hot_open: string }>(
        `SELECT
           count(*) FILTER (WHERE created_at >= date_trunc('month', now()))                 AS month_leads,
           count(*) FILTER (WHERE created_at >= date_trunc('month', now()) - interval '1 month'
                              AND created_at <  date_trunc('month', now()))                AS prev_month_leads,
           count(*) FILTER (WHERE band = 'Hot' AND status NOT IN ('Won', 'Lost'))          AS hot_open
         FROM lead ${where}`,
        params,
      ),
      pool.query<{ count: string }>(
        `SELECT count(lead.id) AS count
           FROM generate_series(
                  date_trunc('day', now()) - interval '13 days',
                  date_trunc('day', now()),
                  interval '1 day') AS d
           LEFT JOIN lead
             ON date_trunc('day', lead.created_at) = d ${and}
          GROUP BY d ORDER BY d`,
        params,
      ),
      pool.query<SlaRow>(
        `SELECT id, name, company, band, created_at FROM lead
          WHERE status = 'New' ${and}
          ORDER BY created_at ASC LIMIT 8`,
        params,
      ),
      pool.query<StageCount>(
        `SELECT status, count(*)::int AS c FROM lead ${where} GROUP BY status`,
        params,
      ),
      pool.query<SourceRow>(
        `SELECT source, count(*)::int AS total,
                count(*) FILTER (WHERE status = 'Won')::int AS won
           FROM lead ${where} GROUP BY source ORDER BY total DESC`,
        params,
      ),
      pool.query<RecentLead>(
        `SELECT id, name, company, source, score, band, status
           FROM lead ${where} ORDER BY created_at DESC LIMIT 6`,
        params,
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

  const stageMap = new Map(stageRes.rows.map((r) => [r.status, r.c]));
  const won = stageMap.get("Won") ?? 0;
  const lost = stageMap.get("Lost") ?? 0;
  const winRate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : null;
  const openPipeline = [...stageMap.entries()]
    .filter(([s]) => s !== "Won" && s !== "Lost")
    .reduce((sum, [, c]) => sum + c, 0);
  const maxStage = Math.max(1, ...stageMap.values());
  const totalLeads = sourceRes.rows.reduce((sum, r) => sum + r.total, 0);
  const now = new Date();
  const breaches = slaRes.rows.filter(
    (r) => now > businessDayDeadline(new Date(r.created_at), 1),
  ).length;

  const today = new Intl.DateTimeFormat("en-NG", {
    timeZone: LAGOS,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);
  const firstName = staff.name.split(/\s+/)[0] ?? staff.name;

  const cards: {
    label: string;
    value: string;
    sub: ReactNode;
    icon: ReactNode;
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
      icon: <Inbox size={15} strokeWidth={2} />,
      spark: true,
    },
    {
      label: "Hot leads open",
      value: k.hot_open,
      sub: <>scored 70+ by Oge on arrival</>,
      icon: <Flame size={15} strokeWidth={2} />,
    },
    {
      label: "Open pipeline",
      value: String(openPipeline),
      sub: <>leads not yet Won or Lost</>,
      icon: <Trophy size={15} strokeWidth={2} />,
    },
    {
      label: "SLA breaches",
      value: String(breaches),
      sub: <>first response, one business day</>,
      icon: <AlertTriangle size={15} strokeWidth={2} />,
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
            {mine
              ? "Here is where your leads stand today."
              : "Here is what is happening across Nexoris Technologies today."}
          </p>
        </div>
        <span className="rounded-card border border-purple-200 bg-white px-3 py-1.5 text-label text-neutral-600">
          {today}
        </span>
      </div>

      {/* KPI row */}
      <div className="mt-6 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-card border border-purple-200 bg-white p-4 shadow-subtle"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[0.72rem] font-600 uppercase tracking-wide text-neutral-600">
                {card.label}
              </span>
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-card bg-purple-100 text-purple-600">
                {card.icon}
              </span>
            </div>
            <div className="mt-2 font-mono text-[1.45rem] font-700 leading-none text-ink-950">
              {card.value}
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-[0.72rem] text-neutral-600">{card.sub}</span>
              {card.spark ? <Sparkline values={sparkValues} /> : null}
            </div>
          </div>
        ))}
      </div>

      {/* SLA board + win rate */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-card border border-purple-200 bg-white p-4 shadow-subtle sm:p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-dash-section font-700 text-ink-950">
              First-response SLA board
            </h2>
            <Link
              href="/crm"
              className="inline-flex cursor-pointer items-center gap-0.5 text-label font-600 text-purple-600 hover:text-purple-700"
            >
              Open CRM <ChevronRight size={14} strokeWidth={2.2} />
            </Link>
          </div>
          {slaRes.rows.length === 0 ? (
            <p className="mt-3 text-label text-neutral-600">
              No new leads awaiting a first response. The one-business-day promise
              is being kept.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {slaRes.rows.map((row) => {
                const due = businessDayDeadline(new Date(row.created_at), 1);
                const breached = now > due;
                return (
                  <li key={row.id}>
                    <Link
                      href={`/crm/${row.id}`}
                      className="flex cursor-pointer flex-wrap items-center justify-between gap-2 rounded-card border border-purple-200/60 px-3 py-2.5 hover:bg-purple-100/40"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-dash-data font-600 text-ink-950">
                          {row.name ?? "Unnamed"}
                        </span>
                        {row.company ? (
                          <span className="block truncate text-[0.75rem] text-neutral-600">
                            {row.company}
                          </span>
                        ) : null}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[0.72rem] font-600 ${
                          breached
                            ? "bg-purple-600 text-white"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {breached
                          ? `Breached by ${hoursLabel(now.getTime() - due.getTime())}`
                          : `Due in ${hoursLabel(due.getTime() - now.getTime())}`}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-card border border-purple-200 bg-white p-4 shadow-subtle sm:p-5">
            <h2 className="text-dash-section font-700 text-ink-950">Win rate</h2>
            <p className="mt-2 font-mono text-[2rem] font-700 leading-none text-ink-950">
              {winRate === null ? "–" : `${winRate}%`}
            </p>
            <p className="mt-2 text-[0.75rem] text-neutral-600">
              {winRate === null
                ? "Appears once the first lead closes Won or Lost."
                : `${won} won, ${lost} lost, all time.`}
            </p>
          </div>

          <div className="flex-1 rounded-card border border-purple-200 bg-white p-4 shadow-subtle sm:p-5">
            <h2 className="text-dash-section font-700 text-ink-950">Lead sources</h2>
            {sourceRes.rows.length === 0 ? (
              <p className="mt-3 text-label text-neutral-600">No leads yet.</p>
            ) : (
              <div className="mt-3 flex flex-col gap-2.5">
                {sourceRes.rows.map((row) => {
                  const pct =
                    totalLeads === 0 ? 0 : Math.round((row.total / totalLeads) * 100);
                  return (
                    <div key={row.source}>
                      <div className="flex items-center justify-between text-[0.78rem]">
                        <span className="text-ink-950">
                          {SOURCE_LABEL[row.source] ?? row.source}
                        </span>
                        <span className="font-mono text-neutral-600">
                          {row.total} · {row.won} won
                        </span>
                      </div>
                      <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-purple-100">
                        <span
                          className="block h-full rounded-full bg-purple-600"
                          style={{ width: `${pct}%` }}
                        />
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pipeline + latest leads */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.5fr]">
        <div className="rounded-card border border-purple-200 bg-white p-4 shadow-subtle sm:p-5">
          <h2 className="text-dash-section font-700 text-ink-950">
            Pipeline by stage
          </h2>
          <div className="mt-4 flex flex-col gap-2.5">
            {STAGES.map((stage) => {
              const count = stageMap.get(stage) ?? 0;
              return (
                <div
                  key={stage}
                  className="grid grid-cols-[108px_1fr_auto] items-center gap-2 min-[480px]:grid-cols-[140px_1fr_auto]"
                >
                  <span className="truncate text-[0.8rem] text-ink-950">{stage}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-purple-100">
                    <span
                      className="block h-full rounded-full bg-purple-600"
                      style={{ width: `${(count / maxStage) * 100}%` }}
                    />
                  </span>
                  <span className="w-7 text-right font-mono text-[0.8rem] font-600 text-ink-950">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-card border border-purple-200 bg-white shadow-subtle">
          <div className="flex items-center justify-between px-4 pt-4 sm:px-5">
            <h2 className="text-dash-section font-700 text-ink-950">Latest leads</h2>
            <Link
              href="/crm"
              className="inline-flex cursor-pointer items-center gap-0.5 text-label font-600 text-purple-600 hover:text-purple-700"
            >
              View all <ChevronRight size={14} strokeWidth={2.2} />
            </Link>
          </div>
          {recentRes.rows.length === 0 ? (
            <p className="px-4 pb-5 pt-3 text-label text-neutral-600 sm:px-5">
              Leads from the website, Oge, and the Solution Finder arrive here
              scored the moment someone reaches out.
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[480px] text-left">
                <thead>
                  <tr className="border-b border-purple-200 text-dash-table-header text-neutral-600">
                    <th className="px-4 py-2.5 font-600 sm:px-5">Lead</th>
                    <th className="px-4 py-2.5 font-600">AI Score</th>
                    <th className="px-4 py-2.5 font-600">Stage</th>
                    <th className="px-4 py-2.5 font-600" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {recentRes.rows.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b border-purple-200/50 last:border-b-0"
                    >
                      <td className="px-4 py-3 sm:px-5">
                        <span className="block max-w-[180px] truncate text-dash-data font-600 text-ink-950">
                          {lead.name ?? "Unnamed"}
                        </span>
                        <span className="block max-w-[180px] truncate text-[0.72rem] text-neutral-600">
                          {[SOURCE_LABEL[lead.source] ?? lead.source, lead.company]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.72rem] font-600 ${
                            BAND_CLASS[lead.band ?? ""] ??
                            "bg-neutral-50 text-neutral-600"
                          }`}
                        >
                          <span className="font-mono font-700">
                            {lead.score ?? "–"}
                          </span>
                          {lead.band ?? "Unscored"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[0.8rem] text-neutral-600">
                        {lead.status}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/crm/${lead.id}`}
                          className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-card border border-purple-200 px-2.5 py-1 text-[0.72rem] font-600 text-purple-600 hover:bg-purple-100"
                        >
                          View details <ArrowUpRight size={12} strokeWidth={2.2} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
