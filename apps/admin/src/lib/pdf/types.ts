/**
 * The document model for the branded PDF engine (PRD Part Three, 5): proposals, scopes of work,
 * SLAs, contracts, and invoices. The salesperson supplies the content; the engine never invents
 * figures or terms. Shared by the client form, the API route, and the template.
 */
export const DOC_KINDS = [
  "Proposal",
  "Scope of Work",
  "Service Level Agreement",
  "Contract",
  "Invoice",
] as const;

export type DocKind = (typeof DOC_KINDS)[number];

export interface DocSection {
  heading: string;
  body: string;
}

export interface LineItem {
  description: string;
  amount: number;
}

export interface DocumentData {
  kind: DocKind;
  title: string;
  date: string;
  reference?: string;
  recipientName?: string;
  recipientCompany?: string;
  intro?: string;
  sections: DocSection[];
  lineItems?: LineItem[];
  terms?: string;
}
