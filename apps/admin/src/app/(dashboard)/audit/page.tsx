/**
 * The Audit Log (PRD 3.4): the one immutable, platform-wide record of who did what, when, with the
 * before and after. Admin only. Filterable by action; each module's own "view audit log" would be
 * a scoped view of this same table, never a separate log. Append-only by policy.
 */
import type { ReactNode } from "react";
import { FileClock } from "lucide-react";
import { requireAdmin } from "../../../lib/auth.js";
import { db } from "../../../lib/db.js";

export const dynamic = "force-dynamic";

interface AuditRow {
  id: string;
  action: string;
  entity: string;
  entity_id: string | null;
  before: unknown;
  after: unknown;
  actor: string | null;
  created_at: string;
}

const ACTION_LABEL: Record<string, string> = {
  "stage-change": "Stage change",
  assign: "Lead assigned",
  "auto-assign": "Lead auto-assigned",
  create: "Staff created",
  deactivate: "Staff deactivated",
  "grant-access": "Access granted",
  "revoke-access": "Access revoked",
  "update-settings": "Settings updated",
  "reset-password": "Password reset",
  "follow-up-sent": "Follow-up sent",
};

function summarise(row: AuditRow): string {
  const after = (row.after ?? {}) as Record<string, unknown>;
  const before = (row.before ?? {}) as Record<string, unknown>;
  switch (row.action) {
    case "stage-change":
      return `${before.status ?? "?"} → ${after.status ?? "?"}`;
    case "grant-access":
      return `${after.module ?? ""} · ${after.role ?? ""}`;
    case "revoke-access":
      return `${after.module ?? before.module ?? ""}`;
    case "update-settings":
      return `NRS ${after.nrsEnabled ? "on" : "off"}, VAT ${after.vatRate ?? ""}%`;
    default:
      return row.entity;
  }
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}): Promise<ReactNode> {
  await requireAdmin();
  const { action } = await searchParams;
  const filter = action && ACTION_LABEL[action] ? action : "";

  const { rows } = await db().query<AuditRow>(
    `SELECT a.id::text, a.action, a.entity, a.entity_id, a.before, a.after,
            s.name AS actor, a.created_at
       FROM audit_log a LEFT JOIN staff s ON s.id = a.actor_id
      ${filter ? "WHERE a.action = $1" : ""}
      ORDER BY a.created_at DESC LIMIT 200`,
    filter ? [filter] : [],
  );

  const actions = Object.keys(ACTION_LABEL);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-roboto text-[1.7rem] font-700 leading-tight text-ink-950">Audit Log</h1>
      <p className="mt-1 text-[0.95rem] text-neutral-600">
        Every change across the platform, immutable, who and what and when.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <a
          href="/audit"
          className={`rounded-full px-3 py-1.5 text-[0.8rem] font-600 ${
            filter === "" ? "bg-purple-600 text-white" : "border border-purple-200 text-purple-700 hover:bg-purple-100"
          }`}
        >
          All
        </a>
        {actions.map((a) => (
          <a
            key={a}
            href={`/audit?action=${a}`}
            className={`rounded-full px-3 py-1.5 text-[0.8rem] font-600 ${
              filter === a ? "bg-purple-600 text-white" : "border border-purple-200 text-purple-700 hover:bg-purple-100"
            }`}
          >
            {ACTION_LABEL[a]}
          </a>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-2 rounded-card border border-dashed border-purple-200 bg-white py-12 text-center">
          <FileClock size={26} strokeWidth={1.8} className="text-purple-600" />
          <p className="text-[0.9rem] text-neutral-600">No matching audit entries yet.</p>
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-card border border-purple-200 bg-white shadow-subtle">
          <table className="w-full min-w-[620px] text-left">
            <thead>
              <tr className="border-b border-purple-200 text-dash-table-header text-neutral-600">
                <th className="px-4 py-3 font-600 sm:px-5">When</th>
                <th className="px-4 py-3 font-600">Action</th>
                <th className="px-4 py-3 font-600">Detail</th>
                <th className="px-4 py-3 font-600">By</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-purple-200/50 last:border-b-0">
                  <td className="whitespace-nowrap px-4 py-3 text-[0.8rem] text-neutral-600 sm:px-5">
                    {new Date(row.created_at).toLocaleString("en-NG", {
                      timeZone: "Africa/Lagos",
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[0.75rem] font-600 text-purple-700">
                      {ACTION_LABEL[row.action] ?? row.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[0.85rem] text-ink-950">{summarise(row)}</td>
                  <td className="px-4 py-3 text-[0.85rem] text-neutral-600">{row.actor ?? "System"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
