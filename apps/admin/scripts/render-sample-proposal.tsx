/**
 * Render a sample Proposal to a PDF on disk, so the branded layout can be inspected without going
 * through the CRM. Development aid only; nothing in the app imports it.
 *
 *   npx tsx scripts/render-sample-proposal.tsx out.pdf
 */
import { writeFileSync } from "node:fs";
import { renderDocument } from "../src/lib/pdf/render.js";
import type { DocumentData } from "../src/lib/pdf/types.js";

const data: DocumentData = {
  kind: "Proposal",
  title: "Custom Lottery Platform Development",
  subtitle: "A Proposal for Full, Custom-Built Development",
  date: "July 27, 2026",
  recipientName: "Ahmed Razak-Lawal",
  intro:
    "Proprietary wallet, draw, and scratch card engines — engineered entirely in-house, with full source code ownership on completion.",
  sections: [],
  richContent: [
    { type: "h2", runs: [{ text: "Executive Summary" }] },
    { type: "paragraph", runs: [{ text: "Nexoris Technologies Ltd is pleased to present this proposal for the full, custom-built development of a lottery and digital scratch card platform, spanning a responsive web application, cross-platform mobile applications, and an administrative console." }] },
    { type: "h2", runs: [{ text: "Project Objectives" }] },
    { type: "bulleted", items: [
      [{ text: "Deliver a proprietary wallet engine with full audit trail" }],
      [{ text: "Build draw and scratch card engines in-house" }],
      [{ text: "Transfer source code ownership on final settlement" }],
    ] },
    { type: "h2", runs: [{ text: "Estimated Timeline" }] },
    { type: "paragraph", runs: [{ text: "Sixteen weeks from kick-off to handover, in four milestones." }] },
    { type: "h2", runs: [{ text: "Terms and Conditions" }] },
    { type: "paragraph", runs: [{ text: "This proposal is valid for thirty (30) days from the proposal date." }] },
    // Deliberately long, so the body flows past one page and the running header can be checked for
    // overlap on pages 2 and 3. A layout that only ever renders one page proves nothing.
    ...Array.from({ length: 14 }, (_, i) => ([
      { type: "h2" as const, runs: [{ text: `Clause Group ${i + 1}` }] },
      { type: "paragraph" as const, runs: [{ text: "Each party shall perform its obligations under this agreement with reasonable skill and care, and shall comply with all applicable laws and regulations in force in the Federal Republic of Nigeria. Neither party shall be liable for any failure or delay in performance to the extent that such failure or delay is caused by circumstances beyond its reasonable control, provided that the affected party notifies the other in writing without undue delay and takes all reasonable steps to mitigate the effect." }] },
      { type: "paragraph" as const, runs: [{ text: "Any notice given under this agreement shall be in writing and shall be delivered by hand, sent by prepaid recorded delivery, or sent by electronic mail to the address of the receiving party set out above, or to such other address as that party may notify from time to time." }] },
    ])).flat(),
  ],
  signature: true,
  insertSignature: true,
  insertStamp: true,
  signatory: { name: "Ologbenla Gbadebo", title: "Business Development Manager" },
};

/** The same body, rendered as an agreement, to check the plain layout beside the branded one. */
const agreement: DocumentData = {
  ...data,
  kind: "Master Service Agreement",
  title: "Master Service Agreement for Software Development Services",
  recipientAddress: "12 Adeola Odeku Street, Victoria Island, Lagos",
};

const out = process.argv[2] ?? "sample-proposal.pdf";
const outAgreement = process.argv[3];

async function main(): Promise<void> {
  const buf = await renderDocument(data);
  writeFileSync(out, buf);
  console.warn(`wrote ${out} (${buf.length} bytes)`);
  if (outAgreement) {
    const buf2 = await renderDocument(agreement);
    writeFileSync(outAgreement, buf2);
    console.warn(`wrote ${outAgreement} (${buf2.length} bytes)`);
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
