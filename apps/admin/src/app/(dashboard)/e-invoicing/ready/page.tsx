import type { ReactNode } from "react";
import { requireFiscal } from "../../../../lib/fiscal/permissions.js";
import { ComplianceList } from "../_components/ComplianceList.js";

export const dynamic = "force-dynamic";

export default async function ReadyPage(): Promise<ReactNode> {
  await requireFiscal("INVOICE_VIEW");
  return <ComplianceList bucket="ready" />;
}
