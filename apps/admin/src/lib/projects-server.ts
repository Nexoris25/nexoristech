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
