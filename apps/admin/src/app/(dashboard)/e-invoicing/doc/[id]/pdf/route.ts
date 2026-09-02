/**
 * Serve the branded invoice PDF.
 *
 * This used to refuse anything the NRS had not accepted, on the reasoning that no unofficial invoice
 * should ever be issued. That reasoning holds for the words "Tax Invoice" and it does not hold for
 * the document: most invoices here are ordinary PDF invoices that are never filed, and a system that
 * cannot produce one cannot bill anybody. So the gate moved from whether the document is fiscal to
 * whether it has been issued at all, and what changes with fiscal status is what the page says it is.
 *
 * A document the NRS has accepted is headed "Tax Invoice" and carries its IRN. One that has not is
 * headed "Invoice" and says plainly that it is not a tax invoice, so the two can never be mistaken
 * for each other. A draft is still refused: it is not an invoice yet.
 */
import type { NextRequest } from "next/server";
import { db } from "../../../../../../lib/db.js";
import { getFiscalStaff } from "../../../../../../lib/fiscal/permissions.js";
import { DOC_META, docNumber, type DocType } from "../../../../../../lib/einvoice.js";
import { renderEinvoicePdf } from "../../../../../../lib/pdf/einvoice-pdf.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Doc {
  doc_type: DocType; seq: string; nrs_status: string; issue_date: string; due_date: string | null;
  series: string | null; series_no: string | null; fiscal_required: boolean; vat_charged: boolean;
  lifecycle_status: string; cancelled_at: string | null;
  project_name: string | null; invoice_percentage: string | null;
  customer_name: string; customer_tin: string | null; customer_email: string | null; customer_address: string | null;
  subtotal: string; vat: string; total: string; amount_paid: string; payment_terms: string | null;
  irn: string | null; qr_data: string | null; environment: string;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const staff = await getFiscalStaff("INVOICE_VIEW");
  if (!staff) return new Response("Forbidden", { status: 403 });
  const { id } = await params;
  const pool = db();

  const doc = (await pool.query<Doc>(
    `SELECT doc_type, seq::text, nrs_status, issue_date::text, due_date::text, customer_name, customer_tin, customer_email,
            customer_address, subtotal::text, vat::text, total::text, amount_paid::text, payment_terms, irn, qr_data, environment,
            series, series_no::text, fiscal_required, vat_charged, lifecycle_status, cancelled_at,
            project_name, invoice_percentage::text
       FROM einvoice WHERE id=$1`, [id])).rows[0];
  if (!doc) return new Response("Not found", { status: 404 });
  // A draft is not an invoice yet. Everything issued can be produced, fiscal or not.
  if (doc.doc_type === "Invoice" && doc.lifecycle_status === "Draft") {
    return new Response("Finalize this invoice before producing its PDF.", { status: 403 });
  }

  const company = (await pool.query<{ legal_name: string; rc_number: string | null; tin: string | null; address: string; phone: string; email: string; website: string | null; payment_instructions: string | null }>(
    "SELECT legal_name, rc_number, tin, address, phone, email, website, payment_instructions FROM company_settings WHERE id=true")).rows[0]!;
  const lines = (await pool.query<{ description: string; quantity: string; unit_price: string; line_total: string; vat_applicable: boolean }>(
    "SELECT description, quantity::text, unit_price::text, line_total::text, vat_applicable FROM einvoice_line WHERE einvoice_id=$1 ORDER BY sort", [id])).rows;

  const total = Number(doc.total), paid = Number(doc.amount_paid);
  const pdf = await renderEinvoicePdf({
    // "Tax Invoice" is reserved for a document the NRS has actually accepted.
    docLabel:
      doc.doc_type === "Invoice"
        ? doc.nrs_status === "Accepted"
          ? "Tax Invoice"
          : "Invoice"
        : DOC_META[doc.doc_type].label,
    number: docNumber(doc.doc_type, doc.seq, doc.series, doc.series_no),
    isTaxInvoice: doc.nrs_status === "Accepted",
    vatCharged: doc.vat_charged,
    cancelled: Boolean(doc.cancelled_at),
    projectName: doc.project_name,
    invoicePercentage: doc.invoice_percentage,
    issueDate: doc.issue_date, dueDate: doc.due_date,
    irn: doc.irn, qrData: doc.qr_data, environment: doc.environment,
    customer: { name: doc.customer_name, tin: doc.customer_tin, email: doc.customer_email, address: doc.customer_address },
    lines: lines.map((l) => ({ description: l.description, quantity: Number(l.quantity), unitPrice: Number(l.unit_price), lineTotal: Number(l.line_total), vatApplicable: l.vat_applicable })),
    subtotal: Number(doc.subtotal), vat: Number(doc.vat), total, amountPaid: paid, outstanding: Math.max(0, total - paid),
    paymentTerms: doc.payment_terms,
    company: { legalName: company.legal_name, rcNumber: company.rc_number, tin: company.tin, address: company.address, phone: company.phone, email: company.email, website: company.website, paymentInstructions: company.payment_instructions },
  });

  await pool.query("INSERT INTO einvoice_delivery (einvoice_id, channel, created_by) VALUES ($1,'Download',$2)", [id, staff.id]).catch(() => undefined);

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${docNumber(doc.doc_type, doc.seq, doc.series, doc.series_no)}.pdf"`,
    },
  });
}
