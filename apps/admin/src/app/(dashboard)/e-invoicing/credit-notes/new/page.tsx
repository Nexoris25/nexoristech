import type { ReactNode } from "react";
import { NewDocument } from "../../_components/NewDocument.js";

export const dynamic = "force-dynamic";

export default async function NewCreditNotePage(): Promise<ReactNode> {
  return <NewDocument docType="CreditNote" />;
}
