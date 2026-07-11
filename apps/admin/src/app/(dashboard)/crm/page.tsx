/**
 * The CRM module home (PRD 5.7, 5.14): the sales workspace. Carries the working screens that
 * belong to CRM rather than the platform dashboard: the first-response SLA board on business-day
 * deadlines, pipeline by stage, win rate, source performance, and the lead list with source, AI
 * Score, rating, stage, and View details. The top-bar search lands here as ?q=. Admins and viewers
 * see the whole team; a salesperson sees their own leads.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronRight, SearchX } from "lucide-react";
import { requireStaff } from "../../../lib/auth.js";
import { db } from "../../../lib/db.js";
import { businessDayDeadline } from "../../../lib/business-days.js";
import { STAGES } from "../../../lib/crm-constants.js";

export const dynamic = "force-dynamic";

interface LeadRow {
  id: string;
  name: string | null;
  email: string | null;
  company: string | null;
  source: string;
  score: number | null;
  band: string | null;
  status: string;
  assigned_name: string | null;
  created_at: string;
}

interface SlaRow {
  id: string;
  name: string | null;
  company: string | null;
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

function hoursLabel(ms: number): string {
  return `${Math.abs(Math.round(ms / 3_600_000))}h`;
}

export default async function CrmPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<ReactNode> {
  const staff = await requireStaff();
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const mine = staff.role === "salesperson";
  const pool = db();

  const conditions: string[] = [];
  const params: unknown[] = [];
  if (mine) {
    params.push(staff.id);
    conditions.push(`l.assigned_to = $${params.length}`);
  }
  if (query) {
    params.push(`%${query}%`);
    conditions.push(
      `(l.name ILIKE $${params.length} OR l.email ILIKE $${params.length} OR l.company ILIKE $${params.length})`,
    );
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const scopedWhere = mine ? "WHERE assigned_to = $1" : "";
  const scopedAnd = mine ? "AND assigned_to = $1" : "";
  const scopedParams = mine ? [staff.id] : [];

  const [leadRes, slaRes, stageRes, sourceRes] = await Promise.all([
    pool.query<LeadRow>(
      `SELECT l.id, l.name, l.email, l.company, l.source, l.score, l.band, l.status,
              s.name AS assigned_name, l.created_at
         FROM lead l
         LEFT JOIN staff s ON s.id = l.assigned_to
        ${where}
        ORDER BY l.score DESC NULLS LAST, l.created_at DESC
        LIMIT 100`,
      params,
    ),
    pool.query<SlaRow>(
      `SELECT id, name, company, created_at FROM lead
        WHERE status = 'New' ${scopedAnd}
        ORDER BY created_at ASC LIMIT 6`,
      scopedParams,
    ),
    pool.query<StageCount>(
      `SELECT status, count(*)::int AS c FROM lead ${scopedWhere} GROUP BY status`,
      scopedParams,
    ),
    pool.query<SourceRow>(
      `SELECT source, count(*)::int AS total,
              count(*) FILTER (WHERE status = 'Won')::int AS won
         FROM lead ${scopedWhere} GROUP BY source ORDER BY total DESC`,
      scopedParams,
    ),
  ]);

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

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-roboto text-dash-title font-700 text-ink-950">CRM</h1>
          <p className="mt-1 text-label text-neutral-600">
            {mine
              ? "Your leads and pipeline, hottest first."
              : "The sales system of record for Nexoris Technologies."}
          </p>
        </div>
        <div className="flex gap-2 text-label text-neutral-600">
          <span className="rounded-card border border-purple-200 bg-white px-3 py-1.5">
            <span className="font-mono font-700 text-ink-950">{openPipeline}</span> open
          </span>
          <span className="rounded-card border border-purple-200 bg-white px-3 py-1.5">
            Win rate{" "}
            <span className="font-mono font-700 text-ink-950">
              {winRate === null ? "–" : `${winRate}%`}
            </span>
          </span>
        </div>
      </div>

      {/* SLA board + pipeline + sources */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-card border border-purple-200 bg-white p-4 shadow-subtle">
          <h2 className="text-dash-section font-700 text-ink-950">
            First-response SLA
          </h2>
          {slaRes.rows.length === 0 ? (
            <p className="mt-3 text-label text-neutral-600">
              No new leads waiting. The one-business-day promise is being kept.
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
                      className="flex cursor-pointer items-center justify-between gap-2 rounded-card border border-purple-200/60 px-3 py-2 hover:bg-purple-100/40"
                    >
                      <span className="min-w-0 truncate text-[0.8rem] font-600 text-ink-950">
                        {row.name ?? "Unnamed"}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[0.68rem] font-600 ${
                          breached
                            ? "bg-purple-600 text-white"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {breached
                          ? `Breached ${hoursLabel(now.getTime() - due.getTime())}`
                          : `Due ${hoursLabel(due.getTime() - now.getTime())}`}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-card border border-purple-200 bg-white p-4 shadow-subtle">
          <h2 className="text-dash-section font-700 text-ink-950">
            Pipeline by stage
          </h2>
          <div className="mt-3 flex flex-col gap-2">
            {STAGES.map((stage) => {
              const count = stageMap.get(stage) ?? 0;
              return (
                <div
                  key={stage}
                  className="grid grid-cols-[104px_1fr_auto] items-center gap-2"
                >
                  <span className="truncate text-[0.78rem] text-ink-950">{stage}</span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-purple-100">
                    <span
                      className="block h-full rounded-full bg-purple-600"
                      style={{ width: `${(count / maxStage) * 100}%` }}
                    />
                  </span>
                  <span className="w-6 text-right font-mono text-[0.78rem] font-600 text-ink-950">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-card border border-purple-200 bg-white p-4 shadow-subtle">
          <h2 className="text-dash-section font-700 text-ink-950">Source performance</h2>
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

      {/* Lead list */}
      <div className="mt-4 rounded-card border border-purple-200 bg-white shadow-subtle">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-4 sm:px-5">
          <h2 className="text-dash-section font-700 text-ink-950">
            {query ? `Leads matching "${query}"` : "Leads"}
          </h2>
          <span className="text-[0.75rem] text-neutral-600">
            {leadRes.rows.length === 0
              ? ""
              : `${leadRes.rows.length} lead${leadRes.rows.length === 1 ? "" : "s"}, hottest first`}
          </span>
        </div>

        {leadRes.rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 pb-10 pt-8 text-center">
            <SearchX size={22} strokeWidth={1.8} className="text-neutral-600" />
            <p className="max-w-sm text-label text-neutral-600">
              {query
                ? `Nothing matches "${query}". Try a name, an email, or a company.`
                : "No leads yet. They arrive here scored the moment someone reaches out through the website, Oge, or the Solution Finder."}
            </p>
            {query ? (
              <Link
                href="/crm"
                className="mt-1 inline-flex cursor-pointer items-center gap-1 text-label font-600 text-purple-600 hover:text-purple-700"
              >
                Clear search <ChevronRight size={14} strokeWidth={2.2} />
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-purple-200 text-dash-table-header text-neutral-600">
                  <th className="px-4 py-2.5 font-600 sm:px-5">Lead</th>
                  <th className="px-4 py-2.5 font-600">Source</th>
                  <th className="px-4 py-2.5 font-600">AI Score</th>
                  <th className="px-4 py-2.5 font-600">Stage</th>
                  <th className="px-4 py-2.5 font-600">Owner</th>
                  <th className="px-4 py-2.5 font-600">Received</th>
                  <th className="px-4 py-2.5 font-600" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {leadRes.rows.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-purple-200/50 last:border-b-0"
                  >
                    <td className="px-4 py-3 sm:px-5">
                      <span className="block max-w-[200px] truncate text-dash-data font-600 text-ink-950">
                        {lead.name ?? "Unnamed"}
                      </span>
                      <span className="block max-w-[200px] truncate text-[0.72rem] text-neutral-600">
                        {[lead.company, lead.email].filter(Boolean).join(" · ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[0.8rem] text-neutral-600">
                      {SOURCE_LABEL[lead.source] ?? lead.source}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.72rem] font-600 ${
                          BAND_CLASS[lead.band ?? ""] ??
                          "bg-neutral-50 text-neutral-600"
                        }`}
                      >
                        <span className="font-mono font-700">{lead.score ?? "–"}</span>
                        {lead.band ?? "Unscored"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[0.8rem] text-neutral-600">
                      {lead.status}
                    </td>
                    <td className="px-4 py-3 text-[0.8rem] text-neutral-600">
                      {lead.assigned_name ?? "Unassigned"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-[0.8rem] text-neutral-600">
                      {new Date(lead.created_at).toLocaleDateString("en-NG", {
                        timeZone: "Africa/Lagos",
                        day: "numeric",
                        month: "short",
                      })}
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
  );
}
