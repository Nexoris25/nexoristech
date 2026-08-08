/**
 * Export the audit log as CSV (PRD 3.4). Read-only; the log itself is append-only and never mutated
 * by an export. Admin only. Streams the most recent entries with actor, action, entity, and timestamp.
 */
import { db } from "../../../../lib/db.js";
import { getCurrentStaff } from "../../../../lib/auth.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvCell(v: unknown): string {
  const s = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(): Promise<Response> {
  const staff = await getCurrentStaff();
  if (!staff || staff.role !== "admin") return new Response("Forbidden", { status: 403 });

  const { rows } = await db().query<{ created_at: string; actor: string | null; action: string; entity: string; entity_id: string | null; before: unknown; after: unknown }>(
    `SELECT a.created_at, s.name actor, a.action, a.entity, a.entity_id, a.before, a.after
       FROM audit_log a LEFT JOIN staff s ON s.id = a.actor_id ORDER BY a.created_at DESC LIMIT 5000`);

  const header = ["Timestamp", "Actor", "Action", "Entity", "Entity ID", "Before", "After"];
  const lines = [header.map(csvCell).join(",")];
  for (const r of rows) {
    lines.push([r.created_at, r.actor ?? "System", r.action, r.entity, r.entity_id, r.before, r.after].map(csvCell).join(","));
  }
  const body = lines.join("\r\n");
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="audit-log-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
