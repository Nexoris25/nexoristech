"use server";
/**
 * The salesperson reassignment request flow (PRD 5.4). A salesperson who owns a lead may request it
 * be reassigned, with a reason. A CRM Admin approves or declines. Approval hands the lead back to
 * the reassignment queue (unassigned) for a fresh owner decision; declining leaves ownership as is.
 * Reassignment itself stays Admin-only. Every step writes to the shared platform audit log.
 */
import { revalidatePath } from "next/cache";
import { db } from "./db.js";
import { requireStaff, requireAdmin } from "./auth.js";
import { type ReassignState } from "./crm-constants.js";

/** A salesperson requests that a lead they own be reassigned. */
export async function requestReassignment(
  _prev: ReassignState,
  formData: FormData,
): Promise<ReassignState> {
  const staff = await requireStaff();
  if (staff.role === "viewer") {
    return { error: "Viewers cannot request reassignment." };
  }
  const leadId = String(formData.get("leadId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!leadId) return { error: "Missing lead." };
  if (reason.length < 4) {
    return { error: "Give a short reason so the admin can decide." };
  }

  const pool = db();
  const { rows } = await pool.query<{ assigned_to: string | null; status: string }>(
    "SELECT assigned_to, status FROM lead WHERE id = $1",
    [leadId],
  );
  const lead = rows[0];
  if (!lead) return { error: "That lead no longer exists." };
  // A salesperson may only request reassignment of a lead they actually own. An admin can always
  // reassign directly, so they have no need to request.
  if (staff.role === "salesperson" && lead.assigned_to !== staff.id) {
    return { error: "You can only request reassignment of your own leads." };
  }
  if (lead.status === "Won" || lead.status === "Lost") {
    return { error: "A closed lead does not need reassigning." };
  }

  const existing = await pool.query(
    "SELECT 1 FROM reassignment_request WHERE lead_id = $1 AND status = 'pending'",
    [leadId],
  );
  if ((existing.rowCount ?? 0) > 0) {
    return { error: "There is already an open request for this lead." };
  }

  await pool.query(
    `INSERT INTO reassignment_request (lead_id, requested_by, reason)
     VALUES ($1, $2, $3)`,
    [leadId, staff.id, reason],
  );
  await pool.query(
    `INSERT INTO audit_log (actor_id, action, entity, entity_id, before, after)
     VALUES ($1, 'reassign-request', 'lead', $2, NULL, $3::jsonb)`,
    [staff.id, leadId, JSON.stringify({ reason })],
  );
  await pool.query(
    `INSERT INTO lead_activity (lead_id, actor_id, type, note)
     VALUES ($1, $2, 'reassign-request', $3)`,
    [leadId, staff.id, `Requested reassignment: ${reason}`],
  );

  revalidatePath(`/crm/${leadId}`);
  revalidatePath("/crm/reassignment");
  return { ok: true };
}

/** A CRM Admin approves or declines a pending reassignment request. */
export async function decideReassignment(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const requestId = String(formData.get("requestId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!requestId || (decision !== "approved" && decision !== "declined")) return;

  const pool = db();
  const { rows } = await pool.query<{ lead_id: string; status: string }>(
    "SELECT lead_id, status FROM reassignment_request WHERE id = $1",
    [requestId],
  );
  const request = rows[0];
  if (!request || request.status !== "pending") return;

  await pool.query(
    "UPDATE reassignment_request SET status = $1, decided_by = $2, decided_at = now() WHERE id = $3",
    [decision, admin.id, requestId],
  );

  if (decision === "approved") {
    // Hand the lead back to the queue for a new owner decision. Reassignment stays Admin-only.
    await pool.query(
      "UPDATE lead SET assigned_to = NULL WHERE id = $1 AND status NOT IN ('Won', 'Lost')",
      [request.lead_id],
    );
    await pool.query(
      `INSERT INTO lead_activity (lead_id, actor_id, type, note)
       VALUES ($1, $2, 'assignment', 'Reassignment approved; returned to the queue for a new owner.')`,
      [request.lead_id, admin.id],
    );
  } else {
    await pool.query(
      `INSERT INTO lead_activity (lead_id, actor_id, type, note)
       VALUES ($1, $2, 'reassign-request', 'Reassignment request declined; ownership unchanged.')`,
      [request.lead_id, admin.id],
    );
  }

  await pool.query(
    `INSERT INTO audit_log (actor_id, action, entity, entity_id, before, after)
     VALUES ($1, 'reassign-decision', 'lead', $2, NULL, $3::jsonb)`,
    [admin.id, request.lead_id, JSON.stringify({ decision })],
  );

  revalidatePath("/crm/reassignment");
  revalidatePath(`/crm/${request.lead_id}`);
}
