import type { ReactNode } from "react";
import { NewDocument } from "../../_components/NewDocument.js";

export const dynamic = "force-dynamic";

export default async function NewDebitNotePage(): Promise<ReactNode> {
  return <NewDocument docType="DebitNote" />;
}
