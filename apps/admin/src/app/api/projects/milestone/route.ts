/**
 * Add, update, complete, or remove a project milestone.
 *
 * A milestone is a stage of delivery that can be billed and can be finished, and those are two
 * different facts. Marking one Done says the work is delivered; it says nothing about whether it has
 * been invoiced or paid, and it deliberately does not touch either. Money moves through invoices.
 *
 * A milestone can be priced as a percentage of the contract or as a flat amount. When a percentage
 * is given the amount is derived from the project's contract value, in Decimal, so the figures on a
 * schedule always add up to the contract rather than drifting from it by a few kobo per stage.
 */
import type { NextRequest } from "next/server";
import Decimal from "decimal.js";
import { db } from "../../../../lib/db.js";
import { requireCapability } from "../../../../lib/auth.js";
import { decimalOrNull, MILESTONE_STATUSES } from "../../../../lib/projects.js";
import { isUuid } from "../../../../lib/route-params.js";
import { seeOther } from "../../../../lib/redirect.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = new Set<string>(MILESTONE_STATUSES);

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await requireCapability("finance.invoice.raise");
  const f = await request.formData();
  const projectId = String(f.get("project_id") ?? "").trim();
  const action = String(f.get("action") ?? "add");
  if (!isUuid(projectId)) return seeOther("/projects");

  const back = `/projects/${projectId}`;
  const bail = (error: string, msg?: string): Response =>
    seeOther(`${back}?error=${error}${msg ? `&msg=${encodeURIComponent(msg)}` : ""}`);

  const pool = db();
  const project = (
    await pool.query<{ contract_value: string }>(
      "SELECT contract_value::text FROM project WHERE id=$1",
      [projectId],
    )
  ).rows[0];
  if (!project) return seeOther("/projects");

  const milestoneId = String(f.get("milestone_id") ?? "").trim();

  if (action === "delete") {
    if (!isUuid(milestoneId)) return bail("milestone");
    // A milestone an invoice was raised against is part of that invoice's record and stays.
    const used = await pool.query("SELECT 1 FROM einvoice WHERE milestone_id=$1 LIMIT 1", [milestoneId]);
    if (used.rowCount) {
      return bail(
        "inuse",
        "An invoice was raised against this milestone, so it cannot be removed. Mark it Done or rename it instead.",
      );
    }
    await pool.query("DELETE FROM project_milestone WHERE id=$1 AND project_id=$2", [milestoneId, projectId]);
    return seeOther(back);
  }

  if (action === "status") {
    if (!isUuid(milestoneId)) return bail("milestone");
    const statusRaw = String(f.get("status") ?? "");
    if (!STATUSES.has(statusRaw)) return bail("status");
    await pool.query(
      `UPDATE project_milestone
          SET status=$1, completed_at = CASE WHEN $1 = 'Done' THEN now() ELSE NULL END
        WHERE id=$2 AND project_id=$3`,
      [statusRaw, milestoneId, projectId],
    );
    await pool
      .query(
        "INSERT INTO audit_log (actor_id, action, entity, entity_id, before, after) VALUES ($1,'milestone-status','project_milestone',$2,NULL,$3::jsonb)",
        [staff.id, milestoneId, JSON.stringify({ status: statusRaw })],
      )
      .catch(() => undefined);
    return seeOther(back);
  }

  // Add.
  const label = String(f.get("label") ?? "").trim();
  if (label.length === 0) return bail("label", "Give the milestone a name.");

  const pct = decimalOrNull(f.get("percent"));
  const typedAmount = decimalOrNull(f.get("amount"));
  const contract = decimalOrNull(project.contract_value) ?? new Decimal(0);

  if (pct !== null && (pct.lessThanOrEqualTo(0) || pct.greaterThan(100))) {
    return bail("percent", "A milestone percentage must be between 0 and 100.");
  }
  if (pct === null && typedAmount === null) {
    return bail("amount", "Give the milestone a percentage of the contract, or an amount.");
  }

  // A percentage wins when both are given: it is the figure that was agreed, and the amount is what
  // that percentage comes to at today's contract value.
  const amount =
    pct !== null
      ? contract.times(pct).div(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2)
      : typedAmount!.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);

  const sort = (
    await pool.query<{ n: number }>(
      "SELECT COALESCE(MAX(sort), -1) + 1 AS n FROM project_milestone WHERE project_id=$1",
      [projectId],
    )
  ).rows[0]!.n;

  await pool.query(
    `INSERT INTO project_milestone (project_id, label, percent, amount, due_date, sort)
     VALUES ($1,$2,$3::numeric,$4::numeric,$5,$6)`,
    [projectId, label, pct?.toFixed(3) ?? null, amount, String(f.get("due_date") ?? "") || null, sort],
  );

  return seeOther(back);
}
