/**
 * The reassignment queue (PRD 5.4, 5.6). Admin-only. Anything that needs an owner decision: leads
 * with no owner, and open leads whose owner has been deactivated in HR (their leads flow here
 * automatically). Each row can be assigned to an active salesperson or auto-assigned by fit and
 * capacity. Reassignment is Admin-only; every assignment writes to the shared audit log.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { CheckCircle2, MessageSquareWarning } from "lucide-react";
import { requireCapability } from "../../../../lib/auth.js";
import { db } from "../../../../lib/db.js";
import { assignLead, autoAssignLead } from "../../../../lib/people-actions.js";
import { decideReassignment } from "../../../../lib/crm-reassign-actions.js";
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

interface RequestRow {
  id: string;
  lead_id: string;
  reason: string;
  created_at: string;
  lead_name: string | null;
  company: string | null;
  requester: string | null;
}

export default async function ReassignmentQueuePage(): Promise<ReactNode> {
  await requireCapability("crm.assign");
  const pool = db();

  const [{ rows: queue }, { rows: salespeople }, { rows: requests }] = await Promise.all([
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
    pool.query<RequestRow>(
      `SELECT rr.id, rr.lead_id, rr.reason, rr.created_at,
              l.name AS lead_name, l.company, requester.name AS requester
         FROM reassignment_request rr
         JOIN lead l ON l.id = rr.lead_id
         LEFT JOIN staff requester ON requester.id = rr.requested_by
        WHERE rr.status = 'pending'
        ORDER BY rr.created_at ASC`,
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

      {requests.length > 0 ? (
        <section className="mt-6">
          <h2 className="flex items-center gap-2 text-dash-section font-700 text-ink-950">
            <MessageSquareWarning size={17} strokeWidth={2} className="text-purple-600" />
            Reassignment requests
            <span className="rounded-full bg-purple-600 px-2 py-0.5 font-mono text-[0.66rem] font-700 text-white">
              {requests.length}
            </span>
          </h2>
          <p className="mt-1 text-[0.8rem] text-neutral-600">
            A salesperson has asked for one of their leads to be reassigned. Approving returns it to
            the queue below for a new owner.
          </p>
          <ul className="mt-3 flex flex-col gap-3">
            {requests.map((req) => (
              <li
                key={req.id}
                className="rounded-card border border-purple-200 bg-purple-100/30 p-4 shadow-subtle"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/crm/${req.lead_id}`}
                      className="cursor-pointer text-dash-data font-600 text-ink-950 hover:text-purple-700"
                    >
                      {req.lead_name ?? "Unnamed"}
                    </Link>
                    <p className="text-[0.75rem] text-neutral-600">
                      {[req.company, `Requested by ${req.requester ?? "unknown"}`]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <p className="mt-1.5 text-[0.85rem] text-ink-950">“{req.reason}”</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <form action={decideReassignment}>
                      <input type="hidden" name="requestId" value={req.id} />
                      <input type="hidden" name="decision" value="approved" />
                      <button
                        type="submit"
                        className="cursor-pointer rounded-card bg-purple-600 px-3 py-2 text-[0.78rem] font-600 text-white hover:bg-purple-700"
                      >
                        Approve
                      </button>
                    </form>
                    <form action={decideReassignment}>
                      <input type="hidden" name="requestId" value={req.id} />
                      <input type="hidden" name="decision" value="declined" />
                      <button
                        type="submit"
                        className="cursor-pointer rounded-card border border-purple-200 px-3 py-2 text-[0.78rem] font-600 text-purple-700 hover:bg-purple-100"
                      >
                        Decline
                      </button>
                    </form>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
