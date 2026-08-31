/**
 * The Document Engine endpoint (PRD 10.1). Authenticated staff (not viewers) post document data and
 * receive a branded, text-selectable PDF rendered from the template for that kind. For an invoice,
 * the company details, VAT rate, and NRS status are read from company_settings server-side so the
 * salesperson never types them and the figures are consistent. Content is validated and used as-is;
 * the engine never invents figures or terms.
 */
import type { NextRequest } from "next/server";
import { getCurrentStaff } from "../../../lib/auth.js";
import { db } from "../../../lib/db.js";
import { renderDocument } from "../../../lib/pdf/render.js";
import {
  DOC_KINDS,
  type BillingBasis,
  type CompanyInfo,
  type DocKind,
  type DocMeta,
  type DocSection,
  type DocumentData,
  type EngagementType,
  type InvoiceInfo,
  type InvoiceLine,
  type LineItem,
  type RichBlock,
  type RichBlockType,
  type RichRun,
} from "../../../lib/pdf/types.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

async function loadCompany(): Promise<CompanyInfo> {
  const fallback: CompanyInfo = {
    legalName: "Nexoris Technologies Ltd",
    tin: null,
    address: "No. 5, Mojisola Dokpesi Street, Ajah, Lekki Lagos",
    email: "business@nexoristech.com",
    phone: "+234 913 813 3224",
    vatRate: 7.5,
    nrsEnabled: false,
  };
  try {
    const { rows } = await db().query<{
      legal_name: string;
      tin: string | null;
      address: string;
      email: string;
      phone: string;
      website: string | null;
      vat_rate: string;
      nrs_enabled: boolean;
    }>(
      `SELECT legal_name, tin, address, email, phone, website, vat_rate::text, nrs_enabled
         FROM company_settings WHERE id = true`,
    );
    const row = rows[0];
    if (!row) return fallback;
    return {
      legalName: row.legal_name,
      tin: row.tin,
      address: row.address,
      email: row.email,
      phone: row.phone,
      ...(row.website ? { website: row.website } : {}),
      vatRate: Number.parseFloat(row.vat_rate),
      nrsEnabled: row.nrs_enabled,
    };
  } catch {
    return fallback;
  }
}

function sanitizeInvoice(body: Record<string, unknown>): InvoiceInfo | null {
  const inv = body.invoice as Record<string, unknown> | undefined;
  if (!inv || typeof inv !== "object") return null;
  const lineItems: InvoiceLine[] = Array.isArray(inv.lineItems)
    ? (inv.lineItems as Record<string, unknown>[])
        .map((l) => ({
          description: str(l.description),
          quantity: Math.max(0, num(l.quantity)),
          rate: Math.max(0, num(l.rate)),
        }))
        .filter((l) => l.description)
    : [];
  if (lineItems.length === 0) return null;

  const basis: BillingBasis = str(inv.billingBasis) === "milestone" ? "milestone" : "full";
  const engRaw = str(inv.engagementType);
  const engagementType: EngagementType =
    engRaw === "retainer" || engRaw === "project" ? engRaw : "one-off";

  return {
    invoiceNumber: str(inv.invoiceNumber) || `INV-${new Date().getFullYear()}-001`,
    ...(str(inv.dueDate) ? { dueDate: str(inv.dueDate) } : {}),
    ...(str(inv.clientName) ? { clientName: str(inv.clientName) } : {}),
    ...(str(inv.clientCompany) ? { clientCompany: str(inv.clientCompany) } : {}),
    ...(str(inv.clientTin) ? { clientTin: str(inv.clientTin) } : {}),
    ...(str(inv.clientAddress) ? { clientAddress: str(inv.clientAddress) } : {}),
    lineItems,
    billingBasis: basis,
    engagementType,
    ...(str(inv.milestoneLabel) ? { milestoneLabel: str(inv.milestoneLabel) } : {}),
    ...(basis === "milestone"
      ? { milestonePercent: Math.min(100, Math.max(0, num(inv.milestonePercent))) }
      : {}),
    vatEnabled: inv.vatEnabled === true,
    whtRate: Math.min(100, Math.max(0, num(inv.whtRate))),
    ...(str(inv.bankDetails) ? { bankDetails: str(inv.bankDetails) } : {}),
    ...(str(inv.notes) ? { notes: str(inv.notes) } : {}),
  };
}

const RICH_TYPES = new Set<RichBlockType>(["paragraph", "h2", "h3", "bulleted", "numbered", "table"]);

function sanitizeRuns(value: unknown): RichRun[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((r) => {
      const run = r as Record<string, unknown>;
      const text = typeof run.text === "string" ? run.text : "";
      const out: RichRun = { text };
      if (run.bold === true) out.bold = true;
      if (run.italic === true) out.italic = true;
      if (run.underline === true) out.underline = true;
      // Only keep safe hrefs so a link can never carry a script or data payload into the PDF.
      if (typeof run.href === "string" && /^(https?:|mailto:|tel:)/i.test(run.href)) out.href = run.href;
      return out;
    })
    .filter((r) => r.text.length > 0);
}

function sanitizeRich(value: unknown): RichBlock[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((b) => {
      const block = b as Record<string, unknown>;
      const type = block.type as RichBlockType;
      if (!RICH_TYPES.has(type)) return null;
      if (type === "table") {
        /*
         * Rows of cells of runs, validated at each level.
         *
         * A table that arrives here and is not understood does not degrade, it disappears: the block
         * is dropped and the schedule it described is simply missing from the document. So the shape
         * is checked rather than trusted, and an empty table is dropped deliberately rather than
         * rendering an empty frame.
         */
        const rows = Array.isArray(block.rows)
          ? block.rows
              .map((row) => (Array.isArray(row) ? row.map((cell) => sanitizeRuns(cell)) : []))
              .filter((row) => row.some((cell) => cell.length > 0))
          : [];
        return rows.length > 0
          ? ({ type, rows, headerRow: block.headerRow === true } as RichBlock)
          : null;
      }
      if (type === "bulleted" || type === "numbered") {
        const items = Array.isArray(block.items) ? block.items.map((it) => sanitizeRuns(it)).filter((r) => r.length > 0) : [];
        return items.length > 0 ? ({ type, items } as RichBlock) : null;
      }
      const runs = sanitizeRuns(block.runs);
      return runs.length > 0 ? ({ type, runs } as RichBlock) : null;
    })
    .filter((b): b is RichBlock => b !== null);
}

function sanitizeMeta(value: unknown): DocMeta[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((m) => ({ label: str((m as Record<string, unknown>).label), value: str((m as Record<string, unknown>).value) }))
    .filter((m) => m.label && m.value);
}

async function sanitize(body: Record<string, unknown>): Promise<DocumentData | null> {
  const kind = str(body.kind) as DocKind;
  if (!(DOC_KINDS as readonly string[]).includes(kind)) return null;
  const title = str(body.title);
  if (!title) return null;

  const company = await loadCompany();
  const date = str(body.date) || new Date().toLocaleDateString("en-NG");

  if (kind === "Invoice") {
    const invoice = sanitizeInvoice(body);
    if (!invoice) return null;
    return { kind, title, date, sections: [], invoice, company };
  }

  const sections: DocSection[] = Array.isArray(body.sections)
    ? (body.sections as Record<string, unknown>[])
        .map((s) => ({ heading: str(s.heading), body: str(s.body) }))
        .filter((s) => s.heading || s.body)
    : [];
  const lineItems: LineItem[] = Array.isArray(body.lineItems)
    ? (body.lineItems as Record<string, unknown>[])
        .map((i) => ({ description: str(i.description), amount: Math.max(0, num(i.amount)) }))
        .filter((i) => i.description)
    : [];

  const richContent = sanitizeRich(body.richContent);
  const meta = sanitizeMeta(body.meta);
  const sig = body.signatory as Record<string, unknown> | undefined;
  const signatory =
    sig && str(sig.name)
      ? { name: str(sig.name), title: str(sig.title) || "Nexoris Technologies" }
      : null;

  return {
    kind,
    title,
    date,
    sections,
    company,
    signature: body.signature === true,
    // Two independent insertions. Each only ever places a real file; neither is drawn.
    insertSignature: body.insertSignature === true,
    insertStamp: body.insertStamp === true,
    ...(str(body.stampImage) ? { stampImage: str(body.stampImage) } : {}),
    ...(str(body.signatureImage) ? { signatureImage: str(body.signatureImage) } : {}),
    ...(str(body.subtitle) ? { subtitle: str(body.subtitle) } : {}),
    ...(meta.length > 0 ? { meta } : {}),
    ...(richContent.length > 0 ? { richContent } : {}),
    ...(signatory ? { signatory } : {}),
    ...(str(body.reference) ? { reference: str(body.reference) } : {}),
    ...(str(body.recipientName) ? { recipientName: str(body.recipientName) } : {}),
    ...(str(body.recipientCompany) ? { recipientCompany: str(body.recipientCompany) } : {}),
    ...(str(body.recipientAddress) ? { recipientAddress: str(body.recipientAddress) } : {}),
    ...(str(body.intro) ? { intro: str(body.intro) } : {}),
    ...(str(body.terms) ? { terms: str(body.terms) } : {}),
    ...(lineItems.length > 0 ? { lineItems } : {}),
  };
}

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getCurrentStaff();
  if (!staff || staff.role === "viewer") {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "invalid-json" }, { status: 400 });
  }

  const data = await sanitize(body);
  if (!data) {
    return Response.json({ error: "invalid-document" }, { status: 400 });
  }

  /*
   * A render failure is ours, and it must say so rather than escaping as an unhandled 500 with no
   * trace of what the document contained. The one that prompted this was a line break inside an
   * inline run, which react-pdf cannot lay out with a registered TTF; the kind and title are enough
   * to find the record again without putting a client's document body in the log.
   */
  let pdf: Buffer;
  try {
    pdf = await renderDocument(data);
  } catch (e) {
    console.error(
      `[documents] rendering a ${data.kind} titled "${data.title}" failed: ` +
      `${e instanceof Error ? e.message : String(e)}`,
    );
    return Response.json({ error: "render-failed" }, { status: 500 });
  }
  const filename = `${data.kind.replace(/\s+/g, "-").toLowerCase()}.pdf`;
  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
