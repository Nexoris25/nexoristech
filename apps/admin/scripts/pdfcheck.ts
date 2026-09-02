/**
 * Render the newest invoice's PDF to a file, so its layout and wording can be checked without a
 * browser session.
 *
 * The invoice PDF is the document a client actually receives, and the difference between an invoice
 * and a filed tax invoice is carried entirely by what the page says. That is worth being able to
 * read directly rather than inferring from the code.
 *
 * Run with: pnpm --filter @nexoris/admin pdf:check [outfile]
 *
 * Needs the automatic JSX runtime, which the app's own tsconfig does not use (Next compiles it),
 * hence the dedicated tsconfig beside this file.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";
import { renderEinvoicePdf } from "../src/lib/pdf/einvoice-pdf.js";
import { docNumber, DOC_META, type DocType } from "../src/lib/einvoice.js";

const here = dirname(fileURLToPath(import.meta.url));

/** Same precedence as the migration runner: real environment, then the repo .env, then .env.local. */
function loadLocalEnv(): void {
  for (const file of [join(here, "..", "..", "..", ".env"), join(here, "..", ".env.local")]) {
    try {
      process.loadEnvFile(file);
    } catch {
      // Not on disk; try the next one, then fall back to the real environment.
    }
  }
}

interface DocRow {
  doc_type: DocType; seq: string; nrs_status: string; issue_date: string; due_date: string | null;
  customer_name: string; customer_tin: string | null; customer_email: string | null; customer_address: string | null;
  subtotal: string; vat: string; total: string; amount_paid: string; payment_terms: string | null;
  irn: string | null; qr_data: string | null; environment: string;
  series: string | null; series_no: string | null; vat_charged: boolean;
  cancelled_at: string | null; project_name: string | null; invoice_percentage: string | null;
}

loadLocalEnv();
const connectionString = process.env.DATABASE_URL_ADMIN;
if (!connectionString) {
  console.error("DATABASE_URL_ADMIN is not set.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });
const doc = (
  await pool.query<DocRow>(
    `SELECT doc_type, seq::text, nrs_status, issue_date::text, due_date::text, customer_name,
            customer_tin, customer_email, customer_address, subtotal::text, vat::text, total::text,
            amount_paid::text, payment_terms, irn, qr_data, environment,
            series, series_no::text, vat_charged, cancelled_at, project_name, invoice_percentage::text
       FROM einvoice ORDER BY created_at DESC LIMIT 1`,
  )
).rows[0];
if (!doc) {
  console.error("There are no documents to render.");
  process.exit(1);
}

const company = (
  await pool.query<{
    legal_name: string; rc_number: string | null; tin: string | null; address: string;
    phone: string; email: string; website: string | null; payment_instructions: string | null;
    bank_accounts: { accountName: string; accountNumber: string; bank: string }[] | null;
  }>(
    "SELECT legal_name, rc_number, tin, address, phone, email, website, payment_instructions, bank_accounts FROM company_settings WHERE id=true",
  )
).rows[0]!;

const lines = (
  await pool.query<{ description: string; quantity: string; unit_price: string; line_total: string; vat_applicable: boolean }>(
    `SELECT description, quantity::text, unit_price::text, line_total::text, vat_applicable
       FROM einvoice_line WHERE einvoice_id = (SELECT id FROM einvoice ORDER BY created_at DESC LIMIT 1)
      ORDER BY sort`,
  )
).rows;

const isTaxInvoice = doc.nrs_status === "Accepted";
const total = Number(doc.total);
const paid = Number(doc.amount_paid);

const pdf = await renderEinvoicePdf({
  docLabel: doc.doc_type === "Invoice" ? (isTaxInvoice ? "Tax Invoice" : "Invoice") : DOC_META[doc.doc_type].label,
  number: docNumber(doc.doc_type, doc.seq, doc.series, doc.series_no),
  issueDate: doc.issue_date,
  dueDate: doc.due_date,
  irn: doc.irn,
  qrData: doc.qr_data,
  environment: doc.environment,
  isTaxInvoice,
  vatCharged: doc.vat_charged,
  cancelled: Boolean(doc.cancelled_at),
  projectName: doc.project_name,
  invoicePercentage: doc.invoice_percentage,
  customer: { name: doc.customer_name, tin: doc.customer_tin, email: doc.customer_email, address: doc.customer_address },
  lines: lines.map((l) => ({
    description: l.description,
    quantity: Number(l.quantity),
    unitPrice: Number(l.unit_price),
    lineTotal: Number(l.line_total),
    vatApplicable: l.vat_applicable,
  })),
  subtotal: Number(doc.subtotal),
  vat: Number(doc.vat),
  total,
  amountPaid: paid,
  outstanding: Math.max(0, total - paid),
  paymentTerms: doc.payment_terms,
  company: {
    legalName: company.legal_name, rcNumber: company.rc_number, tin: company.tin, address: company.address,
    phone: company.phone, email: company.email, website: company.website, paymentInstructions: company.payment_instructions,
    bankAccounts: Array.isArray(company.bank_accounts) ? company.bank_accounts : [],
  },
});

const out = process.argv[2] ?? `${docNumber(doc.doc_type, doc.seq, doc.series, doc.series_no)}.pdf`;
writeFileSync(out, pdf);
console.log(`Wrote ${out} (${pdf.length} bytes) for ${docNumber(doc.doc_type, doc.seq, doc.series, doc.series_no)}.`);
await pool.end();
