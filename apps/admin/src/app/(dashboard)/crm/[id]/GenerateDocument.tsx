"use client";
/**
 * Generate a branded PDF from the Document Engine (PRD 10.1, 6.4). Each kind has its own template
 * and its own form. The Proposal is authored in a rich-text editor whose formatting is kept and
 * rebranded. Scope of Work, Service Level Agreement, and Contract auto-fill purpose-built clause
 * templates from the lead and deal (client, project, cost, timeline), every field overridable. The
 * Invoice takes client details, Qty/Rate line items, a billing basis (full payment or a milestone
 * percentage), VAT, and withholding tax, with totals computed live and identically to the server.
 * The narrative documents carry the Nexoris Technologies stamp and the generating rep's signature.
 */
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Plus, Trash2, FileDown } from "lucide-react";
import { RichTextEditor } from "../../../../components/cms/RichTextEditor.js";
import { htmlToBlocks } from "../../../../lib/pdf/html-to-blocks.js";
import { SigningAssetUpload, type SigningAsset } from "./SigningAssetUpload.js";
import {
  DOC_KINDS,
  NARRATIVE_KINDS,
  computeInvoice,
  type DocKind,
  type DocMeta,
  type InvoiceInfo,
  type InvoiceLine,
} from "../../../../lib/pdf/types.js";

const FIELD =
  "rounded-card border border-neutral-200 bg-white p-2.5 text-[0.85rem] text-ink-950 focus:border-purple-500";
const LABEL = "text-[0.8rem] font-600 text-ink-950";

function naira(n: number): string {
  return `NGN ${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const ENGAGEMENT_LABEL: Record<string, string> = {
  "one-off": "One-off project",
  retainer: "Retainer",
  project: "Project",
};



/** Purpose-built default clauses per structured kind, filled from the lead and deal. */

export function GenerateDocument({
  defaultName,
  defaultCompany,
  defaultProject,
  defaultCost,
  defaultEngagement,
  repName,
  repTitle,
  vatRate = 7.5,
  allowedKinds = [...DOC_KINDS],
}: {
  defaultName?: string;
  defaultCompany?: string;
  defaultProject?: string;
  defaultCost?: number;
  defaultEngagement?: string;
  repName?: string;
  repTitle?: string;
  vatRate?: number;
  allowedKinds?: DocKind[];
}): ReactNode {
  const initialKind = allowedKinds[0] ?? "Proposal";
  const [kind, setKind] = useState<DocKind>(initialKind);
  const isInvoice = kind === "Invoice";
  /*
   * The agreements are the text, not a form.
   *
   * An MSA, an SLA or a Contract is pasted in complete: it already carries its own title, its own
   * parties and its own recitals. Offering fields for those again produced a document that stated its
   * title twice and named the parties twice, once from the form and once from the drafter's own
   * words. So for these kinds the identity fields are not shown and the template supplies only
   * letterhead, page furniture and, if asked for, the execution block.
   */
  const isLegal = kind === "Master Service Agreement" || kind === "Service Level Agreement" || kind === "Contract";

  // Shared narrative identity + meta, prefilled from the lead and deal.
  const [title, setTitle] = useState(initialKind === "Proposal" || initialKind === "Scope of Work" ? initialKind : `${initialKind} for ${defaultCompany || defaultName || "your project"}`);
  const recipientName = defaultName ?? "";
  const recipientCompany = defaultCompany ?? "";
  const [project, setProject] = useState(defaultProject ?? "");
  const cost = defaultCost ?? 0;
  const timeline = "";
  const [intro, setIntro] = useState("");

  /*
   * The cover page's fields.
   *
   * "Prepared for" is seeded from the deal but stays editable, because the name on a cover is the
   * client's registered name and the CRM holds whatever the salesperson typed. The two addresses are
   * optional and start empty: a cover is not a letterhead. The confidentiality notice is not a cover
   * field at all — it is printed inside the document, where a paragraph of terms belongs, rather than
   * across the foot of the front page.
   */
  const [preparedFor, setPreparedFor] = useState(defaultCompany || defaultName || "");
  const [preparedByName, setPreparedByName] = useState("");
  /* Both optional, and empty by default: a cover is not a letterhead, and most do not need either. */
  const [clientAddress, setClientAddress] = useState("");
  const [senderAddress, setSenderAddress] = useState("");
  const [docDate, setDocDate] = useState(new Date().toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }));
  const [validity, setValidity] = useState("30 days from the date above");
  const [confidentiality, setConfidentiality] = useState(
    "Confidential. Prepared for the named recipient and not to be copied, distributed or disclosed to any third party without written consent.",
  );
  const [bodyHtml, setBodyHtml] = useState("");
  const [signature, setSignature] = useState(initialKind !== "Proposal");
  // The two optional insertions, off by default. A document is unsigned and unstamped unless someone
  // deliberately says otherwise, which is the safe default for anything sent to a client.
  const [signatureAsset, setSignatureAsset] = useState<SigningAsset | null>(null);
  const [stampAsset, setStampAsset] = useState<SigningAsset | null>(null);

  // Invoice state
  const [invoice, setInvoice] = useState<InvoiceInfo>({
    invoiceNumber: `INV-${new Date().getFullYear()}-001`,
    dueDate: "",
    clientName: defaultName ?? "",
    clientCompany: defaultCompany ?? "",
    clientTin: "",
    clientAddress: "",
    lineItems: [{ description: defaultProject || "", quantity: 1, rate: defaultCost ?? 0 }],
    billingBasis: "full",
    engagementType: (defaultEngagement as InvoiceInfo["engagementType"]) || "one-off",
    milestoneLabel: "Deposit",
    milestonePercent: 30,
    vatEnabled: true,
    whtRate: 0,
    bankDetails: "",
    notes: "",
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const totals = useMemo(() => computeInvoice(invoice, vatRate), [invoice, vatRate]);

  function pickKind(next: DocKind): void {
    setKind(next);
    if (NARRATIVE_KINDS.includes(next)) {
      // The cover prints the title on its own, under the client's name, so it is the document's name
      // rather than a sentence about it. The agreements are titled by their own pasted text.
      setTitle(next === "Proposal" || next === "Scope of Work" ? next : `${next} for ${recipientCompany || recipientName || "your project"}`);
      // A legal document is signed by default; a proposal usually is not until it is accepted.
      setSignature(next !== "Proposal");
    }
  }

  const setInv = (patch: Partial<InvoiceInfo>): void => setInvoice((p) => ({ ...p, ...patch }));
  const setLine = (i: number, patch: Partial<InvoiceLine>): void =>
    setInvoice((p) => ({ ...p, lineItems: p.lineItems.map((l, j) => (j === i ? { ...l, ...patch } : l)) }));

  function buildMeta(): DocMeta[] {
    const rows: DocMeta[] = [];
    if (project.trim()) rows.push({ label: "Project", value: project.trim() });
    if (cost > 0) rows.push({ label: "Investment", value: naira(cost) });
    if (timeline.trim()) rows.push({ label: "Timeline", value: timeline.trim() });
    if (defaultEngagement && ENGAGEMENT_LABEL[defaultEngagement]) {
      rows.push({ label: "Engagement", value: ENGAGEMENT_LABEL[defaultEngagement]! });
    }
    return rows;
  }

  async function generate(): Promise<void> {
    setBusy(true);
    setError("");
    try {
      const date = isLegal ? new Date().toLocaleDateString("en-NG") : docDate.trim() || new Date().toLocaleDateString("en-NG");
      const signatory = repName ? { name: repName, title: repTitle || "Nexoris Technologies" } : undefined;
      const payload = isInvoice
        ? { kind, title: title || invoice.invoiceNumber, date, invoice }
        : {
            kind,
            title,
            date,
            ...(recipientName ? { recipientName } : {}),
            ...(recipientCompany ? { recipientCompany } : {}),
            // The cover's fields, and the notice that opens the body, for the kinds that have a cover.
            ...(isLegal ? {} : {
              ...(preparedFor.trim() ? { preparedFor: preparedFor.trim() } : {}),
              ...(preparedByName.trim() ? { preparedBy: preparedByName.trim() } : {}),
              ...(clientAddress.trim() ? { recipientAddress: clientAddress.trim() } : {}),
              ...(senderAddress.trim() ? { senderAddress: senderAddress.trim() } : {}),
              ...(validity.trim() ? { validity: validity.trim() } : {}),
              ...(confidentiality.trim() ? { confidentiality: confidentiality.trim() } : {}),
            }),
            ...(intro ? { intro } : {}),
            meta: buildMeta(),
            // The AST is the only body now; sections stay in the payload shape for the invoice path.
            sections: [],
            richContent: htmlToBlocks(bodyHtml),
            signature,
            // Each insertion is implied by an image having been uploaded for it.
            insertSignature: signature && signatureAsset !== null,
            insertStamp: signature && stampAsset !== null,
            ...(signature && signatureAsset ? { signatureImage: signatureAsset.dataUrl } : {}),
            ...(signature && stampAsset ? { stampImage: stampAsset.dataUrl } : {}),
            ...(signature && signatory ? { signatory } : {}),
          };
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        /*
         * Say which kind of failure it was. This told everybody to check their fields whatever had
         * happened, including when the fields were fine: a line break in pasted body copy crashed the
         * renderer, the endpoint returned 500, and this sent people back to a form with nothing wrong
         * with it. A 400 is the only case where the fields are the answer.
         */
        setError(
          res.status === 400
            ? "Some details are missing or invalid. Check the title and the fields above, then retry."
            : res.status === 401
              ? "Your session has expired. Sign in again and retry."
              : "The document could not be produced. This is a fault on our side, not with what you entered.",
        );
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${kind.replace(/\s+/g, "-").toLowerCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Could not generate the document. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const isProposal = kind === "Proposal";

  return (
    <div className="flex flex-col gap-4">
      {/* Kind selector */}
      <div className={`flex-wrap gap-2 ${allowedKinds.length > 1 ? "flex" : "hidden"}`}>
        {allowedKinds.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => pickKind(k)}
            className={`cursor-pointer rounded-card border px-3 py-1.5 text-[0.8rem] font-600 ${
              kind === k
                ? "border-purple-600 bg-purple-600 text-white"
                : "border-purple-200 text-purple-700 hover:bg-purple-100"
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      {isInvoice ? (
        <>
          {/* Invoice: identity + client */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Invoice number</span>
              <input value={invoice.invoiceNumber} onChange={(e) => setInv({ invoiceNumber: e.target.value })} className={FIELD} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Due date</span>
              <input type="date" value={invoice.dueDate ?? ""} onChange={(e) => setInv({ dueDate: e.target.value })} className={FIELD} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Client name</span>
              <input value={invoice.clientName ?? ""} onChange={(e) => setInv({ clientName: e.target.value })} className={FIELD} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Client company</span>
              <input value={invoice.clientCompany ?? ""} onChange={(e) => setInv({ clientCompany: e.target.value })} className={FIELD} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Client TIN</span>
              <input value={invoice.clientTin ?? ""} onChange={(e) => setInv({ clientTin: e.target.value })} className={FIELD} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Client address</span>
              <input value={invoice.clientAddress ?? ""} onChange={(e) => setInv({ clientAddress: e.target.value })} className={FIELD} />
            </label>
          </div>

          {/* Line items */}
          <div>
            <span className={LABEL}>Line items</span>
            <div className="mt-1.5 flex flex-col gap-2">
              <div className="hidden grid-cols-[1fr_56px_110px_110px_32px] gap-2 px-1 text-[0.7rem] font-600 uppercase text-neutral-600 sm:grid">
                <span>Description</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Rate</span>
                <span className="text-right">Amount</span>
                <span />
              </div>
              {invoice.lineItems.map((line, i) => (
                <div key={i} className="grid grid-cols-[1fr_56px_90px_32px] items-center gap-2 sm:grid-cols-[1fr_56px_110px_110px_32px]">
                  <input value={line.description} onChange={(e) => setLine(i, { description: e.target.value })} placeholder="Service or item" className={FIELD} />
                  <input type="number" min="0" value={line.quantity || ""} onChange={(e) => setLine(i, { quantity: Number.parseFloat(e.target.value) || 0 })} className={`${FIELD} text-right`} />
                  <input type="number" min="0" value={line.rate || ""} onChange={(e) => setLine(i, { rate: Number.parseFloat(e.target.value) || 0 })} placeholder="Rate" className={`${FIELD} text-right`} />
                  <span className="hidden text-right font-mono text-[0.8rem] text-neutral-600 sm:block">
                    {naira(Math.max(0, line.quantity) * Math.max(0, line.rate))}
                  </span>
                  <button type="button" aria-label="Remove line" onClick={() => setInvoice((p) => ({ ...p, lineItems: p.lineItems.filter((_, j) => j !== i) }))} className="grid h-8 w-8 cursor-pointer place-items-center rounded-card text-neutral-600 hover:bg-purple-100 hover:text-purple-700">
                    <Trash2 size={14} strokeWidth={2} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => setInvoice((p) => ({ ...p, lineItems: [...p.lineItems, { description: "", quantity: 1, rate: 0 }] }))} className="inline-flex w-fit cursor-pointer items-center gap-1 text-[0.8rem] font-600 text-purple-700 hover:text-purple-600">
                <Plus size={14} strokeWidth={2.4} /> Add line item
              </button>
            </div>
          </div>

          {/* Billing basis */}
          <div className="rounded-card border border-purple-200 bg-purple-100/30 p-3.5">
            <span className={LABEL}>Billing basis</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["full", "milestone"] as const).map((b) => (
                <button key={b} type="button" onClick={() => setInv({ billingBasis: b })} className={`cursor-pointer rounded-card border px-3 py-1.5 text-[0.8rem] font-600 ${invoice.billingBasis === b ? "border-purple-600 bg-purple-600 text-white" : "border-purple-200 text-purple-700 hover:bg-purple-100"}`}>
                  {b === "full" ? "Full payment" : "Milestone (% of value)"}
                </button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="flex flex-col gap-1.5">
                <span className={LABEL}>Engagement type</span>
                <select value={invoice.engagementType} onChange={(e) => setInv({ engagementType: e.target.value as InvoiceInfo["engagementType"] })} className={`cursor-pointer ${FIELD}`}>
                  <option value="one-off">One-off project</option>
                  <option value="retainer">Retainer</option>
                  <option value="project">Project</option>
                </select>
              </label>
              {invoice.billingBasis === "milestone" ? (
                <>
                  <label className="flex flex-col gap-1.5">
                    <span className={LABEL}>Milestone label</span>
                    <input value={invoice.milestoneLabel ?? ""} onChange={(e) => setInv({ milestoneLabel: e.target.value })} placeholder="Deposit, Milestone 2, Final" className={FIELD} />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className={LABEL}>Milestone percentage</span>
                    <input type="number" min="0" max="100" value={invoice.milestonePercent ?? 0} onChange={(e) => setInv({ milestonePercent: Number.parseFloat(e.target.value) || 0 })} className={FIELD} />
                  </label>
                </>
              ) : null}
            </div>
          </div>

          {/* Tax */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-2.5 rounded-card border border-neutral-200 p-2.5">
              <input type="checkbox" checked={invoice.vatEnabled} onChange={(e) => setInv({ vatEnabled: e.target.checked })} className="h-4 w-4 cursor-pointer accent-purple-600" />
              <span className="text-[0.85rem] text-ink-950">Charge VAT ({vatRate}%)</span>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>WHT the client withholds (%)</span>
              <input type="number" min="0" max="100" value={invoice.whtRate || ""} onChange={(e) => setInv({ whtRate: Number.parseFloat(e.target.value) || 0 })} placeholder="0" className={FIELD} />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Payment details</span>
            <textarea value={invoice.bankDetails ?? ""} onChange={(e) => setInv({ bankDetails: e.target.value })} rows={2} placeholder="Bank name, account name, account number" className={FIELD} />
          </label>

          {/* Live totals */}
          <div className="rounded-card border border-purple-200 bg-white p-4 shadow-subtle">
            <span className={LABEL}>Live totals</span>
            <div className="mt-2 flex flex-col gap-1 text-[0.85rem]">
              {invoice.billingBasis === "milestone" ? (
                <>
                  <div className="flex justify-between"><span className="text-neutral-600">Engagement value</span><span className="font-mono">{naira(totals.itemsSubtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-neutral-600">{invoice.milestoneLabel || "Milestone"} ({invoice.milestonePercent ?? 0}%)</span><span className="font-mono font-700">{naira(totals.billableBase)}</span></div>
                </>
              ) : (
                <div className="flex justify-between"><span className="text-neutral-600">Subtotal</span><span className="font-mono">{naira(totals.billableBase)}</span></div>
              )}
              {invoice.vatEnabled ? <div className="flex justify-between"><span className="text-neutral-600">VAT ({vatRate}%)</span><span className="font-mono">{naira(totals.vat)}</span></div> : null}
              <div className="mt-1 flex justify-between border-t border-purple-200 pt-1.5"><span className="font-700">Total</span><span className="font-mono font-700 text-purple-700">{naira(totals.total)}</span></div>
              {invoice.whtRate > 0 ? (
                <>
                  <div className="flex justify-between"><span className="text-neutral-600">Less WHT ({invoice.whtRate}%)</span><span className="font-mono">-{naira(totals.wht)}</span></div>
                  <div className="flex justify-between"><span className="font-700">Amount due to bank</span><span className="font-mono font-700">{naira(totals.amountDueToBank)}</span></div>
                </>
              ) : null}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Everything the cover page shows. Not offered for the agreements, which have no cover. */}
          {isLegal ? null : (
            <>
              {/* The cover page, field for field. Nothing here that the cover does not print. */}
              <div className="rounded-card border border-purple-200 bg-purple-100/30 p-3.5">
                <span className={LABEL}>Cover page</span>
                <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5 sm:col-span-2">
                    <span className={LABEL}>Title</span>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} className={FIELD} />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className={LABEL}>Prepared for</span>
                    <input value={preparedFor} onChange={(e) => setPreparedFor(e.target.value)} placeholder="Client's registered name" className={FIELD} />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className={LABEL}>Prepared by</span>
                    <input value={preparedByName} onChange={(e) => setPreparedByName(e.target.value)} placeholder="Nexoris Technologies Ltd" className={FIELD} />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className={LABEL}>Client address (optional)</span>
                    <input value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} placeholder="Street, city, state" className={FIELD} />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className={LABEL}>Nexoris address (optional)</span>
                    <input value={senderAddress} onChange={(e) => setSenderAddress(e.target.value)} placeholder="Street, city, state" className={FIELD} />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className={LABEL}>Proposal date</span>
                    <input value={docDate} onChange={(e) => setDocDate(e.target.value)} className={FIELD} />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className={LABEL}>Validity</span>
                    <input value={validity} onChange={(e) => setValidity(e.target.value)} placeholder="30 days from the date above" className={FIELD} />
                  </label>
                </div>
              </div>

              {/* Inside the document, not on the cover: the key-facts strip and the opening paragraph. */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className={LABEL}>Project / service</span>
                  <input value={project} onChange={(e) => setProject(e.target.value)} placeholder="Service line" className={FIELD} />
                </label>
                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className={LABEL}>Confidentiality notice</span>
                  <textarea
                    value={confidentiality}
                    onChange={(e) => setConfidentiality(e.target.value)}
                    rows={2}
                    className={FIELD}
                  />
                  <span className="text-[0.72rem] text-neutral-600">
                    Printed inside the document, above the first section — not on the cover.
                  </span>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={LABEL}>Opening paragraph (optional)</span>
                  <input
                    value={intro}
                    onChange={(e) => setIntro(e.target.value)}
                    placeholder="Set the context in a sentence."
                    className={FIELD}
                  />
                </label>
              </div>
            </>
          )}

          <div>
            <span className={LABEL}>{kind} body</span>
            <p className="mb-1.5 mt-0.5 text-[0.72rem] text-neutral-600">
              {isProposal
                ? "Write or paste your content. Headings, bold, lists, tables, diagrams and pasted images are kept and rebranded into the PDF."
                : "Write or paste the agreement. Each heading becomes a numbered clause you can cite; formatting is kept."}
            </p>
            <RichTextEditor name="document_body" onChange={setBodyHtml} allowImages keepHeadingLevels />
          </div>

          <label className="flex cursor-pointer items-center gap-2.5">
            <input type="checkbox" checked={signature} onChange={(e) => setSignature(e.target.checked)} className="h-4 w-4 cursor-pointer accent-purple-600" />
            <span className="text-[0.85rem] text-ink-950">
              {isLegal
                ? "Add the execution block for signing"
                : "Add the acceptance page with signing lines for both parties"}
            </span>
          </label>

          {/* Offered once there is a signing block to put them in. Each is an upload rather than a
              toggle over a fixed file: a stamp carries a date, so the image changes per document. */}
          {signature ? (
            <div className="ml-6 flex flex-col gap-2.5 border-l border-neutral-200 pl-4">
              <SigningAssetUpload
                label="Business Development Manager's signature"
                hint="Placed on the Nexoris Technologies line. The client's line is always left blank."
                value={signatureAsset}
                onChange={setSignatureAsset}
              />
              <SigningAssetUpload
                label="Nexoris Technologies official stamp"
                hint="Placed under the signature. Upload the current stamp, since it carries a date."
                value={stampAsset}
                onChange={setStampAsset}
              />
              <p className="text-[0.74rem] text-neutral-600">
                The background is removed and the image trimmed to the ink automatically. Leave either empty to omit it.
              </p>
            </div>
          ) : null}
        </>
      )}

      {error ? <p className="text-[0.82rem] text-[#C0362C]" role="alert">{error}</p> : null}

      <button
        type="button"
        onClick={generate}
        disabled={busy || (!isInvoice && !title.trim())}
        className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-card bg-purple-600 px-5 py-2.5 text-[0.88rem] font-600 text-white hover:bg-purple-700 disabled:opacity-60"
      >
        <FileDown size={16} strokeWidth={2} />
        {busy ? "Generating" : `Generate ${kind} PDF`}
      </button>
    </div>
  );
}
