/**
 * The CRM dashboard (PRD 2.6): the SLA board (first-response timers, most urgent first), the
 * pipeline by stage, source performance (which sources produce revenue), and the win rate.
 * Admins and viewers see the whole team; a salesperson sees their own leads. Targets vs actuals
 * and the scheduled weekly/monthly digests build on this.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { requireStaff } from "../../../lib/auth.js";
import { db } from "../../../lib/db.js";
import { businessDayDeadline, isSlaBreached } from "../../../lib/business-days.js";
import { STAGES } from "../../../lib/crm-constants.js";

export const dynamic = "force-dynamic";

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

function hours(ms: number): string {
  const h = Math.round(ms / 3_600_000);
  return `${Math.abs(h)}h`;
}

export default async function DashboardPage(): Promise<ReactNode> {
  const staff = await requireStaff();
  const mine = staff.role === "salesperson";
  const where = mine ? "WHERE assigned_to = $1" : "";
  const params = mine ? [staff.id] : [];
  const pool = db();

  const [slaRes, stageRes, sourceRes] = await Promise.all([
    pool.query<SlaRow>(
      `SELECT id, name, company, band, created_at FROM lead
        WHERE status = 'New' ${mine ? "AND assigned_to = $1" : ""}
        ORDER BY created_at ASC LIMIT 50`,
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
  ]);

  const stageMap = new Map(stageRes.rows.map((r) => [r.status, r.c]));
  const won = stageMap.get("Won") ?? 0;
  const lost = stageMap.get("Lost") ?? 0;
  const winRate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : null;
  const now = new Date();

  return (
    <div>
      <h1 className="font-jakarta text-section font-700 text-ink-950">
        Dashboard
      </h1>
      <p className="mt-1 text-label text-neutral-600">
        {mine ? "Your leads." : "The whole team."}
      </p>

      {/* Headline numbers. */}
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Open leads" value={String(
          [...stageMap.entries()]
            .filter(([s]) => s !== "Won" && s !== "Lost")
            .reduce((sum, [, c]) => sum + c, 0),
        )} />
        <Stat label="Won" value={String(won)} />
        <Stat label="Win rate" value={winRate === null ? "—" : `${winRate}%`} />
        <Stat
          label="SLA breaches"
          value={String(
            slaRes.rows.filter((r) => isSlaBreached(new Date(r.created_at), now))
              .length,
          )}
        />
      </div>

      {/* SLA board. */}
      <section className="mt-10">
        <h2 className="font-jakarta text-subhead font-700 text-ink-950">
          First-response SLA board
        </h2>
        {slaRes.rows.length === 0 ? (
          <p className="mt-2 text-label text-neutral-600">
            No new leads awaiting a first response.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {slaRes.rows.map((row) => {
              const created = new Date(row.created_at);
              const due = businessDayDeadline(created, 1);
              const breached = now > due;
              return (
                <li
                  key={row.id}
                  className="flex items-center justify-between rounded-card border border-neutral-200 px-4 py-3 text-label"
                >
                  <Link
                    href={`/crm/${row.id}`}
                    className="cursor-pointer font-600 text-purple-700 hover:text-purple-600"
                  >
                    {row.name ?? "Unnamed"}
                    {row.company ? ` · ${row.company}` : ""}
                  </Link>
                  <span
                    className={
                      breached ? "font-600 text-purple-700" : "text-neutral-600"
                    }
                  >
                    {breached
                      ? `Breached by ${hours(now.getTime() - due.getTime())}`
                      : `Due in ${hours(due.getTime() - now.getTime())}`}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Pipeline by stage. */}
        <section>
          <h2 className="font-jakarta text-subhead font-700 text-ink-950">
            Pipeline by stage
          </h2>
          <ul className="mt-3 flex flex-col gap-1 text-label">
            {STAGES.map((stage) => (
              <li
                key={stage}
                className="flex justify-between border-b border-neutral-100 py-1"
              >
                <span className="text-neutral-700">{stage}</span>
                <span className="font-600 text-ink-950">
                  {stageMap.get(stage) ?? 0}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Source performance. */}
        <section>
          <h2 className="font-jakarta text-subhead font-700 text-ink-950">
            Source performance
          </h2>
          {sourceRes.rows.length === 0 ? (
            <p className="mt-2 text-label text-neutral-600">No leads yet.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-1 text-label">
              {sourceRes.rows.map((row) => (
                <li
                  key={row.source}
                  className="flex justify-between border-b border-neutral-100 py-1"
                >
                  <span className="text-neutral-700">{row.source}</span>
                  <span className="text-ink-950">
                    {row.total} total · {row.won} won
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }): ReactNode {
  return (
    <div className="rounded-card border border-neutral-200 p-4">
      <p className="text-label text-neutral-600">{label}</p>
      <p className="mt-1 font-jakarta text-section font-700 text-ink-950">
        {value}
      </p>
    </div>
  );
}
