/**
 * Export NRS documents as CSV (PRD 15) for the Compliance Reports screen. Read-only. Admin only.
 * Streams every document with its type, customer, totals, status, and IRN.
 */
import { db } from "../../../../lib/db.js";
import { getFiscalStaff } from "../../../../lib/fiscal/permissions.js";
import { DOC_META, docNumber, type DocType } from "../../../../lib/einvoice.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(): Promise<Response> {
  const staff = await getFiscalStaff("INVOICE_VIEW");
  if (!staff) return new Response("Forbidden", { status: 403 });

  const { rows } = await db().query<{ doc_type: DocType; seq: string; customer_name: string; customer_tin: string | null; issue_date: string; total: string; nrs_status: string; irn: string | null }>(
    "SELECT doc_type, seq::text, customer_name, customer_tin, issue_date::text, total::text, nrs_status, irn FROM einvoice ORDER BY created_at DESC LIMIT 10000");

  const header = ["Number", "Type", "Customer", "Customer TIN", "Issue Date", "Total", "Status", "IRN"];
  const lines = [header.map(cell).join(",")];
  for (const r of rows) {
    lines.push([docNumber(r.doc_type, r.seq), DOC_META[r.doc_type].label, r.customer_name, r.customer_tin, r.issue_date, r.total, r.nrs_status, r.irn].map(cell).join(","));
  }
  return new Response(lines.join("\r\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="nrs-documents-${new Date().toISOString().slice(0, 10)}.csv"` },
  });
}
