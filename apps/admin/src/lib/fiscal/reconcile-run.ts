/**
 * Runs reconciliation over the ledger.
 *
 * Reads only. Nothing here writes a fiscal field — the checks report what disagrees and a person decides
 * what to do about it, because every correction has a tax consequence.
 *
 * The provider comparison runs only when an adapter is configured. Without one, the internal checks still
 * run and are worth running: they catch impossible states regardless of who we can talk to.
 */
import { db } from "../db.js";
import { fiscalAdapter } from "./provider.js";
import { docNumber, type DocType } from "../einvoice.js";
import { reconcileDocument, findDuplicateIrns, compareWithProvider, type Discrepancy, type ReconcileInput } from "./reconciliation.js";

interface Row {
  id: string; doc_type: DocType; seq: string; nrs_status: string; irn: string | null; submission_ref: string | null;
  subtotal: string; vat: string; total: string; vat_rate: string | null;
  attempt_count: string; accepted_attempts: string;
}
interface LineRow { einvoice_id: string; line_total: string; vat_applicable: boolean }

export interface ReconcileReport {
  checked: number;
  providerChecked: number;
  discrepancies: Discrepancy[];
  providerConfigured: boolean;
}

export async function runReconciliation(limit = 500): Promise<ReconcileReport> {
  const pool = db();
  const adapter = fiscalAdapter();

  const { rows } = await pool.query<Row>(
    `SELECT e.id, e.doc_type, e.seq::text, e.nrs_status, e.irn, e.submission_ref,
            e.subtotal::text, e.vat::text, e.total::text, r.rate::text AS vat_rate,
            (SELECT count(*) FROM fiscal_submission s WHERE s.einvoice_id = e.id)::text AS attempt_count,
            (SELECT count(*) FROM fiscal_submission s WHERE s.einvoice_id = e.id AND s.outcome='accepted')::text AS accepted_attempts
       FROM einvoice e LEFT JOIN tax_rule r ON r.id = e.vat_rule_id
      ORDER BY e.seq DESC LIMIT $1`, [limit]);

  const ids = rows.map((r) => r.id);
  const linesByDoc = new Map<string, { lineTotal: string; vatApplicable: boolean }[]>();
  if (ids.length > 0) {
    const { rows: lines } = await pool.query<LineRow>(
      "SELECT einvoice_id, line_total::text, vat_applicable FROM einvoice_line WHERE einvoice_id = ANY($1::uuid[])", [ids]);
    for (const l of lines) {
      const list = linesByDoc.get(l.einvoice_id) ?? [];
      list.push({ lineTotal: l.line_total, vatApplicable: l.vat_applicable });
      linesByDoc.set(l.einvoice_id, list);
    }
  }

  const discrepancies: Discrepancy[] = [];
  const identities = rows.map((r) => ({ einvoiceId: r.id, reference: docNumber(r.doc_type, r.seq), irn: r.irn }));

  for (const r of rows) {
    const input: ReconcileInput = {
      einvoiceId: r.id,
      reference: docNumber(r.doc_type, r.seq),
      nrsStatus: r.nrs_status,
      irn: r.irn,
      submissionRef: r.submission_ref,
      subtotal: r.subtotal, vat: r.vat, total: r.total,
      lines: linesByDoc.get(r.id) ?? [],
      vatRate: r.vat_rate,
      attemptCount: Number(r.attempt_count),
      hasAcceptedAttempt: Number(r.accepted_attempts) > 0,
    };
    discrepancies.push(...reconcileDocument(input));
  }

  discrepancies.push(...findDuplicateIrns(identities));

  // Only accepted documents have anything for the authority to have an opinion about.
  let providerChecked = 0;
  if (adapter.configured) {
    for (const r of rows) {
      if (r.nrs_status !== "Accepted" || !r.irn) continue;
      const status = await adapter.checkStatus(r.irn);
      providerChecked += 1;
      discrepancies.push(...compareWithProvider(
        { einvoiceId: r.id, reference: docNumber(r.doc_type, r.seq), nrsStatus: r.nrs_status, irn: r.irn },
        status));
    }
  }

  // Critical first: an impossible fiscal state matters more than a rate that cannot be explained.
  discrepancies.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "critical" ? -1 : 1));

  return { checked: rows.length, providerChecked, discrepancies, providerConfigured: adapter.configured };
}
