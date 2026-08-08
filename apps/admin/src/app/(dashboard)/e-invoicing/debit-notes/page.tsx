import type { ReactNode } from "react";
import { requireFiscal } from "../../../../lib/fiscal/permissions.js";
import { DocumentList } from "../_components/DocumentList.js";

export const dynamic = "force-dynamic";

export default async function DebitNotesPage({ searchParams }: { searchParams: Promise<{ status?: string; pay?: string }> }): Promise<ReactNode> {
  await requireFiscal("INVOICE_VIEW");
  const { status, pay } = await searchParams;
  return <DocumentList docType="DebitNote" status={status} pay={pay} />;
}
