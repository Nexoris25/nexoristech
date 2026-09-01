/**
 * The branded layout for a Proposal and a Scope of Work.
 *
 * These are the two documents a client reads before they have agreed anything, so they carry the full
 * brand: the navy and purple cover, a contents page, numbered sections and the running furniture. The
 * agreements are deliberately not this; see agreement-layout.
 *
 * The heading hierarchy is the writer's, taken literally. h1 is the document itself, so an h1 at the
 * head of the paste is the title and goes on the cover; h2 is a section, and gets the purple bar, the
 * rule and the counted number; h3 and h4 are sub-headings within a section and are never numbered like
 * one. Everything until the next h2 belongs to the section before it, so the contents page is always
 * what the document actually contains and a writer who adds a section gets it numbered and listed
 * without touching this file. A document with no headings at all still renders: it becomes one
 * unnumbered run of content rather than an empty shell.
 */
import React from "react";
import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import {
  BrandCover, BrandTable, Callout, KeyValues, Outline, RunningFurniture, SectionHeading,
  TableOfContents, brandStyles, type RowEmphasis,
} from "./brand-parts.js";
import { BULLET_INDENT, C, CONTENT_WIDTH, FONT, PAGE, TYPE, mm, sectionNumber, splitLeadingNumber } from "./brand.js";
import { drawWidth } from "./image-size.js";
import { isHeading, type CompanyInfo, type DocumentData, type LineItem, type RichBlock, type RichRun } from "./types.js";

const s = StyleSheet.create({
  page: {
    paddingTop: PAGE.top, paddingBottom: PAGE.bottom, paddingLeft: PAGE.left, paddingRight: PAGE.right,
    fontFamily: FONT.regular, backgroundColor: C.white,
  },
  coverPage: { padding: 0, backgroundColor: C.navy },
  body: TYPE.body,
  lead: TYPE.lead,
  /*
   * The levels below a section, each visibly one step down from the last: the kit's h2 in purple, its
   * h3 in ink, then a smaller ink heading. Three steps is what a document of this length needs and as
   * many as can be told apart at a glance.
   */
  h1: { ...TYPE.h2, fontSize: 13, color: C.ink },
  h2: TYPE.h2,
  h3: TYPE.h3,
  h4: { ...TYPE.h3, fontFamily: FONT.medium, fontSize: 9.4, color: C.inkSoft },
  bulletRow: { flexDirection: "row", marginBottom: 4 },
  bulletMark: { fontFamily: FONT.regular, fontSize: 9.6, color: C.ink, textAlign: "left", flexShrink: 0 },
  bulletText: { ...TYPE.bullet, flex: 1, marginBottom: 0 },
  /** One step of nesting, the kit's second bullet indent less the first. */
  bulletIndent: { marginLeft: BULLET_INDENT.level2 - BULLET_INDENT.level1 },
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
  richTableSubtotal: { backgroundColor: C.headTint },
  richTableTotal: { backgroundColor: C.purpleDark },
  richTableStrong: { fontFamily: FONT.bold },
  richTableTotalText: { color: C.white },
  cellRight: { textAlign: "right" },
  /* A paragraph whose source had line breaks: one Text per line, never a newline inside one. */
  lineRow: { marginBottom: 0 },

  /*
   * A diagram or illustration.
   *
   * Given the column's full width with the height left to follow, so an architecture drawing arrives
   * at the size it was drawn to rather than being squeezed into a box of the layout's choosing. The
   * cap keeps a tall one on a single page instead of splitting it across two.
   */
  figure: { marginTop: 6, marginBottom: 10, alignItems: "center" },
  figureImage: { maxHeight: 520, objectFit: "contain" },
  figureCaption: { ...TYPE.note, marginTop: 5, textAlign: "center" },
  figureMissing: {
    ...TYPE.note, width: "100%", borderWidth: 0.6, borderColor: C.rule, borderStyle: "dashed",
    paddingVertical: 10, paddingHorizontal: 10, textAlign: "center", color: C.inkSoft,
  },

  acceptTitle: { fontFamily: FONT.bold, fontSize: 14.5, color: C.ink, marginBottom: mm(3) },
  acceptRule: { height: 1.1, backgroundColor: C.purple, marginBottom: mm(5) },
  acceptIntro: { ...TYPE.body, marginBottom: mm(8) },
  acceptCols: { flexDirection: "row", gap: mm(12) },
  acceptCol: { flex: 1 },
  /* Two lines' worth whatever the name needs, so a long client name cannot step this column out of
     line with the other one. */
  acceptParty: {
    fontFamily: FONT.medium, fontSize: 8, color: C.purple, letterSpacing: 1, marginBottom: mm(4),
    height: 23, lineHeight: 1.35,
  },
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

/** A table pasted into the editor, set in the kit's table style. */
const cellText = (cell: RichRun[] | undefined): string => (cell ?? []).map((r) => r.text).join("").trim();

/** A cell holding a figure: currency, percentage or plain number, however it is punctuated. */
function isFigure(text: string): boolean {
  return text !== "" && /^[^A-Za-z]*[\d][\d\s,.%()+/-]*$/.test(text) && /\d/.test(text);
}

/** A row that closes a table off: a total, a subtotal, a VAT line. */
function summaryOf(cells: RichRun[][]): RowEmphasis {
  const first = cellText(cells[0]).toLowerCase();
  if (/^(grand )?total\b|^total (payable|due|project)|^amount (payable|due)/.test(first)) return "total";
  if (/^(sub-?total|vat\b|less\b|discount\b)/.test(first)) return "subtotal";
  return "none";
}

function RichTable({ block }: { block: RichBlock }): React.ReactElement | null {
  const rows = block.rows ?? [];
  if (rows.length === 0) return null;
  const header = block.headerRow === true ? rows[0] : undefined;
  const body = block.headerRow === true ? rows.slice(1) : rows;
  const columns = Math.max(...rows.map((r) => r.length));
  /*
   * Columns of figures are right-aligned, decided by what the column actually holds rather than by
   * its position: a price table's last column is money in one document and a note in the next. A
   * column counts as figures when most of its filled cells are.
   */
  const rightAligned = Array.from({ length: columns }, (_, i) => {
    const filled = body.map((row) => cellText(row[i])).filter((t) => t !== "");
    return filled.length > 0 && filled.filter(isFigure).length >= Math.ceil(filled.length * 0.6);
  });
  /*
   * Only one row is the figure the table is about.
   *
   * A price schedule often carries a net total, then VAT, then the payable amount, and marking each
   * of them as the total gives a table with three closing rows and no answer. The last one is the
   * answer; the ones above it are steps towards it.
   */
  const marks = body.map(summaryOf);
  const lastTotal = marks.lastIndexOf("total");
  for (let i = 0; i < marks.length; i += 1) {
    if (marks[i] === "total" && i !== lastTotal) marks[i] = "subtotal";
  }
  /*
   * Columns are weighted by what they hold, not shared out equally.
   *
   * Equal columns give a price schedule three identical thirds: a description wrapping over four
   * lines beside two columns of whitespace with a figure in each. The reference gives the description
   * roughly three times the width of an amount, which is what measuring produces here — a figure
   * column needs only its digits, a prose column needs room in proportion to how much prose it holds.
   */
  const weights = Array.from({ length: columns }, (_, i) => {
    if (rightAligned[i]) return 1;
    const lengths = rows.map((row) => cellText(row[i]).length).filter((n) => n > 0);
    const average = lengths.length > 0 ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 1;
    return Math.min(4, Math.max(1.4, average / 12));
  });
  return (
    <View style={s.richTable} minPresenceAhead={mm(22)}>
      {header ? (
        <View style={s.richTableHead} fixed>
          {Array.from({ length: columns }, (_, i) => (
            <Text key={i} style={[s.richTableHeadCell, { flex: weights[i] ?? 1 }, ...(rightAligned[i] ? [s.cellRight] : [])]}>
              <Runs runs={header[i] ?? []} />
            </Text>
          ))}
        </View>
      ) : null}
      {body.map((row, r) => {
        const mark = marks[r] ?? "none";
        return (
          <View
            key={r}
            style={[
              s.richTableRow,
              ...(mark === "none" && r % 2 === 1 ? [s.richTableRowTint] : []),
              ...(mark === "subtotal" ? [s.richTableSubtotal] : []),
              ...(mark === "total" ? [s.richTableTotal] : []),
            ]}
            wrap={false}
          >
            {Array.from({ length: columns }, (_, i) => (
              <Text
                key={i}
                style={[
                  s.richTableCell,
                  { flex: weights[i] ?? 1 },
                  ...(rightAligned[i] ? [s.cellRight] : []),
                  ...(mark === "none" ? [] : [s.richTableStrong]),
                  ...(mark === "total" ? [s.richTableTotalText] : []),
                ]}
              >
                <Runs runs={row[i] ?? []} />
              </Text>
            ))}
          </View>
        );
      })}
    </View>
  );
}

/** One block of body content. Headings that open sections are handled by the caller. */
function Block({ block }: { block: RichBlock }): React.ReactElement | null {
  /*
   * A heading inside a section, one step or more below the level that opens one.
   *
   * Each level is set distinctly and each keeps a heading with what follows it, so no sub-heading is
   * ever left alone at the foot of a page with its content overleaf.
   */
  if (isHeading(block.type)) {
    const style = block.type === "h1" ? s.h1 : block.type === "h2" ? s.h2 : block.type === "h3" ? s.h3 : s.h4;
    return (
      <View minPresenceAhead={mm(18)} wrap={false}>
        <Text style={style}><Runs runs={block.runs ?? []} /></Text>
      </View>
    );
  }
  if (block.type === "table") {
    return <RichTable block={block} />;
  }
  if (block.type === "image") {
    /*
     * The picture, and its caption beneath it.
     *
     * An image that could not be carried — one that arrived as a link rather than as the picture
     * itself — leaves its caption in a ruled frame instead of disappearing, so the gap in the
     * document is visible to whoever is checking it before it goes out.
     */
    return (
      <View style={s.figure} minPresenceAhead={mm(30)} wrap={false}>
        {/* Its own size, or the column's, whichever is smaller: a small diagram is not enlarged. */}
        {block.src ? <Image src={block.src} style={[s.figureImage, { width: drawWidth(block.src, CONTENT_WIDTH) }]} /> : null}
        {block.caption && block.caption.length > 0 ? (
          <Text style={block.src ? s.figureCaption : s.figureMissing}>
            {block.src ? null : "Illustration not embedded: "}
            <Runs runs={block.caption} />
          </Text>
        ) : null}
      </View>
    );
  }
  if (block.type === "tree") {
    return (
      <View minPresenceAhead={mm(22)}>
        <Outline
          items={(block.items ?? []).map((item, i) => <Runs key={i} runs={item} />)}
          levels={block.itemLevels ?? []}
        />
      </View>
    );
  }
  if (block.type === "bulleted" || block.type === "numbered") {
    /*
     * Markers come from the parse, not from counting here.
     *
     * Counting rows is what loses the writer's numbering: a list that starts at seven restarts at
     * one, and a nested level restarts alongside its parent. The fallback is only for content that
     * reached this file without markers at all.
     */
    /*
     * The marker column is as wide as the widest marker in this list, and no wider.
     *
     * A fixed column fitted the house bullet and nothing else: "(a)" broke across two lines, printing
     * "(" beside the text and "a)" underneath it. Measuring the list gives "14." and "(viii)" the room
     * they need while a list of plain bullets stays tight.
     */
    const markers = block.itemMarkers ?? [];
    const widest = markers.reduce((w, m) => Math.max(w, m.length), 1);
    const markWidth = Math.max(BULLET_INDENT.level1, widest * 5.2 + 4);
    return (
      <View>
        {(block.items ?? []).map((item, i) => {
          const level = block.itemLevels?.[i] ?? 0;
          const mark = markers[i] ?? (block.type === "numbered" ? `${i + 1}.` : "•");
          return (
            <View key={i} style={[s.bulletRow, ...(level > 0 ? [{ marginLeft: level * (BULLET_INDENT.level2 - BULLET_INDENT.level1) }] : [])]} wrap={false}>
              <Text style={[s.bulletMark, { width: markWidth }]}>{mark}</Text>
              <Text style={s.bulletText}><Runs runs={item} /></Text>
            </View>
          );
        })}
      </View>
    );
  }
  // A paragraph whose source carried line breaks keeps them, one Text per line.
  if (block.lines && block.lines.length > 1) {
    return (
      <View style={s.body}>
        {block.lines.map((line, i) => (
          <Text key={i} style={s.lineRow}>{line.length > 0 ? <Runs runs={line} /> : " "}</Text>
        ))}
      </View>
    );
  }
  return <Text style={s.body}><Runs runs={block.runs ?? []} /></Text>;
}

/**
 * Whether the pasted text already carries a confidentiality section of its own.
 *
 * Only a heading counts. A passing mention of the word in a sentence is not the writer taking
 * responsibility for the notice, but a heading is, and in that case the template must keep quiet.
 */
function writesOwnConfidentiality(blocks: RichBlock[]): boolean {
  return blocks.some((b) => isHeading(b.type)
    && /confidential/i.test((b.runs ?? []).map((r) => r.text).join(" ")));
}

interface Section {
  number: string;
  title: string;
  blocks: RichBlock[];
}

/**
 * h2 is the section: the level that gets the purple bar, the rule and the counted number.
 *
 * Fixed at h2 rather than read from whichever level the document happens to start at. That was too
 * clever: a stray h1 anywhere in a paste quietly demoted every h2 to a plain sub-heading, and the
 * numbering the document was supposed to carry disappeared with it. h1 is set larger and left
 * unnumbered, for the rare part title; h3 and h4 are sub-headings and never take a section number.
 */
const SECTION_LEVEL = "h2";

/**
 * Split the flat block list into numbered sections, one per h2.
 *
 * The writer's own numbering wins. A heading that already reads "07 Security Schedule" or
 * "7. Security Schedule" keeps its seven, because that is the number the body text and the client's
 * email will both refer to; renumbering it from the top produced a document whose contents page
 * disagreed with its own cross-references. Only headings that carry no number are given one, and they
 * are given the next one after the last number seen, so a mixed document still counts upwards.
 */
function toSections(blocks: RichBlock[]): { sections: Section[]; preamble: RichBlock[] } {
  const preamble: RichBlock[] = [];
  const sections: Section[] = [];
  const opensSection = SECTION_LEVEL;
  let last = 0;
  for (const block of blocks) {
    if (block.type === opensSection) {
      const heading = (block.runs ?? []).map((r) => r.text).join("").trim();
      const { number, title } = splitLeadingNumber(heading);
      const own = number ? Number.parseInt(number, 10) : NaN;
      if (Number.isFinite(own)) last = own;
      else last += 1;
      sections.push({
        // Padded to the kit's two digits when it is a plain number; a multi-level one is left as written.
        number: number && /^\d+$/.test(number) ? sectionNumber(Number.parseInt(number, 10)) : number ?? sectionNumber(last),
        title: title || heading || "Section",
        blocks: [],
      });
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
 * In the order a company is identified: the legal name, then how it is registered, then where it is,
 * then how to reach it. The registration numbers share one bracketed line, because they are one fact
 * about the company rather than two and a cover with a line per number reads like a form; the contact
 * lines are labelled, because an address, an email and a number stacked unlabelled are just a block of
 * small type.
 *
 * Each is included only when the company record holds it: an empty "RC" on a document going to a
 * client is worse than no RC at all. They are set in Settings, Company, and nothing here invents them.
 * The web address is not repeated, since it already runs up the spine.
 */
function preparedBy(company: CompanyInfo, address?: string): string[] {
  const registration = [
    ...(company.rcNumber ? [`RC ${company.rcNumber}`] : []),
    ...(company.tin ? [`TIN ${company.tin}`] : []),
  ].join("  |  ");
  return [
    company.legalName,
    ...(registration ? [`(${registration})`] : []),
    ...(address ? [address] : []),
    ...(company.email ? [`Email: ${company.email}`] : []),
    ...(company.phone ? [`Tel: ${company.phone}`] : []),
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
      headers={["Description", "Amount"]}
      rows={[
        ...items.map((i) => [i.description, naira(i.amount)]),
        ["Total", naira(total)],
      ]}
      widths={[3, 1]}
      align={["left", "right"]}
      emphasis={[...items.map((): RowEmphasis => "none"), "total"]}
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
  /*
   * The hierarchy the writer pasted, taken at its word: h1 is the document, h2 is a section.
   *
   * So an h1 at the head of the body is the title, and the title belongs on the cover. It is lifted
   * there when the form was left on its default — which for these kinds is the bare word "Proposal" or
   * "Scope of Work" — and removed from the body either way when it says what the cover already says.
   * Printing it in both places is how the same words ended up on the front page and again as the first
   * line inside.
   */
  const pasted = data.richContent ?? [];
  const first = pasted[0];
  const leadTitle = first?.type === "h1" ? (first.runs ?? []).map((r) => r.text).join("").trim() : "";
  const untouched = !data.title || data.title.trim() === data.kind;
  const coverTitle = leadTitle && untouched ? leadTitle : data.title || data.kind;
  const same = (a: string, b: string): boolean =>
    a.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() === b.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const body = leadTitle && (untouched || same(leadTitle, coverTitle)) ? pasted.slice(1) : pasted;

  const { sections, preamble } = toSections(body);
  const client = data.preparedFor || data.recipientCompany || data.recipientName || "Prepared for you";
  const running = `${data.kind.toUpperCase()}  ·  ${client.toUpperCase()}`;
  const footer = `${company.legalName}  |  Confidential  |  Prepared for the recipient named above`;
  // Whoever the document says wrote it, falling back to the company record rather than to nothing.
  const byLines = preparedBy(company, data.senderAddress);
  if (data.preparedBy) byLines[0] = data.preparedBy;
  // The client's address, when one was given. One entry, wrapped by the column as it needs.
  const clientLines = data.recipientAddress ? [data.recipientAddress] : [];

  return (
    <>
      {/* The cover is its own page with no padding: the artwork runs to the paper's edge. */}
      <Page size="A4" style={s.coverPage}>
        <BrandCover
          title={coverTitle}
          preparedFor={client}
          {...(clientLines.length > 0 ? { clientLines } : {})}
          preparedByLines={byLines}
          proposalDate={data.date}
          {...(data.validity ? { validity: data.validity } : {})}
          {...(logoWhite ? { logoWhite } : {})}
        />
      </Page>

      <Page size="A4" style={s.page}>
        <RunningFurniture runningTitle={running} footerText={footer} {...(logoPurple ? { logoPurple } : {})} />

        {/* Contents, only when the document has sections to list. A one-item contents page is
            furniture pretending to be navigation. */}
        {sections.length > 1 ? (
          <View>
            {/* Set with the same bar-and-title as every other section, so the contents page belongs
                to the document rather than looking like a cover sheet for it. */}
            <SectionHeading number="" title="Table of Contents" />
            <TableOfContents entries={sections.map((sec) => ({ number: sec.number, title: sec.title }))} />
            <View style={{ marginBottom: mm(10) }} />
          </View>
        ) : null}

        {/*
          * The confidentiality notice, in the document rather than across the foot of the cover.
          *
          * Printed only when the writer has not already written one. A document that carried both the
          * field and a pasted "Confidentiality" section said the same thing twice, a few centimetres
          * apart; between the two, the writer's own words win.
          */}
        {data.confidentiality && !writesOwnConfidentiality(body) ? (
          <Callout heading="Confidentiality Notice">{data.confidentiality}</Callout>
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
