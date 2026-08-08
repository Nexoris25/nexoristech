/**
 * Personal Dashboard (Image 9). A salesperson's own view: personal KPIs, a task checklist beside a
 * target-progress ring, and the personal pipeline beside recent activity. Reached via the switcher.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, Pencil } from "lucide-react";
import { requireStaff } from "../../../../lib/auth.js";
import { db } from "../../../../lib/db.js";
import { STAGES } from "../../../../lib/crm-constants.js";
import { Dropdown } from "../../../../components/Dropdown.js";
import { ProgressRing } from "../../../../components/charts.js";

export const dynamic = "force-dynamic";

const LAGOS = "Africa/Lagos";
function greeting(): string {
  const h = Number(new Intl.DateTimeFormat("en-NG", { timeZone: LAGOS, hour: "numeric", hour12: false }).format(new Date()));
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

const LAGOS_TZ = "Africa/Lagos";
const todayLabel = (): string =>
  new Intl.DateTimeFormat("en-NG", { timeZone: LAGOS_TZ, day: "numeric", month: "long", year: "numeric" }).format(new Date());

const PRIORITY: Record<string, string> = {
  High: "bg-[#FEE2E2] text-[#B91C1C]",
  Medium: "bg-[#FEF3C7] text-[#B45309]",
  Low: "bg-slate-100 text-slate-600",
};

const nairaShort = (v: number): string => {
  if (v >= 1_000_000) return `₦${(v / 1_000_000).toFixed(v >= 10_000_000 ? 1 : 2)}M`;
  if (v >= 1_000) return `₦${Math.round(v / 1_000)}K`;
  return `₦${Math.round(v).toLocaleString("en-NG")}`;
};

export default async function PersonalDashboard(): Promise<ReactNode> {
  const staff = await requireStaff();
  const firstName = staff.name.split(/\s+/)[0] ?? staff.name;

  // Everything below is this person's own work, scoped by lead.assigned_to. It previously showed an
  // invented book of business — 32 leads, a 63% target, tasks against fictional companies — which is
  // actively misleading on a screen someone uses to decide what to do next.
  const pool = db();
  const [{ rows: mine }, { rows: stageRows }, { rows: target }, { rows: due }, { rows: acts }] = await Promise.all([
    pool.query<{ leads: string; new_today: string; open_opps: string; won_value: string }>(
      `SELECT count(*)::text AS leads,
              count(*) FILTER (WHERE created_at::date = current_date)::text AS new_today,
              count(*) FILTER (WHERE status NOT IN ('Won','Lost'))::text AS open_opps,
              coalesce(sum(deal_value) FILTER (WHERE status='Won'),0)::text AS won_value
         FROM lead WHERE assigned_to = $1`, [staff.id]),
    pool.query<{ status: string; n: string; value: string }>(
      `SELECT status, count(*)::text AS n, coalesce(sum(deal_value),0)::text AS value
         FROM lead WHERE assigned_to = $1 AND status <> 'Lost' GROUP BY status`, [staff.id]),
    pool.query<{ target: string }>(
      "SELECT target::text FROM sales_target WHERE staff_id = $1 AND metric = 'won_value' LIMIT 1", [staff.id]),
    // A follow-up that is due is this person's real task list.
    pool.query<{ name: string; company: string | null; followup_due: string; followup_stage: string | null }>(
      `SELECT name, company, followup_due::text, followup_stage
         FROM lead
        WHERE assigned_to = $1 AND followup_due IS NOT NULL AND followup_sent_at IS NULL
        ORDER BY followup_due LIMIT 6`, [staff.id]),
    pool.query<{ action: string; created_at: string }>(
      `SELECT action, created_at::text FROM audit_log WHERE actor_id = $1 ORDER BY created_at DESC LIMIT 4`, [staff.id]),
  ]);

  const me = mine[0]!;
  const targetValue = Number(target[0]?.target ?? 0);
  const wonValue = Number(me.won_value);
  const overdue = due.filter((d) => new Date(d.followup_due) < new Date()).length;
  const targetPct = targetValue > 0 ? Math.min(100, Math.round((wonValue / targetValue) * 100)) : 0;
  // Targets in sales_target are monthly, so the countdown is to month end.
  const now = new Date();
  const daysLeftInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();

  const KPIS = [
    { label: "My Leads", value: me.leads, sub: `${me.new_today} new today` },
    { label: "My Opportunities", value: me.open_opps, sub: "still open" },
    { label: "Follow-ups Due", value: String(due.length), sub: overdue > 0 ? `${overdue} overdue` : "none overdue" },
    {
      label: "Target Achievement",
      value: targetValue > 0 ? `${Math.round((wonValue / targetValue) * 100)}%` : "—",
      sub: targetValue > 0 ? `${nairaShort(wonValue)} / ${nairaShort(targetValue)}` : "No target set",
    },
  ];

  const byStage = new Map(stageRows.map((r) => [r.status, r]));
  const PIPELINE = STAGES
    .map((label) => ({ label, count: Number(byStage.get(label)?.n ?? 0), value: nairaShort(Number(byStage.get(label)?.value ?? 0)) }))
    .filter((p) => p.count > 0);

  const TASKS = due.map((d) => ({
    text: `Follow up with ${d.company ?? d.name}`,
    pri: new Date(d.followup_due) < new Date() ? "High" : "Medium",
    due: new Date(d.followup_due).toLocaleDateString("en-NG", { day: "numeric", month: "short" }),
  }));

  const ACTIVITIES = acts.map((a) => ({
    icon: <Pencil size={13} strokeWidth={2} />,
    text: a.action.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase()),
    when: new Date(a.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" }),
  }));

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900 sm:text-[1.6rem]">{greeting()}, {firstName} <span className="align-middle">👋</span></h1>
          <p className="mt-1 text-[0.88rem] text-slate-500">Here&apos;s your overview for today.</p>
        </div>
        <Dropdown align="right" buttonClassName="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[0.82rem] font-600 text-slate-700 hover:bg-slate-50" label={<>{todayLabel()} <ChevronDown size={14} strokeWidth={2.2} className="text-slate-500" /></>}>
          {["Today", "This Week", "This Month"].map((o) => <button key={o} type="button" className="flex w-full rounded-lg px-3 py-2 text-left text-[0.83rem] text-slate-700 hover:bg-slate-50">{o}</button>)}
        </Dropdown>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {KPIS.map((k) => (
          <div key={k.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle sm:p-5">
            <p className="text-[0.78rem] font-500 text-slate-500">{k.label}</p>
            <p className="mt-2 font-mono text-[1.5rem] font-700 leading-none text-slate-900">{k.value}</p>
            <p className="mt-1.5 text-[0.72rem] text-slate-500">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.95rem] font-700 text-slate-900">My Tasks</h2>
          <ul className="mt-4 flex flex-col gap-2.5">
            {TASKS.map((t) => (
              <li key={t.text} className="flex items-center gap-3">
                <input type="checkbox" className="h-4 w-4 shrink-0 cursor-pointer rounded accent-[#543CDA]" />
                <span className="min-w-0 flex-1 truncate text-[0.84rem] text-slate-800">{t.text}</span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.68rem] font-600 ${PRIORITY[t.pri]}`}>{t.pri}</span>
                <span className="hidden shrink-0 text-[0.74rem] text-slate-500 sm:block">{t.due}</span>
              </li>
            ))}
          </ul>
          <Link href="/action-center" className="mt-4 inline-block text-[0.8rem] font-600 text-[#543CDA] hover:text-[#4330B8]">View all tasks</Link>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.95rem] font-700 text-slate-900">My Target Progress</h2>
          <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:justify-around">
            <ProgressRing value={targetPct} size={140} thickness={14} color="#543CDA">
              <div className="text-center">
                <span className="block font-mono text-[1.6rem] font-700 leading-none text-slate-900">{targetValue > 0 ? `${targetPct}%` : "—"}</span>
                <span className="mt-1 block text-[0.64rem] text-slate-500">
                  {targetValue > 0 ? `${nairaShort(wonValue)} / ${nairaShort(targetValue)}` : "No target set"}
                </span>
              </div>
            </ProgressRing>
            <div className="flex gap-8 sm:flex-col sm:gap-4">
              <div>
                <p className="text-[0.72rem] text-slate-500">Remaining</p>
                <p className="mt-0.5 font-mono text-[1.1rem] font-700 text-slate-900">
                  {targetValue > 0 ? nairaShort(Math.max(0, targetValue - wonValue)) : "—"}
                </p>
              </div>
              <div>
                <p className="text-[0.72rem] text-slate-500">Days Left</p>
                <p className="mt-0.5 font-mono text-[1.1rem] font-700 text-slate-900">{daysLeftInMonth}</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.95rem] font-700 text-slate-900">My Pipeline</h2>
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
            {PIPELINE.map((p) => (
              <div key={p.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                <p className="truncate text-[0.68rem] text-slate-500">{p.label}</p>
                <p className="mt-1 font-mono text-[1.3rem] font-700 leading-none text-slate-900">{p.count}</p>
                <p className="mt-1 font-mono text-[0.72rem] text-[#543CDA]">{p.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.95rem] font-700 text-slate-900">Recent Activities</h2>
          <ul className="mt-4 flex flex-col gap-3.5">
            {ACTIVITIES.map((a, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#EEEBFC] text-[#543CDA]">{a.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.82rem] text-slate-800">{a.text}</span>
                  <span className="block text-[0.72rem] text-slate-500">{a.when}</span>
                </span>
              </li>
            ))}
          </ul>
          <Link href="/action-center" className="mt-4 inline-block text-[0.8rem] font-600 text-[#543CDA] hover:text-[#4330B8]">View all activities</Link>
        </section>
      </div>
    </div>
  );
}
