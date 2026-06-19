/**
 * The CRM lead list (PRD Part Three, 2): the scored leads Oge delivers, ordered by score so the
 * hottest sit at the top (the SLA board view comes next). Reads nexoris_admin directly. Sign-in
 * and role gating are wired in the next step; this view is the system of record for leads.
 */
import type { ReactNode } from "react";
import { db } from "../../lib/db.js";

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
  created_at: string;
}

const BAND_CLASS: Record<string, string> = {
  Hot: "bg-purple-600 text-white",
  Warm: "bg-purple-100 text-purple-700",
  Cold: "bg-neutral-100 text-neutral-600",
};

export default async function CrmPage(): Promise<ReactNode> {
  const { rows } = await db().query<LeadRow>(
    `SELECT id, name, email, company, source, score, band, status, created_at
       FROM lead
      ORDER BY score DESC NULLS LAST, created_at DESC
      LIMIT 100`,
  );

  return (
    <div>
      <h1 className="font-jakarta text-section font-700 text-ink-950">Leads</h1>
      <p className="mt-1 text-label text-neutral-600">
        {rows.length === 0
          ? "No leads yet. They arrive here scored the moment someone reaches out."
          : `${rows.length} lead${rows.length === 1 ? "" : "s"}, hottest first.`}
      </p>

      {rows.length > 0 ? (
        <div className="mt-6 overflow-x-auto rounded-card border border-neutral-200">
          <table className="w-full text-left text-label">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="px-4 py-3 font-600">Lead</th>
                <th className="px-4 py-3 font-600">Source</th>
                <th className="px-4 py-3 font-600">Score</th>
                <th className="px-4 py-3 font-600">Stage</th>
                <th className="px-4 py-3 font-600">Received</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((lead) => (
                <tr key={lead.id} className="border-t border-neutral-200">
                  <td className="px-4 py-3">
                    <span className="block font-600 text-ink-950">
                      {lead.name ?? "Unnamed"}
                    </span>
                    <span className="text-neutral-600">
                      {[lead.company, lead.email].filter(Boolean).join(" · ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{lead.source}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${
                        BAND_CLASS[lead.band ?? ""] ?? "bg-neutral-100"
                      }`}
                    >
                      <span className="font-700">{lead.score ?? "—"}</span>
                      <span>{lead.band ?? "Unscored"}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{lead.status}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    {new Date(lead.created_at).toLocaleDateString("en-NG", {
                      timeZone: "Africa/Lagos",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
