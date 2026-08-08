/**
 * Create an NRS document (PRD 15): an e-invoice, credit note, or debit note. The server recomputes
 * every total from the lines with the shared VAT rate - the browser's figures are never trusted - and
 * writes a Draft. Credit and debit notes carry the original document they adjust and a reason. The
 * document is submitted to the NRS from its detail screen, never on creation.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "../../../lib/db.js";
import { getFiscalStaff } from "../../../lib/fiscal/permissions.js";
import Decimal from "decimal.js";
import { calculateTax, type TaxLineInput } from "../../../lib/fiscal/tax-engine.js";
import { rulesForDate } from "../../../lib/fiscal/rules.js";
import { DOC_META } from "../../../lib/einvoice.js";
import type { DocType } from "../../../lib/einvoice.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES: DocType[] = ["Invoice", "CreditNote", "DebitNote"];

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getFiscalStaff("INVOICE_CREATE");
  const f = await request.formData();
  const docType = (TYPES.includes(String(f.get("doc_type")) as DocType) ? String(f.get("doc_type")) : "Invoice") as DocType;
  // Commercial invoices are raised in Finance; credit/debit notes are raised in the NRS module.
  const listPath = docType === "Invoice" ? "/finance/invoices" : `/e-invoicing/${DOC_META[docType].path}`;
  if (!staff) return NextResponse.redirect(new URL(listPath, request.url), { status: 303 });

  const customerName = String(f.get("customer_name") ?? "").trim();
  if (!customerName) return NextResponse.redirect(new URL(`${listPath}/new?error=customer`, request.url), { status: 303 });

  const descriptions = f.getAll("line_description").map(String);
  const quantities = f.getAll("line_quantity").map(String);
  const prices = f.getAll("line_unit_price").map(String);
  const vatFlags = f.getAll("line_vat").map(String);
  // Quantities and prices stay as strings all the way into the tax engine, so a figure never passes
  // through a float on its way to becoming money.
  const lines: TaxLineInput[] = descriptions.map((d, i) => ({
    description: d.trim(),
    quantity: quantities[i] ?? "1",
    unitPrice: prices[i] ?? "0",
    treatment: vatFlags.includes(String(i)) ? "Standard" as const : "Exempt" as const,
  })).filter((l) => l.description !== "");
  if (lines.length === 0) return NextResponse.redirect(new URL(`${listPath}/new?error=lines`, request.url), { status: 303 });

  const pool = db();
  const cfg = (await pool.query<{ nrs_environment: string }>("SELECT nrs_environment FROM company_settings WHERE id=true")).rows[0]!;

  // The rate is resolved from the versioned rules using this document's own issue date, and the rule id
  // is stored with the document, so a total stays explainable after a rate change.
  const issueDate = String(f.get("issue_date") ?? "").trim() || new Date().toISOString().slice(0, 10);
  const { vat: vatRule, wht: whtRule } = await rulesForDate(issueDate);
  if (!vatRule) return NextResponse.redirect(new URL(`${listPath}/new?error=norate`, request.url), { status: 303 });
  const t = calculateTax(lines, vatRule, whtRule);

  const relatedId = String(f.get("related_id") ?? "").trim() || null;
  const BILLING = new Set(["OneOff", "Milestone", "Percentage", "Retainer", "CustomSchedule"]);
  const billingType = docType === "Invoice" && BILLING.has(String(f.get("billing_type"))) ? String(f.get("billing_type")) : "OneOff";
  const num = (k: string): number | null => { const n = Number.parseFloat(String(f.get(k) ?? "")); return Number.isFinite(n) ? n : null; };

  const doc = (await pool.query<{ id: string }>(
    `INSERT INTO einvoice (doc_type, related_id, reason, customer_name, customer_tin, customer_email, customer_address,
        issue_date, due_date, payment_terms, payment_method, subtotal, vat, total, environment, vat_rule_id,
        billing_type, project_name, project_value, milestone_name, milestone_amount,
        invoice_percentage, percentage_previously_billed, billing_period, next_billing_date, contract_reference, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7, COALESCE($8::date, current_date), $9,$10,$11,$12,$13,$14,$15,$16,
        $17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27) RETURNING id`,
    [
      docType, docType === "Invoice" ? null : relatedId,
      String(f.get("reason") ?? "").trim() || null,
      customerName,
      String(f.get("customer_tin") ?? "").trim() || null,
      String(f.get("customer_email") ?? "").trim() || null,
      String(f.get("customer_address") ?? "").trim() || null,
      issueDate,
      String(f.get("due_date") ?? "") || null,
      String(f.get("payment_terms") ?? "").trim() || null,
      String(f.get("payment_method") ?? "").trim() || null,
      t.subtotal, t.vat, t.total, cfg.nrs_environment, t.vatRuleId,
      billingType,
      String(f.get("project_name") ?? "").trim() || null, num("project_value"),
      String(f.get("milestone_name") ?? "").trim() || null, num("milestone_amount"),
      num("invoice_percentage"), num("percentage_previously_billed") ?? 0,
      String(f.get("billing_period") ?? "").trim() || null,
      String(f.get("next_billing_date") ?? "") || null,
      String(f.get("contract_reference") ?? "").trim() || null,
      staff.id,
    ],
  )).rows[0]!;

  for (let i = 0; i < t.lines.length; i++) {
    const l = t.lines[i]!;
    await pool.query(
      `INSERT INTO einvoice_line (einvoice_id, description, quantity, unit_price, vat_applicable, line_total, tax_category_code, sort)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [doc.id, l.description, lines[i]!.quantity, lines[i]!.unitPrice, l.treatment === "Standard", l.lineTotal,
       l.treatment === "Standard" ? "STD" : l.treatment === "ZeroRated" ? "ZER" : "EXM", i]);
  }

  // Custom payment schedule instalments (e.g. 30% advance / 40% development / 30% completion).
  if (billingType === "CustomSchedule") {
    const labels = f.getAll("inst_label").map(String);
    const percents = f.getAll("inst_percent").map(String);
    for (let i = 0; i < labels.length; i++) {
      const label = labels[i]?.trim();
      if (!label) continue;
      const pct = Number.parseFloat(percents[i] ?? "") || 0;
      await pool.query("INSERT INTO einvoice_installment (einvoice_id, label, percent, amount, sort) VALUES ($1,$2,$3,$4,$5)",
        [doc.id, label, pct, new Decimal(t.total).times(pct).div(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2), i]);
    }
  }
  await pool.query(
    "INSERT INTO audit_log (actor_id, action, entity, entity_id, before, after) VALUES ($1,'einvoice-created','einvoice',$2,NULL,$3::jsonb)",
    [staff.id, doc.id, JSON.stringify({ docType, total: t.total })]).catch(() => undefined);

  return NextResponse.redirect(new URL(`/e-invoicing/doc/${doc.id}`, request.url), { status: 303 });
}
