/**
 * The branded layout for a Proposal and a Scope of Work.
 *
 * These are the two documents a client reads before they have agreed anything, so they carry the full
 * brand: the navy and purple cover, a contents page, numbered sections and the running furniture. The
 * agreements are deliberately not this; see agreement-layout.
 *
 * Sections come from the writing, not from a fixed list. Every h2 in the editor's output opens a new
 * numbered section, and everything until the next h2 belongs to it. That means the contents page is
 * always what the document actually contains, and a writer who adds a section gets it numbered and
 * listed without touching this file. A document with no headings at all still renders: it becomes one
 * unnumbered run of content rather than an empty shell.
 */
import React from "react";
import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import {
  BrandCover, BrandTable, KeyValues, RunningFurniture, SectionHeading, TableOfContents, brandStyles,
} from "./brand-parts.js";
import { BULLET_INDENT, C, FONT, PAGE, TYPE, mm, sectionNumber } from "./brand.js";
import type { CompanyInfo, DocumentData, LineItem, RichBlock, RichRun } from "./types.js";

const s = StyleSheet.create({
  page: {
    paddingTop: PAGE.top, paddingBottom: PAGE.bottom, paddingLeft: PAGE.left, paddingRight: PAGE.right,
    fontFamily: FONT.regular, backgroundColor: C.white,
  },
  coverPage: { padding: 0, backgroundColor: C.navy },
  body: TYPE.body,
  lead: TYPE.lead,
  h3: TYPE.h3,
  bulletRow: { flexDirection: "row", marginBottom: 4 },
  bulletMark: { fontFamily: FONT.regular, fontSize: 9.3, color: C.purple, width: BULLET_INDENT.level1 },
  bulletText: { ...TYPE.bullet, flex: 1, marginBottom: 0 },
  contentsTitle: { fontFamily: FONT.bold, fontSize: 14.5, color: C.ink, marginBottom: mm(5) },
  contentsRule: { height: 1.1, backgroundColor: C.purple, marginBottom: mm(6) },
  runBold: { fontFamily: FONT.bold },
  runItalic: { fontFamily: FONT.regular, color: C.purple },
  runUnderline: { textDecoration: "underline" },
  runLink: { color: C.purple, textDecoration: "underline" },
  richTable: { borderWidth: 0.6, borderColor: C.rule, marginBottom: 10, marginTop: 4 },
  richTableHead: { flexDirection: "row", backgroundColor: C.purple },
  richTableHeadCell: { ...TYPE.cellHead, paddingVertical: 6.5, paddingHorizontal: 6 },
  richTableRow: { flexDirection: "row", borderBottomWidth: 0.4, borderBottomColor: C.rule },
  richTableRowTint: { backgroundColor: C.rowTint },
  richTableCell: { ...TYPE.cell, paddingVertical: 5.5, paddingHorizontal: 6 },

  acceptTitle: { fontFamily: FONT.bold, fontSize: 14.5, color: C.ink, marginBottom: mm(3) },
  acceptRule: { height: 1.1, backgroundColor: C.purple, marginBottom: mm(5) },
  acceptIntro: { ...TYPE.body, marginBottom: mm(8) },
  acceptCols: { flexDirection: "row", gap: mm(12) },
  acceptCol: { flex: 1 },
  acceptParty: { fontFamily: FONT.medium, fontSize: 8, color: C.purple, letterSpacing: 1, marginBottom: mm(4) },
  acceptField: { marginBottom: mm(6) },
  acceptLabel: { fontFamily: FONT.medium, fontSize: 7.2, color: C.inkSoft, letterSpacing: 0.8, marginBottom: mm(1) },
  /* A reserved slot, so dropping a signature image in never reflows the page below it. */
  acceptSlot: { height: mm(11), justifyContent: "flex-end" },
  acceptFilled: { fontFamily: FONT.bold, fontSize: 11, color: C.ink },
  acceptSignImage: { height: mm(10), maxWidth: mm(45), objectFit: "contain", objectPosition: "left bottom" },
  acceptLine: { borderTopWidth: 0.8, borderTopColor: C.ink },
  stamp: { width: mm(28), height: mm(28), objectFit: "contain", marginTop: mm(6) },
});

/** Inline runs, with the same treatment the rest of the engine gives them. */
function Runs({ runs }: { runs: RichRun[] }): React.ReactElement {
  return (
    <>
      {runs.map((run, i) => {
        const style = [
          ...(run.bold ? [s.runBold] : []),
          ...(run.underline ? [s.runUnderline] : []),
          ...(run.href ? [s.runLink] : run.italic ? [s.runItalic] : []),
        ];
        return <Text key={i} style={style}>{run.text.length > 0 ? run.text : " "}</Text>;
      })}
    </>
  );
}

/**
 * A table pasted into the editor, set in the kit's table style.
 *
 * Column widths are equal rather than measured. react-pdf has no auto-layout, and guessing widths
 * from cell content produces a table that changes shape with the data; equal columns are predictable,
 * and a writer who needs a different balance can say so in the copy.
 */
function RichTable({ block }: { block: RichBlock }): React.ReactElement | null {
  const rows = block.rows ?? [];
  if (rows.length === 0) return null;
  const header = block.headerRow === true ? rows[0] : undefined;
  const body = block.headerRow === true ? rows.slice(1) : rows;
  const columns = Math.max(...rows.map((r) => r.length));
  const width = { flex: 1 };
  return (
    <View style={s.richTable}>
      {header ? (
        <View style={s.richTableHead} fixed>
          {Array.from({ length: columns }, (_, i) => (
            <Text key={i} style={[s.richTableHeadCell, width]}><Runs runs={header[i] ?? []} /></Text>
          ))}
        </View>
      ) : null}
      {body.map((row, r) => (
        <View key={r} style={[s.richTableRow, ...(r % 2 === 1 ? [s.richTableRowTint] : [])]} wrap={false}>
          {Array.from({ length: columns }, (_, i) => (
            <Text key={i} style={[s.richTableCell, width]}><Runs runs={row[i] ?? []} /></Text>
          ))}
        </View>
      ))}
    </View>
  );
}

/** One block of body content. Headings that open sections are handled by the caller. */
function Block({ block }: { block: RichBlock }): React.ReactElement | null {
  if (block.type === "h3") {
    return <Text style={s.h3}><Runs runs={block.runs ?? []} /></Text>;
  }
  if (block.type === "table") {
    return <RichTable block={block} />;
  }
  if (block.type === "bulleted" || block.type === "numbered") {
    return (
      <View>
        {(block.items ?? []).map((item, i) => (
          <View key={i} style={s.bulletRow} wrap={false}>
            <Text style={s.bulletMark}>{block.type === "numbered" ? `${i + 1}.` : "•"}</Text>
            <Text style={s.bulletText}><Runs runs={item} /></Text>
          </View>
        ))}
      </View>
    );
  }
  return <Text style={s.body}><Runs runs={block.runs ?? []} /></Text>;
}

interface Section {
  number: string;
  title: string;
  blocks: RichBlock[];
}

/** Split the flat block list into numbered sections, one per h2. */
function toSections(blocks: RichBlock[]): { sections: Section[]; preamble: RichBlock[] } {
  const preamble: RichBlock[] = [];
  const sections: Section[] = [];
  for (const block of blocks) {
    if (block.type === "h2") {
      const title = (block.runs ?? []).map((r) => r.text).join("").trim();
      sections.push({ number: sectionNumber(sections.length + 1), title: title || "Section", blocks: [] });
      continue;
    }
    if (sections.length === 0) preamble.push(block);
    else sections[sections.length - 1]!.blocks.push(block);
  }
  return { sections, preamble };
}

/**
 * The lines under PREPARED BY on the cover, from the company record rather than hardcoded.
 *
 * Only what the record actually holds. An empty line for a field nobody has filled in reads as a
 * mistake on a document going to a client, so each is included only when it has a value.
 */
function preparedBy(company: CompanyInfo): string[] {
  return [
    company.legalName,
    ...(company.tin ? [`TIN ${company.tin}`] : []),
    ...(company.address ? [company.address] : []),
    ...(company.website ? [company.website] : []),
  ];
}

/** Amounts as the rest of the engine writes them. */
function naira(amount: number): string {
  return `NGN ${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * The investment table, in the kit's table style.
 *
 * Carried over rather than dropped when the Proposal moved onto the branding kit. A proposal that
 * cannot state a price is not a proposal, and the old layout had this; losing it in a redesign would
 * be a regression dressed as a rebuild.
 */
function Investment({ items }: { items: LineItem[] }): React.ReactElement {
  const total = items.reduce((sum, i) => sum + i.amount, 0);
  return (
    <BrandTable
      headers={["Item", "Amount"]}
      rows={[
        ...items.map((i) => [i.description, naira(i.amount)]),
        ["Total", naira(total)],
      ]}
      widths={[3, 1]}
    />
  );
}

/**
 * The acceptance page, added only when it was asked for.
 *
 * A proposal that arrives with signing lines on it is asking to be signed, and that is not always
 * what a proposal is for: plenty go out to be read and discussed first. So this is behind the
 * checkbox on the form rather than being part of every document.
 *
 * Nexoris's side may be pre-completed, because the person generating the document is the person
 * signing for Nexoris. The client's side never is: pre-filling somebody else's name, title and date
 * on a document they have not seen is not a convenience.
 */
function AcceptancePage({
  data, company, client, logoPurple, stamp, signatureImage,
}: {
  data: DocumentData;
  company: CompanyInfo;
  client: string;
  logoPurple?: Buffer;
  stamp?: Buffer;
  signatureImage?: Buffer;
}): React.ReactElement {
  const running = `${data.kind.toUpperCase()}  ·  ${client.toUpperCase()}`;
  const footer = `${company.legalName}  |  Confidential  |  Prepared for the recipient named above`;
  const fields = ["NAME", "TITLE", "SIGNATURE", "DATE"] as const;
  const ours: Partial<Record<(typeof fields)[number], string>> = {
    NAME: data.signatory?.name ?? "",
    TITLE: data.signatory?.title ?? "",
  };
  return (
    <Page size="A4" style={s.page}>
      <RunningFurniture runningTitle={running} footerText={footer} {...(logoPurple ? { logoPurple } : {})} />
      <Text style={s.acceptTitle}>Acceptance</Text>
      <View style={s.acceptRule} />
      <Text style={s.acceptIntro}>
        {`By signing below, both parties accept this ${data.kind.toLowerCase()} as the basis of the engagement described in it.`}
      </Text>
      <View style={s.acceptCols}>
        <View style={s.acceptCol}>
          <Text style={s.acceptParty}>{`FOR ${company.legalName.toUpperCase()}`}</Text>
          {fields.map((label) => (
            <View key={label} style={s.acceptField}>
              <Text style={s.acceptLabel}>{label}</Text>
              <View style={s.acceptSlot}>
                {label === "SIGNATURE" && signatureImage ? (
                  <Image src={signatureImage} style={s.acceptSignImage} />
                ) : ours[label] ? (
                  <Text style={s.acceptFilled}>{ours[label]}</Text>
                ) : null}
              </View>
              <View style={s.acceptLine} />
            </View>
          ))}
          {stamp ? <Image src={stamp} style={s.stamp} /> : null}
        </View>
        <View style={s.acceptCol}>
          <Text style={s.acceptParty}>{`FOR ${(client || "THE CLIENT").toUpperCase()}`}</Text>
          {fields.map((label) => (
            <View key={label} style={s.acceptField}>
              <Text style={s.acceptLabel}>{label}</Text>
              <View style={s.acceptSlot} />
              <View style={s.acceptLine} />
            </View>
          ))}
        </View>
      </View>
    </Page>
  );
}

export function BrandedTemplate({
  data, company, logoWhite, logoPurple, stamp, signature,
}: {
  data: DocumentData;
  company: CompanyInfo;
  logoWhite?: Buffer;
  logoPurple?: Buffer;
  stamp?: Buffer;
  signature?: Buffer;
}): React.ReactElement {
  const { sections, preamble } = toSections(data.richContent ?? []);
  const client = data.recipientCompany || data.recipientName || "Prepared for you";
  const running = `${data.kind.toUpperCase()}  ·  ${client.toUpperCase()}`;
  const footer = `${company.legalName}  |  Confidential  |  Prepared for the recipient named above`;
  const metaLines = [
    `Date: ${data.date}`,
    ...(data.reference ? [`Reference: ${data.reference}`] : []),
  ];

  return (
    <>
      {/* The cover is its own page with no padding: the artwork runs to the paper's edge. */}
      <Page size="A4" style={s.coverPage}>
        <BrandCover
          preparedFor={client}
          title={data.kind}
          {...(data.subtitle ? { subtitle: data.subtitle } : {})}
          metaLines={metaLines}
          preparedByLines={preparedBy(company)}
          {...(logoWhite ? { logoWhite } : {})}
        />
      </Page>

      <Page size="A4" style={s.page}>
        <RunningFurniture runningTitle={running} footerText={footer} {...(logoPurple ? { logoPurple } : {})} />

        {/* Contents, only when the document has sections to list. A one-item contents page is
            furniture pretending to be navigation. */}
        {sections.length > 1 ? (
          <View>
            <Text style={s.contentsTitle}>Contents</Text>
            <View style={s.contentsRule} />
            <TableOfContents entries={sections.map((sec) => ({ number: sec.number, title: sec.title }))} />
            <View style={{ marginBottom: mm(10) }} />
          </View>
        ) : null}

        {data.intro ? <Text style={s.lead}>{data.intro}</Text> : null}
        {data.meta && data.meta.length > 0 ? (
          <KeyValues rows={data.meta.map((m) => [m.label, m.value] as [string, string])} />
        ) : null}

        {preamble.map((block, i) => <Block key={`p${i}`} block={block} />)}

        {data.lineItems && data.lineItems.length > 0 ? <Investment items={data.lineItems} /> : null}

        {sections.map((section) => (
          <View key={section.number}>
            <SectionHeading number={section.number} title={section.title} />
            {section.blocks.map((block, i) => <Block key={`${section.number}-${i}`} block={block} />)}
          </View>
        ))}

      </Page>

      {data.signature ? (
        <AcceptancePage
          data={data}
          company={company}
          client={client}
          {...(logoPurple ? { logoPurple } : {})}
          {...(data.insertStamp && stamp ? { stamp } : {})}
          {...(data.insertSignature && signature ? { signatureImage: signature } : {})}
        />
      ) : null}
    </>
  );
}

export { brandStyles };
