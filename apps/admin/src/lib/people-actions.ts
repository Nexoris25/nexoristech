"use server";
/**
 * People management and assignment (PRD 2.3, 2.5). Admin-only: add and deactivate staff, and
 * assign or reassign leads (manually or auto by industry affinity and capacity). Deactivating a
 * salesperson preserves history and returns their open leads to the admin queue (unassigned).
 * Every change writes an immutable audit row.
 */
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import type pg from "pg";
import { db } from "./db.js";
import { requireAdmin } from "./auth.js";
import { chooseAssignee, type AssigneeCandidate } from "./assign.js";
import { ROLES, type Role, type StaffFormState } from "./crm-constants.js";
import { securityPolicy, passwordProblem } from "./security-policy.js";

async function audit(
  pool: pg.Pool,
  actorId: string,
  action: string,
  entity: string,
  entityId: string,
  before: unknown,
  after: unknown,
): Promise<void> {
  await pool.query(
    `INSERT INTO audit_log (actor_id, action, entity, entity_id, before, after)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb)`,
    [actorId, action, entity, entityId, JSON.stringify(before), JSON.stringify(after)],
  );
}

export async function addStaff(
  _prev: StaffFormState,
  formData: FormData,
): Promise<StaffFormState> {
  const admin = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "salesperson") as Role;
  const industries = String(formData.get("industries") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const capacityRaw = String(formData.get("capacityCap") ?? "").trim();
  const capacityCap = capacityRaw ? Number.parseInt(capacityRaw, 10) : null;

  if (!name || !email) return { error: "Name and email are required." };
  const weak = passwordProblem(password, await securityPolicy());
  if (weak) return { error: weak };
  if (!ROLES.includes(role)) return { error: "Choose a valid role." };

  const pool = db();
  const exists = await pool.query("SELECT 1 FROM staff WHERE email = $1", [
    email,
  ]);
  if ((exists.rowCount ?? 0) > 0) {
    return { error: "A staff member with that email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO staff (name, email, password_hash, role, industries, capacity_cap)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [name, email, passwordHash, role, industries, capacityCap],
  );
  await audit(pool, admin.id, "create", "staff", rows[0]?.id ?? "", null, {
    name,
    email,
    role,
  });

  revalidatePath("/settings/access");
  return { ok: true };
}

export async function deactivateStaff(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const staffId = String(formData.get("staffId") ?? "");
  if (!staffId) return;

  const pool = db();
  await pool.query("UPDATE staff SET active = false WHERE id = $1", [staffId]);
  // Open leads return to the admin queue (PRD 2.5).
  await pool.query(
    `UPDATE lead SET assigned_to = NULL
      WHERE assigned_to = $1 AND status NOT IN ('Won', 'Lost')`,
    [staffId],
  );
  await audit(pool, admin.id, "deactivate", "staff", staffId, { active: true }, {
    active: false,
  });
  revalidatePath("/settings/access");
}

export async function assignLead(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const leadId = String(formData.get("leadId") ?? "");
  const staffId = String(formData.get("staffId") ?? "").trim() || null;
  if (!leadId) return;

  const pool = db();
  const { rows } = await pool.query<{ assigned_to: string | null }>(
    "SELECT assigned_to FROM lead WHERE id = $1",
    [leadId],
  );
  const before = rows[0]?.assigned_to ?? null;
  await pool.query("UPDATE lead SET assigned_to = $1 WHERE id = $2", [
    staffId,
    leadId,
  ]);
  await audit(pool, admin.id, "assign", "lead", leadId, { assignedTo: before }, {
    assignedTo: staffId,
  });
  await pool.query(
    `INSERT INTO lead_activity (lead_id, actor_id, type, note)
     VALUES ($1, $2, 'assignment', $3)`,
    [leadId, admin.id, staffId ? "Lead assigned." : "Lead unassigned."],
  );
  revalidatePath(`/crm/${leadId}`);
  revalidatePath("/crm");
}

export async function autoAssignLead(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const leadId = String(formData.get("leadId") ?? "");
  if (!leadId) return;

  const pool = db();
  const { rows: leadRows } = await pool.query<{ finder: { industry?: string } | null }>(
    "SELECT finder FROM lead WHERE id = $1",
    [leadId],
  );
  const leadIndustry = leadRows[0]?.finder?.industry;

  const { rows: candidates } = await pool.query<{
    id: string;
    industries: string[];
    capacity_cap: number | null;
    open_count: string;
  }>(
    `SELECT s.id, s.industries, s.capacity_cap,
            count(l.id) FILTER (WHERE l.status NOT IN ('Won', 'Lost'))::text AS open_count
       FROM staff s
       LEFT JOIN lead l ON l.assigned_to = s.id
      WHERE s.active = true AND s.role = 'salesperson'
      GROUP BY s.id`,
  );

  const chosen = chooseAssignee(
    candidates.map<AssigneeCandidate>((c) => ({
      id: c.id,
      industries: c.industries,
      openCount: Number.parseInt(c.open_count, 10),
      capacityCap: c.capacity_cap,
    })),
    leadIndustry,
  );
  if (!chosen) return;

  await pool.query("UPDATE lead SET assigned_to = $1 WHERE id = $2", [
    chosen,
    leadId,
  ]);
  await audit(pool, admin.id, "auto-assign", "lead", leadId, null, {
    assignedTo: chosen,
  });
  await pool.query(
    `INSERT INTO lead_activity (lead_id, actor_id, type, note)
     VALUES ($1, $2, 'assignment', 'Auto-assigned by industry affinity and capacity.')`,
    [leadId, admin.id],
  );
  revalidatePath(`/crm/${leadId}`);
  revalidatePath("/crm");
}
