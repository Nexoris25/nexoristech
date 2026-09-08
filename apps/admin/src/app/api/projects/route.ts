/**
 * Create and update a project, and create the client it belongs to.
 *
 * A project is the thing invoices hang off: percentage billing takes its percentage of this
 * contract value, and the money rolled up on the project detail screen is the invoices that point
 * at this row. Before it existed the same facts were free text repeated on every invoice, so two
 * invoices belonged to the same project only if somebody typed the name identically twice.
 *
 * The client is created here too when a new name is typed, rather than behind its own screen, so
 * raising the first project for a customer is one form and not two.
 */
import type { NextRequest } from "next/server";
import type { PoolClient } from "pg";
import { db } from "../../../lib/db.js";
import { requireCapability } from "../../../lib/auth.js";
import { decimalOrNull, PROJECT_STATUSES, type ProjectStatus } from "../../../lib/projects.js";
import { nextProjectCode } from "../../../lib/projects-server.js";
import { isUuid } from "../../../lib/route-params.js";
import { seeOther } from "../../../lib/redirect.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = new Set<string>(PROJECT_STATUSES);

/** Money from a form: a Decimal string, or "0" when nothing usable was typed. */
function moneyField(value: unknown): string {
  return decimalOrNull(value)?.toFixed(2) ?? "0.00";
}

/**
 * The client for this project: an existing one by id, or a new one from the typed name.
 *
 * Matching an existing client on name is deliberate and case-insensitive. Somebody typing a
 * customer they have invoiced before should get that customer, not a second row that splits their
 * history in half.
 */
async function resolveClient(
  client: PoolClient,
  f: FormData,
  staffId: string,
): Promise<string | null> {
  const existing = String(f.get("client_id") ?? "").trim();
  if (existing && isUuid(existing)) return existing;

  const name = String(f.get("client_name") ?? "").trim();
  if (name.length === 0) return null;

  const found = await client.query<{ id: string }>(
    "SELECT id FROM client WHERE lower(name) = lower($1)",
    [name],
  );
  if (found.rows[0]) return found.rows[0].id;

  const created = await client.query<{ id: string }>(
    `INSERT INTO client (name, contact_name, email, phone, address, tin, rc_number, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [
      name,
      String(f.get("client_contact_name") ?? "").trim() || null,
      String(f.get("client_email") ?? "").trim() || null,
      String(f.get("client_phone") ?? "").trim() || null,
      String(f.get("client_address") ?? "").trim() || null,
      String(f.get("client_tin") ?? "").trim() || null,
      String(f.get("client_rc") ?? "").trim() || null,
      staffId,
    ],
  );
  return created.rows[0]!.id;
}

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await requireCapability("finance.invoice.raise");
  const f = await request.formData();
  const id = String(f.get("id") ?? "").trim();
  const editing = id.length > 0 && isUuid(id);
  const backTo = editing ? `/projects/${id}` : "/projects/new";
  const bail = (error: string, msg?: string): Response =>
    seeOther(`${backTo}?error=${error}${msg ? `&msg=${encodeURIComponent(msg)}` : ""}`);

  const name = String(f.get("name") ?? "").trim();
  if (name.length === 0) return bail("name", "Give the project a name.");

  const statusRaw = String(f.get("status") ?? "Planned");
  const status: ProjectStatus = (STATUSES.has(statusRaw) ? statusRaw : "Planned") as ProjectStatus;

  const managerRaw = String(f.get("manager_id") ?? "").trim();
  const managerId = isUuid(managerRaw) ? managerRaw : null;

  const progress = decimalOrNull(f.get("progress_percent")) ?? null;
  if (progress && (progress.lessThan(0) || progress.greaterThan(100))) {
    return bail("progress", "Progress must be between 0 and 100.");
  }

  const pool = db();
  const client = await pool.connect();
  let projectId = id;
  try {
    await client.query("BEGIN");
    const clientId = await resolveClient(client, f, staff.id);
    if (!clientId && !editing) {
      await client.query("ROLLBACK");
      return bail("client", "Choose a client, or type a new client name.");
    }

    if (editing) {
      await client.query(
        `UPDATE project SET name=$1, description=$2, contract_value=$3::numeric, status=$4,
              start_date=$5, end_date=$6, progress_percent=$7::numeric, service_line=$8,
              client_id=COALESCE($9, client_id), manager_id=$11, updated_at=now()
         WHERE id=$10`,
        [
          name,
          String(f.get("description") ?? "").trim() || null,
          moneyField(f.get("contract_value")),
          status,
          String(f.get("start_date") ?? "") || null,
          String(f.get("end_date") ?? "") || null,
          (progress ?? decimalOrNull("0"))!.toFixed(2),
          String(f.get("service_line") ?? "").trim() || null,
          clientId,
          id,
          managerId,
        ],
      );
    } else {
      const code = String(f.get("code") ?? "").trim() || (await nextProjectCode(client));
      const created = await client.query<{ id: string }>(
        `INSERT INTO project (code, name, client_id, description, contract_value, status,
              start_date, end_date, progress_percent, service_line, created_by, manager_id)
         VALUES ($1,$2,$3,$4,$5::numeric,$6,$7,$8,$9::numeric,$10,$11,$12) RETURNING id`,
        [
          code,
          name,
          clientId,
          String(f.get("description") ?? "").trim() || null,
          moneyField(f.get("contract_value")),
          status,
          String(f.get("start_date") ?? "") || null,
          String(f.get("end_date") ?? "") || null,
          (progress ?? decimalOrNull("0"))!.toFixed(2),
          String(f.get("service_line") ?? "").trim() || null,
          staff.id,
          managerId,
        ],
      );
      projectId = created.rows[0]!.id;
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    const message = error instanceof Error ? error.message : "";
    // A duplicate project code is somebody's typo, not a server fault, so it reads as one.
    if (message.includes("project_code_key")) {
      return bail("code", "A project already uses that code.");
    }
    throw error;
  } finally {
    client.release();
  }

  await pool
    .query(
      "INSERT INTO audit_log (actor_id, action, entity, entity_id, before, after) VALUES ($1,$2,'project',$3,NULL,$4::jsonb)",
      [staff.id, editing ? "project-updated" : "project-created", projectId, JSON.stringify({ name, status })],
    )
    .catch(() => undefined);

  return seeOther(`/projects/${projectId}`);
}
