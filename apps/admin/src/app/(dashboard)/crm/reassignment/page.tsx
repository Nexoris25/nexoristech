/**
 * The reassignment queue (PRD 5.4, 5.6). Admin-only. Anything that needs an owner decision: leads
 * with no owner, and open leads whose owner has been deactivated in HR (their leads flow here
 * automatically). Each row can be assigned to an active salesperson or auto-assigned by fit and
 * capacity. Reassignment is Admin-only; every assignment writes to the shared audit log.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { requireAdmin } from "../../../../lib/auth.js";
import { db } from "../../../../lib/db.js";
import { assignLead, autoAssignLead } from "../../../../lib/people-actions.js";
import { rating } from "../../../../lib/lead-ui.js";

export const dynamic = "force-dynamic";

interface QueueRow {
  id: string;
  name: string | null;
  company: string | null;
  band: string | null;
  score: number | null;
  status: string;
  reason: "unassigned" | "owner-exited";
  former_owner: string | null;
}

export default async function ReassignmentQueuePage(): Promise<ReactNode> {
  await requireAdmin();
  const pool = db();

  const [{ rows: queue }, { rows: salespeople }] = await Promise.all([
    pool.query<QueueRow>(
      `SELECT l.id, l.name, l.company, l.band, l.score, l.status,
              CASE WHEN l.assigned_to IS NULL THEN 'unassigned' ELSE 'owner-exited' END AS reason,
              owner.name AS former_owner
         FROM lead l
         LEFT JOIN staff owner ON owner.id = l.assigned_to
        WHERE l.status NOT IN ('Won', 'Lost')
          AND (l.assigned_to IS NULL OR owner.active = false)
        ORDER BY l.score DESC NULLS LAST, l.created_at ASC`,
    ),
    pool.query<{ id: string; name: string }>(
      "SELECT id, name FROM staff WHERE active = true AND role = 'salesperson' ORDER BY name",
    ),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-roboto text-dash-title font-700 text-ink-950">
        Reassignment queue
      </h1>
      <p className="mt-1 text-label text-neutral-600">
        Leads waiting on an owner decision. Unassigned leads and open leads whose owner has left.
      </p>

      {queue.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-2 rounded-card border border-dashed border-purple-200 bg-white py-10 text-center">
          <CheckCircle2 size={24} strokeWidth={1.8} className="text-purple-600" />
          <p className="text-label text-neutral-600">
            Nothing to reassign. Every open lead has an active owner.
          </p>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {queue.map((lead) => (
            <li
              key={lead.id}
              className="rounded-card border border-purple-200 bg-white p-4 shadow-subtle"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/crm/${lead.id}`}
                    className="cursor-pointer text-dash-data font-600 text-ink-950 hover:text-purple-700"
                  >
                    {lead.name ?? "Unnamed"}
                  </Link>
                  <p className="text-[0.75rem] text-neutral-600">
                    {[lead.company, lead.status].filter(Boolean).join(" · ")}
                  </p>
                  <p className="mt-1 text-[0.72rem] text-purple-700">
                    {lead.reason === "unassigned"
                      ? "No owner assigned"
                      : `Former owner ${lead.former_owner ?? "unknown"} has left`}
                  </p>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.75rem] font-600 ${rating(lead.band).solid}`}
                >
                  <span className="font-mono font-700">{lead.score ?? "–"}</span>
                  {rating(lead.band).label}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-purple-200/60 pt-3">
                <form action={assignLead} className="flex items-center gap-2">
                  <input type="hidden" name="leadId" value={lead.id} />
                  <select
                    name="staffId"
                    defaultValue=""
                    aria-label={`Assign ${lead.name ?? "lead"} to`}
                    className="cursor-pointer rounded-card border border-neutral-200 p-2 text-[0.8rem] text-ink-950"
                  >
                    <option value="" disabled>
                      Assign to…
                    </option>
                    {salespeople.map((person) => (
                      <option key={person.id} value={person.id}>
                        {person.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="cursor-pointer rounded-card bg-purple-600 px-3 py-2 text-[0.78rem] font-600 text-white hover:bg-purple-700"
                  >
                    Assign
                  </button>
                </form>
                <form action={autoAssignLead}>
                  <input type="hidden" name="leadId" value={lead.id} />
                  <button
                    type="submit"
                    className="cursor-pointer rounded-card border border-purple-200 px-3 py-2 text-[0.78rem] font-600 text-purple-700 hover:bg-purple-100"
                  >
                    Auto-assign by fit
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
