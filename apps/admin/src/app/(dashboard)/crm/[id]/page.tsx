/**
 * The lead detail (PRD 2, 3.1): full context, the AI score and its plain-language justification,
 * the lifecycle stage control, and the activity log. The system of record for a single lead.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "../../../../lib/db.js";
import { getCurrentStaff } from "../../../../lib/auth.js";
import { assignLead, autoAssignLead } from "../../../../lib/people-actions.js";
import { recommendationForLead } from "../../../../lib/lead-recommendation.js";
import { StageControl } from "./StageControl.js";
import { DraftReply } from "./DraftReply.js";

export const dynamic = "force-dynamic";

interface LeadDetail {
  id: string;
  source: string;
  page: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  message: string | null;
  finder: Record<string, unknown> | null;
  score: number | null;
  band: string | null;
  justification: string | null;
  scored_by: string | null;
  status: string;
  lost_reason: string | null;
  nurture_date: string | null;
  created_at: string;
  assigned_to: string | null;
  assignee_name: string | null;
}

interface ActivityRow {
  type: string;
  note: string | null;
  created_at: string;
  actor: string | null;
}

function dateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-NG", { timeZone: "Africa/Lagos" });
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<ReactNode> {
  const { id } = await params;
  const pool = db();
  const staff = await getCurrentStaff();
  const isAdmin = staff?.role === "admin";

  const { rows } = await pool.query<LeadDetail>(
    `SELECT l.id, l.source, l.page, l.name, l.email, l.phone, l.company, l.message,
            l.finder, l.score, l.band, l.justification, l.scored_by, l.status,
            l.lost_reason, l.nurture_date, l.created_at, l.assigned_to,
            s.name AS assignee_name
       FROM lead l
       LEFT JOIN staff s ON s.id = l.assigned_to
      WHERE l.id = $1`,
    [id],
  );
  const lead = rows[0];
  if (!lead) notFound();

  const salespeople = isAdmin
    ? (
        await pool.query<{ id: string; name: string }>(
          "SELECT id, name FROM staff WHERE active = true AND role = 'salesperson' ORDER BY name",
        )
      ).rows
    : [];

  const recommendation = recommendationForLead(lead.finder);
  const canDraft = staff !== null && staff.role !== "viewer";

  const { rows: activity } = await pool.query<ActivityRow>(
    `SELECT la.type, la.note, la.created_at, s.name AS actor
       FROM lead_activity la
       LEFT JOIN staff s ON s.id = la.actor_id
      WHERE la.lead_id = $1
      ORDER BY la.created_at DESC`,
    [id],
  );

  return (
    <div className="max-w-article">
      <Link
        href="/crm"
        className="cursor-pointer text-label text-purple-700 hover:text-purple-600"
      >
        &larr; All leads
      </Link>

      <h1 className="mt-4 font-jakarta text-section font-700 text-ink-950">
        {lead.name ?? "Unnamed lead"}
      </h1>
      <p className="mt-1 text-label text-neutral-600">
        {[lead.company, lead.email, lead.phone].filter(Boolean).join(" · ")}
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* The AI score and justification. */}
          <section className="rounded-card border border-neutral-200 p-5">
            <h2 className="text-eyebrow uppercase text-neutral-600">
              Score {lead.scored_by ? `(${lead.scored_by})` : ""}
            </h2>
            <p className="mt-1 font-jakarta text-subhead font-700 text-ink-950">
              {lead.score ?? "—"} / 100 · {lead.band ?? "Unscored"}
            </p>
            {lead.justification ? (
              <p className="mt-2 text-body text-neutral-700">
                {lead.justification}
              </p>
            ) : null}
          </section>

          {/* What the lead told us. */}
          <section className="rounded-card border border-neutral-200 p-5">
            <h2 className="text-eyebrow uppercase text-neutral-600">Message</h2>
            <p className="mt-2 whitespace-pre-wrap text-body text-neutral-700">
              {lead.message ?? "No message provided."}
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-2 text-label">
              <dt className="text-neutral-600">Source</dt>
              <dd className="text-ink-950">{lead.source}</dd>
              {lead.page ? (
                <>
                  <dt className="text-neutral-600">Page</dt>
                  <dd className="text-ink-950">{lead.page}</dd>
                </>
              ) : null}
              <dt className="text-neutral-600">Received</dt>
              <dd className="text-ink-950">{dateTime(lead.created_at)}</dd>
            </dl>
          </section>

          {/* Deterministic service recommendation (PRD 3.3). */}
          {recommendation ? (
            <section className="rounded-card border border-neutral-200 p-5">
              <h2 className="text-eyebrow uppercase text-neutral-600">
                Recommended services
              </h2>
              <ul className="mt-2 flex flex-col gap-1 text-label">
                {recommendation.services.map((service) => (
                  <li key={service.slug}>
                    <a
                      href={`https://nexoristech.com${service.href}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cursor-pointer text-purple-700 underline hover:text-purple-600"
                    >
                      {service.label}
                    </a>
                  </li>
                ))}
                <li className="mt-1 text-neutral-600">
                  Industry: {recommendation.industry.label}
                </li>
              </ul>
            </section>
          ) : null}

          {/* Auto-response drafting (PRD 3.2). */}
          {canDraft ? (
            <section className="rounded-card border border-neutral-200 p-5">
              <h2 className="text-eyebrow uppercase text-neutral-600">
                Draft a reply
              </h2>
              <div className="mt-3">
                <DraftReply leadId={lead.id} />
              </div>
            </section>
          ) : null}

          {/* The activity log. */}
          <section className="rounded-card border border-neutral-200 p-5">
            <h2 className="text-eyebrow uppercase text-neutral-600">Activity</h2>
            {activity.length === 0 ? (
              <p className="mt-2 text-label text-neutral-600">
                No activity logged yet.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {activity.map((entry, i) => (
                  <li key={i} className="text-label">
                    <span className="text-ink-950">
                      {entry.note ?? entry.type}
                    </span>
                    <span className="block text-neutral-600">
                      {[entry.actor, dateTime(entry.created_at)]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* The stage control. */}
        <div className="flex flex-col gap-6">
          <section className="rounded-card border border-neutral-200 p-5">
            <StageControl leadId={lead.id} currentStatus={lead.status} />
            {lead.status === "Lost" && lead.lost_reason ? (
              <p className="mt-3 text-label text-neutral-600">
                Reason: {lead.lost_reason}
              </p>
            ) : null}
            {lead.status === "Nurture" && lead.nurture_date ? (
              <p className="mt-3 text-label text-neutral-600">
                Revisit on {lead.nurture_date}
              </p>
            ) : null}
          </section>

          <section className="rounded-card border border-neutral-200 p-5">
            <h2 className="text-eyebrow uppercase text-neutral-600">Owner</h2>
            <p className="mt-1 text-label text-ink-950">
              {lead.assignee_name ?? "Unassigned"}
            </p>
            {isAdmin ? (
              <div className="mt-4 flex flex-col gap-3">
                <form action={assignLead} className="flex flex-col gap-2">
                  <input type="hidden" name="leadId" value={lead.id} />
                  <select
                    name="staffId"
                    defaultValue={lead.assigned_to ?? ""}
                    className="cursor-pointer rounded-card border border-neutral-300 p-2 text-label"
                  >
                    <option value="">Unassigned</option>
                    {salespeople.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="cursor-pointer rounded-card bg-purple-600 px-3 py-2 text-label font-600 text-white hover:bg-purple-700"
                  >
                    Assign
                  </button>
                </form>
                <form action={autoAssignLead}>
                  <input type="hidden" name="leadId" value={lead.id} />
                  <button
                    type="submit"
                    className="cursor-pointer text-label text-purple-700 underline hover:text-purple-600"
                  >
                    Auto-assign by fit and capacity
                  </button>
                </form>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
