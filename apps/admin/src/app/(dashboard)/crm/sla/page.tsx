/**
 * The CRM SLA board (PRD 5.7): every lead awaiting a first response, sorted by urgency, against the
 * one-business-day promise. Visible to everyone; a salesperson sees only their own. Breaches are
 * called out; leads still in time show the hours remaining.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { requireStaff } from "../../../../lib/auth.js";
import { db } from "../../../../lib/db.js";
import { businessDayDeadline } from "../../../../lib/business-days.js";

export const dynamic = "force-dynamic";

interface Row {
  id: string;
  name: string | null;
  company: string | null;
  band: string | null;
  source: string;
  assignee_name: string | null;
  created_at: string;
}

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

export default async function SlaBoardPage(): Promise<ReactNode> {
  const staff = await requireStaff();
  const mine = staff.role === "salesperson";
  const { rows } = await db().query<Row>(
    `SELECT l.id, l.name, l.company, l.band, l.source, s.name AS assignee_name, l.created_at
       FROM lead l
       LEFT JOIN staff s ON s.id = l.assigned_to
      WHERE l.status = 'New' ${mine ? "AND l.assigned_to = $1" : ""}
      ORDER BY l.created_at ASC`,
    mine ? [staff.id] : [],
  );

  const now = new Date();
  const withDeadline = rows.map((row) => {
    const due = businessDayDeadline(new Date(row.created_at), 1);
    return { ...row, due, breached: now > due };
  });
  const breaches = withDeadline.filter((r) => r.breached).length;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-roboto text-dash-title font-700 text-ink-950">SLA board</h1>
      <p className="mt-1 text-label text-neutral-600">
        First response within one business day. {mine ? "Your leads." : "The whole team."}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:max-w-sm">
        <div className="rounded-card border border-purple-200 bg-white p-4 shadow-subtle">
          <span className="block text-[0.7rem] font-600 uppercase tracking-wide text-neutral-600">
            Awaiting response
          </span>
          <span className="mt-1 block font-mono text-[1.4rem] font-700 text-ink-950">
            {rows.length}
          </span>
        </div>
        <div className="rounded-card border border-purple-200 bg-white p-4 shadow-subtle">
          <span className="block text-[0.7rem] font-600 uppercase tracking-wide text-neutral-600">
            In breach
          </span>
          <span className="mt-1 block font-mono text-[1.4rem] font-700 text-purple-700">
            {breaches}
          </span>
        </div>
      </div>

      {withDeadline.length === 0 ? (
        <div className="mt-5 flex flex-col items-center gap-2 rounded-card border border-dashed border-purple-200 bg-white py-10 text-center">
          <CheckCircle2 size={24} strokeWidth={1.8} className="text-purple-600" />
          <p className="text-label text-neutral-600">
            No leads waiting. The one-business-day promise is being kept.
          </p>
        </div>
      ) : (
        <ul className="mt-5 flex flex-col gap-2">
          {withDeadline.map((row) => (
            <li key={row.id}>
              <Link
                href={`/crm/${row.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-purple-200 bg-white px-4 py-3 shadow-subtle hover:border-purple-300"
              >
                <span className="min-w-0">
                  <span className="block truncate text-dash-data font-600 text-ink-950">
                    {row.name ?? "Unnamed"}
                  </span>
                  <span className="block truncate text-[0.75rem] text-neutral-600">
                    {[SOURCE_LABEL[row.source] ?? row.source, row.company, row.assignee_name ?? "Unassigned"]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.72rem] font-600 ${
                      row.breached ? "bg-purple-600 text-white" : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {row.breached ? <AlertTriangle size={12} strokeWidth={2.2} /> : null}
                    {row.breached
                      ? `Breached by ${hoursLabel(now.getTime() - row.due.getTime())}`
                      : `Due in ${hoursLabel(row.due.getTime() - now.getTime())}`}
                  </span>
                  <ArrowUpRight size={15} strokeWidth={2} className="text-purple-600" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
