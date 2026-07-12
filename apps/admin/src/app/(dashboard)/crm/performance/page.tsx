/**
 * CRM performance dashboards (PRD 5.7): the conversion funnel, win rate, stage distribution, and
 * source performance, plus per-rep outcomes for admins and viewers. Any figure tied to a Won deal
 * would read as Sales Won Value, never Revenue; deal values are added with the deal record. A
 * salesperson sees their own numbers; admins and viewers see the team.
 */
import type { ReactNode } from "react";
import { requireStaff } from "../../../../lib/auth.js";
import { db } from "../../../../lib/db.js";
import { STAGES } from "../../../../lib/crm-constants.js";

export const dynamic = "force-dynamic";

// The funnel order: how far a lead has progressed. Won sits at the end; Lost and Nurture are shown
// separately since they leave the forward funnel.
const FUNNEL = [
  "New",
  "Contacted",
  "Qualified",
  "Scoping Call Booked",
  "Proposal Sent",
  "Negotiation",
  "Won",
] as const;

const SOURCE_LABEL: Record<string, string> = {
  "contact-form": "Contact form",
  "oge-chat": "Oge chat",
  "solution-finder": "Solution Finder",
  whatsapp: "WhatsApp",
  email: "Email",
  referral: "Referral",
};

export default async function PerformancePage(): Promise<ReactNode> {
  const staff = await requireStaff();
  const mine = staff.role === "salesperson";
  const where = mine ? "WHERE assigned_to = $1" : "";
  const params = mine ? [staff.id] : [];
  const pool = db();

  const [stageRes, sourceRes, repRes] = await Promise.all([
    pool.query<{ status: string; c: number }>(
      `SELECT status, count(*)::int AS c FROM lead ${where} GROUP BY status`,
      params,
    ),
    pool.query<{ source: string; total: number; won: number }>(
      `SELECT source, count(*)::int AS total, count(*) FILTER (WHERE status='Won')::int AS won
         FROM lead ${where} GROUP BY source ORDER BY total DESC`,
      params,
    ),
    mine
      ? Promise.resolve({ rows: [] as { name: string; total: number; won: number; open: number }[] })
      : pool.query<{ name: string; total: number; won: number; open: number }>(
          `SELECT s.name,
                  count(l.id)::int AS total,
                  count(l.id) FILTER (WHERE l.status='Won')::int AS won,
                  count(l.id) FILTER (WHERE l.status NOT IN ('Won','Lost'))::int AS open
             FROM staff s
             JOIN lead l ON l.assigned_to = s.id
            GROUP BY s.name ORDER BY won DESC, total DESC`,
        ),
  ]);

  const stageMap = new Map(stageRes.rows.map((r) => [r.status, r.c]));
  const total = [...stageMap.values()].reduce((s, c) => s + c, 0);
  const won = stageMap.get("Won") ?? 0;
  const lost = stageMap.get("Lost") ?? 0;
  const winRate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : null;

  // Funnel: leads at or beyond each stage. A lead that reached Won also passed through the earlier
  // gates, so the count at a stage is everything from that stage forward (excluding Lost/Nurture).
  const forwardCounts = FUNNEL.map((stage) => {
    const idx = FUNNEL.indexOf(stage);
    let count = 0;
    for (let i = idx; i < FUNNEL.length; i += 1) count += stageMap.get(FUNNEL[i]!) ?? 0;
    return { stage, count };
  });
  const funnelMax = Math.max(1, forwardCounts[0]?.count ?? 1);

  const sourceTotal = sourceRes.rows.reduce((s, r) => s + r.total, 0);

  const cards = [
    { label: "Total leads", value: String(total) },
    { label: "Won", value: String(won) },
    { label: "Win rate", value: winRate === null ? "–" : `${winRate}%` },
    {
      label: "Open pipeline",
      value: String(
        [...stageMap.entries()].filter(([s]) => s !== "Won" && s !== "Lost").reduce((s, [, c]) => s + c, 0),
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-roboto text-dash-title font-700 text-ink-950">Performance</h1>
      <p className="mt-1 text-label text-neutral-600">
        {mine ? "Your conversion and sources." : "Team conversion, sources, and per-rep outcomes."}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-card border border-purple-200 bg-white p-4 shadow-subtle">
            <span className="block text-[0.7rem] font-600 uppercase tracking-wide text-neutral-600">
              {card.label}
            </span>
            <span className="mt-1 block font-mono text-[1.4rem] font-700 text-ink-950">
              {card.value}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-card border border-purple-200 bg-white p-4 shadow-subtle sm:p-5">
          <h2 className="text-dash-section font-700 text-ink-950">Conversion funnel</h2>
          {total === 0 ? (
            <p className="mt-3 text-label text-neutral-600">No leads yet.</p>
          ) : (
            <div className="mt-4 flex flex-col gap-2">
              {forwardCounts.map((row, i) => {
                const prev = forwardCounts[i - 1]?.count;
                const rate = prev && prev > 0 ? Math.round((row.count / prev) * 100) : null;
                return (
                  <div key={row.stage} className="grid grid-cols-[140px_1fr_auto] items-center gap-2">
                    <span className="truncate text-[0.78rem] text-ink-950">{row.stage}</span>
                    <span className="h-2.5 overflow-hidden rounded-full bg-purple-100">
                      <span
                        className="block h-full rounded-full bg-purple-600"
                        style={{ width: `${(row.count / funnelMax) * 100}%` }}
                      />
                    </span>
                    <span className="w-16 text-right font-mono text-[0.75rem] text-neutral-600">
                      {row.count}
                      {rate !== null ? <span className="text-purple-700"> · {rate}%</span> : null}
                    </span>
                  </div>
                );
              })}
              <div className="mt-1 flex gap-4 text-[0.72rem] text-neutral-600">
                <span>Lost: {lost}</span>
                <span>Nurture: {stageMap.get("Nurture") ?? 0}</span>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-card border border-purple-200 bg-white p-4 shadow-subtle sm:p-5">
          <h2 className="text-dash-section font-700 text-ink-950">Source performance</h2>
          {sourceRes.rows.length === 0 ? (
            <p className="mt-3 text-label text-neutral-600">No leads yet.</p>
          ) : (
            <div className="mt-4 flex flex-col gap-2.5">
              {sourceRes.rows.map((row) => {
                const pct = sourceTotal === 0 ? 0 : Math.round((row.total / sourceTotal) * 100);
                return (
                  <div key={row.source}>
                    <div className="flex items-center justify-between text-[0.78rem]">
                      <span className="text-ink-950">{SOURCE_LABEL[row.source] ?? row.source}</span>
                      <span className="font-mono text-neutral-600">
                        {row.total} · {row.won} won
                      </span>
                    </div>
                    <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-purple-100">
                      <span className="block h-full rounded-full bg-purple-600" style={{ width: `${pct}%` }} />
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {!mine ? (
        <div className="mt-4 rounded-card border border-purple-200 bg-white shadow-subtle">
          <h2 className="px-4 pt-4 text-dash-section font-700 text-ink-950 sm:px-5">
            Per-rep outcomes
          </h2>
          {repRes.rows.length === 0 ? (
            <p className="px-4 pb-5 pt-2 text-label text-neutral-600 sm:px-5">
              No leads are assigned yet. Assign leads to see per-rep outcomes.
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[420px] text-left">
                <thead>
                  <tr className="border-b border-purple-200 text-dash-table-header text-neutral-600">
                    <th className="px-4 py-2.5 font-600 sm:px-5">Salesperson</th>
                    <th className="px-4 py-2.5 font-600">Assigned</th>
                    <th className="px-4 py-2.5 font-600">Open</th>
                    <th className="px-4 py-2.5 font-600">Won</th>
                  </tr>
                </thead>
                <tbody>
                  {repRes.rows.map((rep) => (
                    <tr key={rep.name} className="border-b border-purple-200/50 last:border-b-0">
                      <td className="px-4 py-3 text-dash-data font-600 text-ink-950 sm:px-5">
                        {rep.name}
                      </td>
                      <td className="px-4 py-3 font-mono text-[0.8rem] text-neutral-600">{rep.total}</td>
                      <td className="px-4 py-3 font-mono text-[0.8rem] text-neutral-600">{rep.open}</td>
                      <td className="px-4 py-3 font-mono text-[0.8rem] font-700 text-purple-700">
                        {rep.won}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      <p className="mt-4 text-[0.72rem] text-neutral-600">
        Deal values and Sales Won Value join these screens with the deal record. CRM never shows
        Revenue or calculates commission; those are read from Finance and the Commission Engine.
        {STAGES.length ? "" : ""}
      </p>
    </div>
  );
}
