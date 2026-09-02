/**
 * Server-side project and document-numbering queries.
 *
 * Kept out of `projects.ts` so that file stays importable from client components: everything here
 * touches the database.
 */
import type { PoolClient } from "pg";
import { db } from "./db.js";

/**
 * Take the next number in a series.
 *
 * `SELECT ... FOR UPDATE` holds the row for the rest of the transaction, so two invoices raised in
 * the same second queue rather than both reading the same number. It must therefore be called
 * inside a transaction; the client is passed in rather than taken from the pool to make that the
 * caller's decision and not an accident.
 */
export async function nextSeriesNumber(
  client: PoolClient,
  series: string,
): Promise<string> {
  const { rows } = await client.query<{ next_no: string }>(
    "SELECT next_no::text FROM document_series WHERE series = $1 FOR UPDATE",
    [series],
  );
  const current = rows[0]?.next_no;
  if (!current) {
    // A series nobody registered. Create it rather than fail: a document without a number is worse
    // than a series row that was not seeded.
    await client.query(
      "INSERT INTO document_series (series, next_no) VALUES ($1, 2) ON CONFLICT (series) DO NOTHING",
      [series],
    );
    return "1";
  }
  await client.query(
    "UPDATE document_series SET next_no = next_no + 1, updated_at = now() WHERE series = $1",
    [series],
  );
  return current;
}

export interface ProjectRollup {
  readonly project_id: string;
  readonly invoiced: string;
  readonly paid: string;
}

/**
 * What each project has been invoiced and paid.
 *
 * Cancelled invoices are excluded from both: they are not a claim on anybody, and counting them
 * would overstate the receivable. NRS status is deliberately not consulted — whether a document was
 * fiscalised is a tax question, not a question about whether the client owes us money.
 */
export async function projectRollups(
  projectIds: string[],
): Promise<Map<string, ProjectRollup>> {
  if (projectIds.length === 0) return new Map();
  const { rows } = await db().query<ProjectRollup>(
    `SELECT e.project_id,
            COALESCE(SUM(e.total), 0)::text       invoiced,
            COALESCE(SUM(e.amount_paid), 0)::text paid
       FROM einvoice e
      WHERE e.project_id = ANY($1::uuid[])
        AND e.doc_type = 'Invoice'
        AND e.cancelled_at IS NULL
      GROUP BY e.project_id`,
    [projectIds],
  );
  return new Map(rows.map((r) => [r.project_id, r]));
}

/**
 * The percentage of a project already committed to invoices, excluding one document.
 *
 * Excluding a document matters when editing: an invoice must not count its own percentage as
 * something previously billed and refuse to save itself.
 */
export async function percentAlreadyBilled(
  projectId: string,
  exceptInvoiceId?: string | null,
): Promise<string> {
  const { rows } = await db().query<{ billed: string }>(
    `SELECT COALESCE(SUM(invoice_percentage), 0)::text billed
       FROM einvoice
      WHERE project_id = $1
        AND doc_type = 'Invoice'
        AND cancelled_at IS NULL
        AND invoice_percentage IS NOT NULL
        AND ($2::uuid IS NULL OR id <> $2::uuid)`,
    [projectId, exceptInvoiceId ?? null],
  );
  return rows[0]?.billed ?? "0";
}

/** Generate the next project code, e.g. PRJ-0007. Sequential and readable, not an id. */
export async function nextProjectCode(client: PoolClient): Promise<string> {
  const { rows } = await client.query<{ n: string }>(
    `SELECT COALESCE(MAX(NULLIF(regexp_replace(code, '\\D', '', 'g'), '')::bigint), 0) + 1 AS n
       FROM project WHERE code ~ '^PRJ-[0-9]+$'`,
  );
  return `PRJ-${String(rows[0]?.n ?? "1").padStart(4, "0")}`;
}

export interface ProjectPortfolio {
  /** Projects being delivered right now: planned, active, or on hold. */
  readonly ongoing: number;
  readonly completed: number;
  readonly onHold: number;
  /**
   * The share of projects that reached Completed, out of those that have finished one way or the
   * other. Cancelled projects count as not completed, because they were started and did not finish;
   * excluding them would let a team improve this number by cancelling.
   */
  readonly completionRate: number;
  /** Mean delivery progress across the ongoing ones. Not a money figure and not derived from one. */
  readonly averageProgress: number;
  /** The contract value of everything still being delivered. */
  readonly ongoingValue: string;
}

/**
 * How the project portfolio stands, for the dashboards.
 *
 * One query behind all three screens, so the executive view, the CEO view and a person's own view
 * cannot quietly disagree about how many projects are running. Pass a staff id to narrow it to the
 * projects that person manages.
 *
 * Delivery progress is deliberately kept apart from money. A project can be fully invoiced and half
 * built, and a dashboard that inferred one from the other would hide exactly the case worth seeing.
 */
export async function projectPortfolio(managerId?: string | null): Promise<ProjectPortfolio> {
  const { rows } = await db().query<{
    ongoing: string; completed: string; on_hold: string; cancelled: string;
    avg_progress: string | null; ongoing_value: string;
  }>(
    `SELECT count(*) FILTER (WHERE status IN ('Planned','Active','OnHold'))::text            ongoing,
            count(*) FILTER (WHERE status = 'Completed')::text                                completed,
            count(*) FILTER (WHERE status = 'OnHold')::text                                   on_hold,
            count(*) FILTER (WHERE status = 'Cancelled')::text                                cancelled,
            avg(progress_percent) FILTER (WHERE status IN ('Planned','Active','OnHold'))::text avg_progress,
            COALESCE(sum(contract_value) FILTER (WHERE status IN ('Planned','Active','OnHold')), 0)::text ongoing_value
       FROM project
      WHERE ($1::uuid IS NULL OR manager_id = $1::uuid)`,
    [managerId ?? null],
  );
  const r = rows[0]!;
  const completed = Number(r.completed);
  const finished = completed + Number(r.cancelled);
  return {
    ongoing: Number(r.ongoing),
    completed,
    onHold: Number(r.on_hold),
    completionRate: finished > 0 ? Math.round((completed / finished) * 100) : 0,
    averageProgress: r.avg_progress === null ? 0 : Math.round(Number(r.avg_progress)),
    ongoingValue: r.ongoing_value,
  };
}
