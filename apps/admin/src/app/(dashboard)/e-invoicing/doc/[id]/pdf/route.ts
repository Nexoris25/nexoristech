/**
 * Serve the official branded tax-invoice PDF for an NRS document. Only ever generated for an
 * NRS-ACCEPTED document (a legal invoice) - Draft, Rejected, or Cancelled documents return 403, so no
 * unofficial invoice can ever be issued. Generating the PDF logs a Download delivery. Admin only.
 */
import type { NextRequest } from "next/server";
import { db } from "../../../../../../lib/db.js";
import { getCurrentStaff } from "../../../../../../lib/auth.js";
import { DOC_META, docNumber, type DocType } from "../../../../../../lib/einvoice.js";
import { renderEinvoicePdf } from "../../../../../../lib/pdf/einvoice-pdf.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Doc {
  doc_type: DocType; seq: string; nrs_status: string; issue_date: string; due_date: string | null;
  customer_name: string; customer_tin: string | null; customer_email: string | null; customer_address: string | null;
  subtotal: string; vat: string; total: string; amount_paid: string; payment_terms: string | null;
  irn: string | null; qr_data: string | null; environment: string;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const staff = await getCurrentStaff();
  if (!staff || staff.role !== "admin") return new Response("Forbidden", { status: 403 });
  const { id } = await params;
  const pool = db();

  const doc = (await pool.query<Doc>(
    `SELECT doc_type, seq::text, nrs_status, issue_date::text, due_date::text, customer_name, customer_tin, customer_email,
            customer_address, subtotal::text, vat::text, total::text, amount_paid::text, payment_terms, irn, qr_data, environment
       FROM einvoice WHERE id=$1`, [id])).rows[0];
  if (!doc) return new Response("Not found", { status: 404 });
  // Compliance gate: an unofficial invoice must never be downloadable.
  if (doc.nrs_status !== "Accepted") return new Response("The official invoice is available only after NRS acceptance.", { status: 403 });

  const company = (await pool.query<{ legal_name: string; rc_number: string | null; tin: string | null; address: string; phone: string; email: string; website: string | null; payment_instructions: string | null }>(
    "SELECT legal_name, rc_number, tin, address, phone, email, website, payment_instructions FROM company_settings WHERE id=true")).rows[0]!;
  const lines = (await pool.query<{ description: string; quantity: string; unit_price: string; line_total: string; vat_applicable: boolean }>(
    "SELECT description, quantity::text, unit_price::text, line_total::text, vat_applicable FROM einvoice_line WHERE einvoice_id=$1 ORDER BY sort", [id])).rows;

  const total = Number(doc.total), paid = Number(doc.amount_paid);
  const pdf = await renderEinvoicePdf({
    docLabel: doc.doc_type === "Invoice" ? "Tax Invoice" : DOC_META[doc.doc_type].label,
    number: docNumber(doc.doc_type, doc.seq),
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
      "Content-Disposition": `inline; filename="${docNumber(doc.doc_type, doc.seq)}.pdf"`,
    },
  });
}
