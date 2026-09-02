/**
 * Create an invoice, credit note, or debit note. The server recomputes every total from the lines
 * with the shared VAT rate - the browser's figures are never trusted - and writes a Draft.
 * Credit and debit notes carry the original document they adjust and a reason. A document is
 * submitted to the NRS from its detail screen, never on creation.
 *
 * Three things this route decides.
 *
 * **Whether the document is ever meant for the NRS.** `fiscal_required` is the flag; an invoice
 * without it is an ordinary PDF invoice that is issued, sent, paid and reported like any other and
 * never appears in a submission queue. It does not affect the number: every invoice takes the next
 * one in a single series at creation and keeps it, so filing later adds an IRN and renames nothing.
 *
 * **Whether VAT is charged at all.** Separate from the per-line treatment, which says what kind of
 * supply a line is. A missing rate still refuses to price a VAT-charging document; choosing not to
 * charge is recorded on the document, with the reason, instead of being disguised as a missing rule.
 *
 * **What a percentage of a project comes to.** When an invoice bills a percentage of a project, the
 * amount is computed here from the project's contract value and never read from the form, and the
 * percentage is checked against what the project has already been billed. The browser shows the
 * same figure so the person raising it can see it, but the browser's copy is not what is stored.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "../../../lib/db.js";
import { getFiscalStaff } from "../../../lib/fiscal/permissions.js";
import Decimal from "decimal.js";
import { calculateTax, type TaxLineInput } from "../../../lib/fiscal/tax-engine.js";
import { rulesForDate } from "../../../lib/fiscal/rules.js";
import { DOC_META, seriesFor, VAT_EXEMPT_REASONS } from "../../../lib/einvoice.js";
import type { DocType, VatExemptReason } from "../../../lib/einvoice.js";
import { isPercentageProblem, percentageBilling } from "../../../lib/projects.js";
import { nextSeriesNumber, percentAlreadyBilled } from "../../../lib/projects-server.js";
import { businessDayDeadline } from "../../../lib/business-days.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES: DocType[] = ["Invoice", "CreditNote", "DebitNote"];
const BILLING = new Set(["OneOff", "Milestone", "Percentage", "Retainer", "CustomSchedule"]);

interface ProjectRow {
  id: string;
  name: string;
  contract_value: string;
  client_id: string;
  customer_name: string;
  customer_email: string | null;
  customer_address: string | null;
  customer_tin: string | null;
}

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getFiscalStaff("INVOICE_CREATE");
  const f = await request.formData();
  const docType = (TYPES.includes(String(f.get("doc_type")) as DocType) ? String(f.get("doc_type")) : "Invoice") as DocType;
  // Commercial invoices are raised in Finance; credit/debit notes are raised in the NRS module.
  const listPath = docType === "Invoice" ? "/finance/invoices" : `/e-invoicing/${DOC_META[docType].path}`;
  if (!staff) return NextResponse.redirect(new URL(listPath, request.url), { status: 303 });

  const bail = (error: string, msg?: string): Response =>
    NextResponse.redirect(
      new URL(`${listPath}/new?error=${error}${msg ? `&msg=${encodeURIComponent(msg)}` : ""}`, request.url),
      { status: 303 },
    );

  const pool = db();
  const billingType = docType === "Invoice" && BILLING.has(String(f.get("billing_type"))) ? String(f.get("billing_type")) : "OneOff";
  const projectId = String(f.get("project_id") ?? "").trim() || null;
  const milestoneId = String(f.get("milestone_id") ?? "").trim() || null;
  // Fiscalisation and VAT are both opt-in decisions recorded on the document.
  const fiscalRequired = docType !== "Invoice" || String(f.get("fiscal_required") ?? "") === "on";
  const chargeVat = String(f.get("vat_charged") ?? "") === "on";
  // Not charging VAT is a tax position, and one nobody wrote down is one nobody can defend later.
  // The reason is a category rather than free text so it can be totalled and reviewed; the note is
  // where the particulars go.
  const reasonRaw = String(f.get("vat_exempt_reason") ?? "").trim();
  const vatExemptReason: VatExemptReason | null =
    !chargeVat && (VAT_EXEMPT_REASONS as readonly string[]).includes(reasonRaw)
      ? (reasonRaw as VatExemptReason)
      : null;
  const vatExemptNote = String(f.get("vat_exempt_note") ?? "").trim() || null;

  // A project, when one is attached, supplies the customer details and the contract value.
  let project: ProjectRow | null = null;
  if (projectId) {
    project = (
      await pool.query<ProjectRow>(
        `SELECT p.id, p.name, p.contract_value::text, p.client_id,
                c.name customer_name, c.email customer_email, c.address customer_address, c.tin customer_tin
           FROM project p JOIN client c ON c.id = p.client_id
          WHERE p.id = $1`,
        [projectId],
      )
    ).rows[0] ?? null;
    if (!project) return bail("project", "That project no longer exists.");
  }

  const customerName = String(f.get("customer_name") ?? "").trim() || project?.customer_name || "";
  if (!customerName) return bail("customer");

  if (docType === "Invoice" && !chargeVat && !vatExemptReason) {
    return bail("vatreason", "Say why no VAT is being charged on this invoice.");
  }
  if (vatExemptReason === "Other" && !vatExemptNote) {
    return bail("vatreason", "Explain the basis for not charging VAT.");
  }

  // Percentage billing prices itself from the project; every other basis prices from typed lines.
  const percentageMode = billingType === "Percentage" && project !== null;
  let lines: TaxLineInput[];
  let billedPercent: string | null = null;
  let previouslyBilled = "0";

  if (percentageMode) {
    previouslyBilled = await percentAlreadyBilled(project!.id, null);
    const billing = percentageBilling({
      contractValue: project!.contract_value,
      percent: f.get("invoice_percentage"),
      previouslyBilled,
    });
    if (isPercentageProblem(billing)) return bail("percentage", billing.error);
    billedPercent = billing.percent;
    const label =
      String(f.get("line_description") ?? "").trim() ||
      `${billing.percent}% of ${project!.name}`;
    lines = [
      {
        description: label,
        quantity: "1",
        unitPrice: billing.amount,
        treatment: chargeVat ? "Standard" : "Exempt",
      },
    ];
  } else {
    const descriptions = f.getAll("line_description").map(String);
    const quantities = f.getAll("line_quantity").map(String);
    const prices = f.getAll("line_unit_price").map(String);
    const vatFlags = f.getAll("line_vat").map(String);
    // Quantities and prices stay as strings all the way into the tax engine, so a figure never passes
    // through a float on its way to becoming money.
    lines = descriptions
      .map((d, i) => ({
        description: d.trim(),
        quantity: quantities[i] ?? "1",
        unitPrice: prices[i] ?? "0",
        treatment: vatFlags.includes(String(i)) ? ("Standard" as const) : ("Exempt" as const),
      }))
      .filter((l) => l.description !== "");
    if (lines.length === 0) return bail("lines");
  }

  const cfg = (await pool.query<{ nrs_environment: string; default_payment_days: number }>(
    "SELECT nrs_environment, default_payment_days FROM company_settings WHERE id=true")).rows[0]!;

  // The rate is resolved from the versioned rules using this document's own issue date, and the rule id
  // is stored with the document, so a total stays explainable after a rate change.
  const issueDate = String(f.get("issue_date") ?? "").trim() || new Date().toISOString().slice(0, 10);
  const { vat: vatRule, wht: whtRule } = await rulesForDate(issueDate);
  // A document that charges VAT needs a rate to charge. One that does not is priceable without one.
  if (!vatRule && chargeVat) return bail("norate");
  const t = calculateTax(lines, vatRule, whtRule, { chargeVat });

  /*
   * The due date is computed from business days, never taken from the form.
   *
   * A number of working days is the term that was actually agreed; a calendar date is that term
   * already resolved, by hand, against a weekend somebody had to remember. Computing it here means
   * every invoice resolves it the same way, and the number itself is stored so the document can
   * explain its own due date instead of leaving a reader to reverse-engineer it.
   */
  const daysRaw = Number.parseInt(String(f.get("payment_days") ?? ""), 10);
  const paymentDays =
    Number.isFinite(daysRaw) && daysRaw >= 0 && daysRaw <= 365 ? daysRaw : cfg.default_payment_days;
  const dueDate =
    docType === "Invoice" && paymentDays > 0
      ? businessDayDeadline(new Date(`${issueDate}T00:00:00Z`), paymentDays).toISOString().slice(0, 10)
      : null;

  const relatedId = String(f.get("related_id") ?? "").trim() || null;
  const num = (k: string): string | null => {
    const raw = String(f.get(k) ?? "").trim().replace(/,/g, "");
    if (raw.length === 0) return null;
    try {
      const d = new Decimal(raw);
      return d.isFinite() ? d.toFixed() : null;
    } catch {
      return null;
    }
  };

  const series = seriesFor(docType);
  const client = await pool.connect();
  let docId: string;
  try {
    await client.query("BEGIN");
    const seriesNo = await nextSeriesNumber(client, series);
    docId = (
      await client.query<{ id: string }>(
        `INSERT INTO einvoice (doc_type, related_id, reason, customer_name, customer_tin, customer_email, customer_address,
            issue_date, due_date, payment_terms, payment_method, subtotal, vat, total, environment, vat_rule_id,
            billing_type, project_name, project_value, milestone_name, milestone_amount,
            invoice_percentage, percentage_previously_billed, billing_period, next_billing_date, contract_reference,
            project_id, milestone_id, client_id, fiscal_required, vat_charged, vat_exempt_reason, vat_exempt_note, series, series_no, payment_days, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7, COALESCE($8::date, current_date), $9,$10,$11,$12,$13,$14,$15,$16,
            $17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37) RETURNING id`,
        [
          docType,
          docType === "Invoice" ? null : relatedId,
          String(f.get("reason") ?? "").trim() || null,
          customerName,
          String(f.get("customer_tin") ?? "").trim() || project?.customer_tin || null,
          String(f.get("customer_email") ?? "").trim() || project?.customer_email || null,
          String(f.get("customer_address") ?? "").trim() || project?.customer_address || null,
          issueDate,
          dueDate,
          String(f.get("payment_terms") ?? "").trim() || null,
          String(f.get("payment_method") ?? "").trim() || null,
          t.subtotal, t.vat, t.total, cfg.nrs_environment, t.vatRuleId,
          billingType,
          // The legacy text columns are still written so anything reading them keeps working while
          // the screens move across to the foreign key.
          project?.name ?? (String(f.get("project_name") ?? "").trim() || null),
          project?.contract_value ?? num("project_value"),
          String(f.get("milestone_name") ?? "").trim() || null,
          num("milestone_amount"),
          billedPercent ?? num("invoice_percentage"),
          percentageMode ? previouslyBilled : (num("percentage_previously_billed") ?? "0"),
          String(f.get("billing_period") ?? "").trim() || null,
          String(f.get("next_billing_date") ?? "") || null,
          String(f.get("contract_reference") ?? "").trim() || null,
          projectId,
          milestoneId,
          project?.client_id ?? null,
          fiscalRequired,
          chargeVat,
          vatExemptReason,
          vatExemptNote,
          series,
          seriesNo,
          docType === "Invoice" ? paymentDays : null,
          staff.id,
        ],
      )
    ).rows[0]!.id;

    for (let i = 0; i < t.lines.length; i++) {
      const l = t.lines[i]!;
      await client.query(
        `INSERT INTO einvoice_line (einvoice_id, description, quantity, unit_price, vat_applicable, line_total, tax_category_code, sort)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [docId, l.description, lines[i]!.quantity, lines[i]!.unitPrice, l.treatment === "Standard" && chargeVat, l.lineTotal,
         l.treatment === "Standard" ? "STD" : l.treatment === "ZeroRated" ? "ZER" : "EXM", i]);
    }

    // Custom payment schedule instalments (e.g. 30% advance / 40% development / 30% completion).
    if (billingType === "CustomSchedule") {
      const labels = f.getAll("inst_label").map(String);
      const percents = f.getAll("inst_percent").map(String);
      for (let i = 0; i < labels.length; i++) {
        const label = labels[i]?.trim();
        if (!label) continue;
        const pct = new Decimal(percents[i]?.trim() || "0");
        await client.query("INSERT INTO einvoice_installment (einvoice_id, label, percent, amount, sort) VALUES ($1,$2,$3,$4,$5)",
          [docId, label, pct.toFixed(), new Decimal(t.total).times(pct).div(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2), i]);
      }
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }

  await pool.query(
    "INSERT INTO audit_log (actor_id, action, entity, entity_id, before, after) VALUES ($1,'einvoice-created','einvoice',$2,NULL,$3::jsonb)",
    [staff.id, docId, JSON.stringify({ docType, total: t.total, series, fiscalRequired, chargeVat, vatExemptReason, projectId })]).catch(() => undefined);

  return NextResponse.redirect(new URL(`/e-invoicing/doc/${docId}`, request.url), { status: 303 });
}
