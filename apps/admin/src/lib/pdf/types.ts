/**
 * The document model for the branded Document Engine (PRD 10.1, 6.4). Each document kind renders
 * from its own template to its own layout: narrative business documents (Proposal, Scope of Work,
 * Service Level Agreement, Contract) and the financial Invoice are deliberately not the same. The
 * caller supplies every figure and term; the engine never invents anything. Amounts are in NGN.
 */
export const DOC_KINDS = [
  "Proposal",
  "Scope of Work",
  "Master Service Agreement",
  "Service Level Agreement",
  "Contract",
  "Invoice",
] as const;

export type DocKind = (typeof DOC_KINDS)[number];

export const NARRATIVE_KINDS: DocKind[] = [
  "Proposal",
  "Scope of Work",
  "Master Service Agreement",
  "Service Level Agreement",
  "Contract",
];

/**
 * The kinds set as plain legal instruments rather than as a sales document. They share the Proposal's
 * editor and pipeline but never its cover page: an agreement is read, marked up and filed, not pitched.
 */
export const AGREEMENT_KINDS: DocKind[] = [
  "Scope of Work",
  "Master Service Agreement",
  "Service Level Agreement",
  "Contract",
];

export interface DocSection {
  heading: string;
  body: string;
}

/** A key fact shown in a document's meta strip (Project, Investment, Timeline, Engagement). */
export interface DocMeta {
  label: string;
  value: string;
}

/**
 * The rich-content model for a Proposal. The editor serialises its DOM to this AST client-side so
 * the branded PDF renders a controlled subset of formatting (never raw HTML): headings, paragraphs,
 * and bulleted or numbered lists, each made of inline runs that may be bold, italic, underlined, or
 * a link. This keeps pasted formatting while staying inside what react-pdf can lay out safely.
 */
export interface RichRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  href?: string;
}

export type RichBlockType = "paragraph" | "h2" | "h3" | "bulleted" | "numbered" | "table";

export interface RichBlock {
  type: RichBlockType;
  /** For paragraph/h2/h3: the inline runs. */
  runs?: RichRun[];
  /** For bulleted/numbered: each list item is its own run array. */
  items?: RichRun[][];
  /**
   * For a table: the rows, each a list of cells, each cell a run array.
   *
   * Tables used to be flattened into paragraphs, which ran every cell of a row together into one
   * sentence: a pricing table arrived as "Platform development 12,500,000 Certification 1,500,000".
   * The structure is what a table is for, so it is carried through rather than discarded.
   */
  rows?: RichRun[][][];
  /** Whether the first row is a header row, taken from thead or a row of th cells. */
  headerRow?: boolean;
}

/** Who signs the document on behalf of Nexoris Technologies: the sales rep generating it. */
export interface Signatory {
  name: string;
  title: string;
}

/** A simple priced row for a narrative pricing summary (for example, a proposal). */
export interface LineItem {
  description: string;
  amount: number;
}

/** An invoice line: quantity times rate. amount is derived, never stored. */
export interface InvoiceLine {
  description: string;
  quantity: number;
  rate: number;
}

export type BillingBasis = "full" | "milestone";
export type EngagementType = "one-off" | "retainer" | "project";

export interface InvoiceInfo {
  invoiceNumber: string;
  dueDate?: string;
  clientName?: string;
  clientCompany?: string;
  clientTin?: string;
  clientAddress?: string;
  lineItems: InvoiceLine[];
  /** Full: bill the whole engagement (one-off or retainer). Milestone: bill a percentage of it. */
  billingBasis: BillingBasis;
  engagementType: EngagementType;
  milestoneLabel?: string;
  milestonePercent?: number;
  /** VAT at the company rate (7.5%) applied to the billable amount when true. */
  vatEnabled: boolean;
  /** Withholding tax the client is expected to deduct, as a percentage. 0 means none. */
  whtRate: number;
  bankDetails?: string;
  notes?: string;
}

/** Company details injected server-side from settings; the salesperson never types these. */
export interface CompanyInfo {
  legalName: string;
  tin: string | null;
  address: string;
  email: string;
  phone: string;
  /** Shown on the proposal cover and contact page. */
  website?: string;
  vatRate: number;
  nrsEnabled: boolean;
}

export interface DocumentData {
  kind: DocKind;
  title: string;
  date: string;
  reference?: string;
  recipientName?: string;
  recipientCompany?: string;
  recipientAddress?: string;
  intro?: string;
  sections: DocSection[];
  /** Key facts strip: Project, Investment, Timeline, Engagement. Auto-filled from the deal. */
  meta?: DocMeta[];
  /** The line under the proposal title on the cover, e.g. "A Proposal for Full, Custom-Built Development". */
  subtitle?: string;
  /** The Proposal's rich body, in place of plain sections. */
  richContent?: RichBlock[];
  lineItems?: LineItem[];
  terms?: string;
  /** Adds the two-party signing block (client and Nexoris Technologies) with ruled signature lines. */
  signature?: boolean;
  /**
   * The two optional insertions, each independent of the other and of the signing block itself.
   *
   * They place a real image over the signature line and beside it. Neither is drawn or simulated: if
   * the corresponding file is absent from the public folder, nothing is inserted and the line is left
   * blank to be signed by hand. A stamp that the business did not provide must never be invented.
   */
  insertSignature?: boolean;
  insertStamp?: boolean;
  /**
   * The stamp and signature for THIS document, as base64 PNG data URLs, already cleaned by
   * /api/documents/signing-asset. Per-document rather than fixed files on the server: a stamp carries
   * a date, so the correct image changes from one document to the next.
   */
  stampImage?: string;
  signatureImage?: string;
  /** The sales rep signing on behalf of Nexoris Technologies. */
  signatory?: Signatory;
  /** Present only when kind is "Invoice". */
  invoice?: InvoiceInfo;
  /** Injected from company_settings by the API route. */
  company?: CompanyInfo;
}

export interface InvoiceTotals {
  itemsSubtotal: number;
  billableBase: number;
  vat: number;
  wht: number;
  total: number;
  amountDueToBank: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * The single, authoritative invoice calculation, shared by the live form preview and the PDF so
 * they can never disagree. Milestone billing takes the given percentage of the engagement value;
 * full billing takes all of it. VAT is on the billable base; WHT is what the client withholds, so
 * the amount that lands in the bank is total minus WHT.
 */
export function computeInvoice(inv: InvoiceInfo, vatRate: number): InvoiceTotals {
  const itemsSubtotal = round2(
    inv.lineItems.reduce((sum, l) => sum + Math.max(0, l.quantity) * Math.max(0, l.rate), 0),
  );
  const pct =
    inv.billingBasis === "milestone"
      ? Math.min(100, Math.max(0, inv.milestonePercent ?? 0))
      : 100;
  const billableBase = round2((itemsSubtotal * pct) / 100);
  const vat = inv.vatEnabled ? round2((billableBase * vatRate) / 100) : 0;
  const total = round2(billableBase + vat);
  const wht = round2((billableBase * Math.max(0, inv.whtRate)) / 100);
  const amountDueToBank = round2(total - wht);
  return { itemsSubtotal, billableBase, vat, wht, total, amountDueToBank };
}
