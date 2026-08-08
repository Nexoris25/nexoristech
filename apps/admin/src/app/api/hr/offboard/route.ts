/**
 * Offboard an employee (PRD 7.5, 7.10). Records the last working day, exit reason, and the final
 * settlement flag for Payroll (8.5), and sets status to Exited. History is preserved, never hard
 * deleted; the shared access model revokes module grants off the same status change. HR Admin only.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "../../../../lib/db.js";
import { getCurrentStaff } from "../../../../lib/auth.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getCurrentStaff();
  const f = await request.formData();
  const id = String(f.get("id") ?? "");
  if (!staff || staff.role !== "admin" || !id) {
    return NextResponse.redirect(new URL("/people", request.url), { status: 303 });
  }
  const pool = db();
  await pool.query(
    `UPDATE employee SET employment_status='Exited', last_working_day=$1, exit_reason=$2,
            final_settlement=$3, updated_at=now() WHERE id=$4`,
    [String(f.get("last_working_day") ?? "") || null, String(f.get("exit_reason") ?? "").trim() || null,
      f.get("final_settlement") === "on", id],
  );
  // Deactivation is one action with platform-wide effect (PRD 3.3): revoke access grants.
  const { rows } = await pool.query<{ staff_id: string | null }>("SELECT staff_id FROM employee WHERE id=$1", [id]);
  if (rows[0]?.staff_id) {
    await pool.query("DELETE FROM module_access WHERE staff_id=$1", [rows[0].staff_id]);
    await pool.query("UPDATE staff SET active=false WHERE id=$1", [rows[0].staff_id]);
  }
  await pool.query(
    `INSERT INTO audit_log (actor_id, action, entity, entity_id, before, after) VALUES ($1,'offboard','employee',$2,NULL,$3::jsonb)`,
    [staff.id, id, JSON.stringify({ exit: String(f.get("exit_reason") ?? "") })],
  );
  return NextResponse.redirect(new URL(`/people/${id}`, request.url), { status: 303 });
}
