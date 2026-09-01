/**
 * The branded Nexoris Technologies Document Engine (PRD 10.1). Each kind renders from its own
 * template so an Invoice and a Proposal never share a layout: NarrativeTemplate for the business
 * documents (Proposal, Scope of Work, Service Level Agreement, Contract), and InvoiceTemplate for
 * the financial invoice, laid out to international invoicing convention with a From/Bill-to block,
 * a Qty/Rate/Amount table, milestone or full billing, VAT, withholding tax, the amount in words,
 * and NRS e-invoicing fields. Text is real and selectable (Plus Jakarta Sans). Amounts in NGN.
 */
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type {
  CompanyInfo,
  DocumentData,
  InvoiceInfo,
  RichBlock,
  RichRun,
} from "./types.js";
import { computeInvoice, isHeading } from "./types.js";
import { nairaInWords } from "./amount-in-words.js";
import { AgreementPages, SANS_BOLD, SANS_ITALIC, a as A } from "./agreement-layout.js";
import { BrandedTemplate } from "./branded-layout.js";
import { drawWidth } from "./image-size.js";

const C = {
  purple: "#543CDA",
  purpleSoft: "#EEEBFC",
  ink: "#161726",
  grey: "#5b5b6b",
  line: "#e5e5ee",
  faint: "#f6f5fb",
};

const DEFAULT_COMPANY: CompanyInfo = {
  legalName: "Nexoris Technologies Ltd",
  tin: null,
  address: "No. 5, Mojisola Dokpesi Street, Ajah, Lekki Lagos",
  email: "business@nexoristech.com",
  phone: "+234 913 813 3224",
  vatRate: 7.5,
  nrsEnabled: false,
};

function naira(amount: number): string {
  return `NGN ${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Render text that may contain newlines. @react-pdf's text engine throws (unitsPerEm on an
 * unresolved run) on a literal "\n" inside a single <Text> when a TTF is registered, so every line
 * is rendered as its own <Text> and blank lines are preserved as spacing. The container style
 * carries layout and inherited text properties (font size, colour, line height).
 */
type StyleProp = React.ComponentProps<typeof View>["style"];

function TextLines({
  text,
  style,
  lineStyle,
}: {
  text: string;
  style?: StyleProp;
  lineStyle?: StyleProp;
}): React.ReactElement {
  const lines = text.split(/\r?\n/);
  return (
    <View {...(style ? { style } : {})}>
      {lines.map((line, i) => (
        <Text key={i} {...(lineStyle ? { style: lineStyle } : {})}>
          {line.length > 0 ? line : " "}
        </Text>
      ))}
    </View>
  );
}

const base = StyleSheet.create({
  page: { paddingTop: 0, paddingBottom: 56, fontFamily: "Jakarta", fontSize: 10, color: C.ink },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 40,
    right: 40,
    fontSize: 8,
    color: C.grey,
    textAlign: "center",
  },
});

function Footer({ company }: { company: CompanyInfo }): React.ReactElement {
  return (
    <Text
      style={base.footer}
      fixed
      render={({ pageNumber, totalPages }) =>
        `${company.legalName}  -  ${company.address}  -  ${company.email}  -  Page ${pageNumber} of ${totalPages}`
      }
    />
  );
}

/* ------------------------------- Narrative -------------------------------- */

const n = StyleSheet.create({
  header: {
    backgroundColor: C.purple,
    paddingHorizontal: 40,
    paddingVertical: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: { width: 26, height: 30 },
  brand: { fontSize: 13, fontWeight: 700, color: "#fff" },
  kindTag: { fontSize: 8, color: "#e7e2ff", marginTop: 2, textTransform: "uppercase", letterSpacing: 1 },
  headRight: { fontSize: 8, color: "#e7e2ff", textAlign: "right", lineHeight: 1.5 },
  content: { paddingHorizontal: 40, paddingTop: 24 },
  title: { fontSize: 20, fontWeight: 700, marginBottom: 4, lineHeight: 1.2 },
  subtitle: { fontSize: 9.5, color: C.grey, marginBottom: 16, lineHeight: 1.5 },

  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: C.faint,
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 18,
    gap: 18,
  },
  metaItem: { minWidth: 118 },
  metaKey: { fontSize: 7.5, color: C.grey, textTransform: "uppercase", letterSpacing: 0.5 },
  metaVal: { fontSize: 10, fontWeight: 700, marginTop: 2 },

  intro: { marginBottom: 16, lineHeight: 1.55 },
  section: { marginBottom: 14 },
  h2: { fontSize: 11.5, fontWeight: 700, marginBottom: 4, color: C.purple },
  body: { lineHeight: 1.55 },

  /*
   * The agreement body, at the executed agreement's own setting.
   *
   * Arial 11 on 14.6 leading with twelve points between paragraphs, every line flush to the margin,
   * headings in bold at 14, 12 and 11 point. Nothing is indented and nothing is coloured: an
   * instrument is read in one column of black text, and the purple sub-headings this template used to
   * print were a brochure's habit carried into a contract.
   *
   * Helvetica is Arial's metric twin and is built into every reader, so bold is selected by naming the
   * face rather than by weight — Helvetica-Bold is a font in its own right.
   */
  richPara: { marginBottom: 12 },
  richLine: {},
  richH1: { fontFamily: SANS_BOLD, fontSize: 14, marginTop: 20, marginBottom: 8 },
  richH2: { fontFamily: SANS_BOLD, fontSize: 14, marginTop: 18, marginBottom: 8 },
  richH3: { fontFamily: SANS_BOLD, fontSize: 12, marginTop: 14, marginBottom: 6 },
  richH4: { fontFamily: SANS_BOLD, fontSize: 11, marginTop: 12, marginBottom: 5 },
  rBold: { fontFamily: SANS_BOLD },
  rUnderline: { textDecoration: "underline" },
  rAccent: { fontFamily: SANS_ITALIC },
  rLink: { textDecoration: "underline" },
  listRow: { flexDirection: "row", marginBottom: 6 },
  /** Width is set per list from the widest marker in it; this is the floor. */
  listMark: { width: 16, flexShrink: 0 },
  listText: { flex: 1 },
  /* A pasted outline, kept as a structure: indent per level, hairline rail, no invented connectors. */
  tree: { marginTop: 3, marginBottom: 8, paddingLeft: 4 },
  treeRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 1.2 },
  treeRail: { width: 12, alignSelf: "stretch", borderLeftWidth: 0.6, borderLeftColor: C.line },
  treeMark: { width: 10, color: C.grey },
  treeText: { flex: 1 },

  figure: { marginTop: 6, marginBottom: 9, alignItems: "center" },
  figureImage: { maxHeight: 480, objectFit: "contain" },
  figureCaption: { fontSize: 8.4, color: C.grey, marginTop: 4, textAlign: "center" },
  figureMissing: {
    fontSize: 8.4, color: C.grey, width: "100%", borderWidth: 0.6, borderColor: C.line,
    borderStyle: "dashed", paddingVertical: 9, paddingHorizontal: 9, textAlign: "center",
  },

  table: { marginTop: 8, marginBottom: 6, borderWidth: 1, borderColor: C.line, borderRadius: 4 },
  thead: { flexDirection: "row", backgroundColor: C.purpleSoft, paddingVertical: 7, paddingHorizontal: 10 },
  row: { flexDirection: "row", borderTopWidth: 1, borderTopColor: C.line, paddingVertical: 7, paddingHorizontal: 10 },
  totalRow: { flexDirection: "row", borderTopWidth: 2, borderTopColor: C.ink, paddingVertical: 8, paddingHorizontal: 10 },
  cellDesc: { flex: 1 },
  cellAmt: { width: 130, textAlign: "right" },
  /** By family, not weight: see the note above rBold. A header row that is not bold is not a header. */
  bold: { fontFamily: SANS_BOLD },

  signWrap: { marginTop: 26, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 16 },
  signCols: { flexDirection: "row", alignItems: "flex-end", gap: 28 },
  signBox: { flex: 1 },
  signLabel: { fontSize: 7.5, color: C.grey, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  sigName: { fontSize: 18, fontWeight: 700, color: C.purple, minHeight: 22, letterSpacing: 0.3 },
  sigLine: { borderTopWidth: 1, borderTopColor: C.ink, marginTop: 2, paddingTop: 3 },
  sigStrong: { fontSize: 9, fontWeight: 700, color: C.ink },
  sigMeta: { fontSize: 8.5, color: C.grey, marginTop: 1 },

  sealWrap: { width: 92, alignItems: "center", justifyContent: "flex-end" },
  seal: { width: 84, height: 84, borderRadius: 42, borderWidth: 2, borderColor: C.purple, alignItems: "center", justifyContent: "center" },
  sealInner: { width: 72, height: 72, borderRadius: 36, borderWidth: 0.75, borderColor: C.purple, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  sealLogo: { width: 15, height: 17, marginBottom: 2 },
  sealBrand: { fontSize: 7, fontWeight: 700, color: C.purple, textAlign: "center", textTransform: "uppercase", letterSpacing: 0.4, lineHeight: 1.2 },
  sealSub: { fontSize: 5.5, color: C.purple, textAlign: "center", marginTop: 2, textTransform: "uppercase", letterSpacing: 0.4 },
  sealImg: { width: 84, height: 84, objectFit: "contain" },
  /** Reserved height above the rule, so inserting a signature never reflows the page. */
  sigSlot: { height: 34, justifyContent: "flex-end" },
  /** Aspect preserved and left-aligned, so a wide signature keeps its orientation. */
  sigImg: { height: 32, maxWidth: 150, objectFit: "contain", objectPosition: "left bottom" },
});

/**
 * Inline runs for a rich block. Bold uses Jakarta 700 and underline uses text decoration, both of
 * which the registered brand font supports. Italic has no registered face, so emphasised text is
 * kept but shown in the brand accent rather than a synthetic slant, which react-pdf cannot lay out.
 */
/**
 * Fold any line break inside an inline run down to a single space.
 *
 * A run sits inside a block that already carries the paragraph structure, so a newline within one is
 * incidental whitespace from the source HTML rather than an intended break. Folding it keeps the
 * sentence and, more importantly, keeps react-pdf alive: see the note in RichRuns.
 */
function collapseNewlines(text: string): string {
  return text.replace(/\s*\r?\n\s*/g, " ");
}

function RichRuns({ runs }: { runs: RichRun[] }): React.ReactElement {
  return (
    <>
      {runs.map((run, i) => {
        const parts = [];
        if (run.bold) parts.push(n.rBold);
        if (run.underline) parts.push(n.rUnderline);
        if (run.href) parts.push(n.rLink);
        else if (run.italic) parts.push(n.rAccent);
        /*
         * Newlines are collapsed, not rendered.
         *
         * react-pdf throws "Cannot read properties of undefined (reading unitsPerEm)" on a literal
         * newline inside a single <Text> when a TTF is registered. TextLines above exists for exactly
         * that reason and splits block text into one <Text> per line; runs never got the same
         * treatment, so a paragraph whose inline text carried a line break, which is what pasting
         * multi-line copy into the editor produces, crashed the whole render. The endpoint returned
         * 500 and the CRM reported "Could not generate the document. Check the fields and retry",
         * which sent people looking at fields that were fine.
         *
         * A run is inline, inside a block that already carries the paragraph structure, so a newline
         * within one is incidental whitespace from the source HTML rather than an intended break.
         * Collapsing it to a single space keeps the sentence and cannot crash.
         */
        const text = collapseNewlines(run.text);
        return (
          <Text key={i} style={parts}>
            {text.length > 0 ? text : " "}
          </Text>
        );
      })}
    </>
  );
}

/**
 * A pasted table, set plainly for an agreement.
 *
 * No purple header band here: a schedule inside a contract is read, not sold. Rules and a tinted
 * header are enough to make the columns legible, and the point is only that the cells stay separate
 * instead of running together into a sentence, which is what flattening them to a paragraph did.
 */
function RichTableView({ block }: { block: RichBlock }): React.ReactElement {
  const rows = block.rows ?? [];
  if (rows.length === 0) return <Text />;
  const header = block.headerRow === true ? rows[0] : undefined;
  const body = block.headerRow === true ? rows.slice(1) : rows;
  const columns = Math.max(...rows.map((r) => r.length));
  return (
    <View style={n.table}>
      {header ? (
        <View style={n.thead} fixed>
          {Array.from({ length: columns }, (_, i) => (
            <Text key={i} style={[n.cellDesc, n.bold]}><RichRuns runs={header[i] ?? []} /></Text>
          ))}
        </View>
      ) : null}
      {body.map((row, r) => (
        <View key={r} style={n.row} wrap={false}>
          {Array.from({ length: columns }, (_, i) => (
            <Text key={i} style={n.cellDesc}><RichRuns runs={row[i] ?? []} /></Text>
          ))}
        </View>
      ))}
    </View>
  );
}

function RichBlockView({ block }: { block: RichBlock }): React.ReactElement {
  if (isHeading(block.type)) {
    /*
     * The heading exactly as written, at the level it was written.
     *
     * Including its own number: "14. Confidentiality" prints as "14. Confidentiality". The template
     * neither renumbers it nor strips it, because that number is what the parties cite.
     */
    const style = block.type === "h1" ? n.richH1
      : block.type === "h2" ? n.richH2
        : block.type === "h3" ? n.richH3 : n.richH4;
    return (
      <View minPresenceAhead={40} wrap={false}>
        <Text style={style}><RichRuns runs={block.runs ?? []} /></Text>
      </View>
    );
  }
  if (block.type === "table") {
    return <RichTableView block={block} />;
  }
  if (block.type === "image") {
    // The picture and its caption, or the caption in a ruled frame when the picture could not travel.
    return (
      <View style={n.figure} minPresenceAhead={40} wrap={false}>
        {block.src ? <Image src={block.src} style={[n.figureImage, { width: drawWidth(block.src, 483) }]} /> : null}
        {block.caption && block.caption.length > 0 ? (
          <Text style={block.src ? n.figureCaption : n.figureMissing}>
            {block.src ? null : "Illustration not embedded: "}
            <RichRuns runs={block.caption} />
          </Text>
        ) : null}
      </View>
    );
  }
  if (block.type === "tree") {
    // A schedule or an architecture pasted as an outline keeps its shape here too. The connectors are
    // drawn as rules rather than reproduced as characters, which the embedded fonts cannot draw.
    return (
      <View style={n.tree}>
        {(block.items ?? []).map((item, i) => {
          const level = block.itemLevels?.[i] ?? 0;
          return (
            <View key={i} style={n.treeRow} wrap={false}>
              {Array.from({ length: level }, (_, r) => <View key={r} style={n.treeRail} />)}
              <Text style={n.treeMark}>{level === 0 ? " " : "-"}</Text>
              <Text style={[n.treeText, ...(level === 0 ? [n.rBold] : [])]}>
                <RichRuns runs={item} />
              </Text>
            </View>
          );
        })}
      </View>
    );
  }
  if (block.type === "bulleted" || block.type === "numbered") {
    // Wide enough for the widest marker this list actually uses, so "(viii)" is not broken in half.
    const markers = block.itemMarkers ?? [];
    const markWidth = Math.max(16, markers.reduce((w, m) => Math.max(w, m.length), 1) * 5 + 4);
    return (
      <View style={{ marginBottom: 8 }}>
        {(block.items ?? []).map((item, i) => {
          const level = block.itemLevels?.[i] ?? 0;
          // The marker the source gave, so an agreement's own (a), (b), (i) lettering survives.
          const mark = markers[i] ?? (block.type === "numbered" ? `${i + 1}.` : "•");
          return (
            <View key={i} style={[n.listRow, ...(level > 0 ? [{ marginLeft: level * 14 }] : [])]}>
              <Text style={[n.listMark, { width: markWidth }]}>{mark}</Text>
              <Text style={n.listText}>
                <RichRuns runs={item} />
              </Text>
            </View>
          );
        })}
      </View>
    );
  }
  if (block.lines && block.lines.length > 1) {
    return (
      <View style={n.richPara}>
        {block.lines.map((line, i) => (
          <Text key={i} style={n.richLine}>{line.length > 0 ? <RichRuns runs={line} /> : " "}</Text>
        ))}
      </View>
    );
  }
  return (
    /*
     * A clause paragraph, kept with the number it opens with.
     *
     * "1.12 Fees: ..." is a sub-clause, not prose that happens to begin with a decimal, and it reads
     * as one when its number is set in bold and run into the line — which is how the executed
     * agreement sets it. The number is the drafter's; nothing here counts or renumbers. Everything
     * after it is left exactly as pasted, so a paste that already carries its own bolding keeps it
     * and a plain one is not given emphasis it never had.
     */
    <Text style={n.richPara} minPresenceAhead={28}>
      <SubNumber runs={block.runs ?? []} />
    </Text>
  );
}

/**
 * The runs of a paragraph, with its clause number and defined term set in bold.
 *
 * A numbered clause that opens by defining something — "1.12 Fees: "Fees" means the professional
 * fees payable by the Client" — carries the term in bold along with the number, which is how the
 * executed agreement sets it and how a reader finds a definition without reading the paragraph. So
 * the bold runs from the start of the line through the first colon.
 *
 * Only after a number, and only across a short run of words. Without both conditions a clause whose
 * first sentence happens to contain a colon would come out with half its opening in bold.
 */
function SubNumber({ runs }: { runs: RichRun[] }): React.ReactElement {
  const first = runs[0];
  const lead = first && !first.bold ? /^\s*(\d+(?:\.\d+)+|\(?[a-z0-9]{1,3}[.)])\s+/i.exec(first.text) : null;
  if (!lead) return <RichRuns runs={runs} />;

  // The defined term after the number: up to five words, ending at the colon that closes it.
  const rest = first!.text.slice(lead[0].length);
  const term = /^([^:\n]{1,48}:)\s*/.exec(rest);
  const runIn = term && term[1]!.split(/\s+/).length <= 5 ? term[0] : "";
  const strong = lead[0].trimEnd() + (runIn ? ` ${runIn.trimEnd()}` : "");
  const remainder = rest.slice(runIn.length);

  return (
    <>
      <Text style={n.rBold}>{strong}</Text>
      <Text>{" "}</Text>
      <RichRuns runs={[{ ...first!, text: remainder }, ...runs.slice(1)]} />
    </>
  );
}
/*
 * PricingTable was removed with ProposalTemplate.
 *
 * The investment table it drew now lives in branded-layout, set in the kit's table style, so the
 * Proposal still states its price; only the styling moved.
 */

/*
 * ProposalTemplate used to live here and has been removed.
 *
 * The Proposal and the Scope of Work now render from the branding kit, in branded-layout, so this
 * was a second design for the same document sitting unreferenced next to the one in use. The kit is
 * the authority for how these look, and two layouts for one kind is how they drift apart.
 */

function StructuredTemplate({
  data,
  company,
  mark,
  stamp,
  signature,
}: {
  data: DocumentData;
  company: CompanyInfo;
  mark?: Buffer;
  stamp?: Buffer;
  signature?: Buffer;
}): React.ReactElement {
  const rich = data.richContent ?? [];

  // Group the pasted blocks into clauses: a heading opens a new clause and everything under it belongs
  // to that clause, so numbering follows the drafter's own structure rather than counting paragraphs.
  /*
   * The agreement is the text, laid out as the text was written.
   *
   * Nothing is numbered here and nothing is indented. An agreement carries its own numbering — the
   * drafter wrote "1.12" because clause 1.12 is what the parties will argue about — and a template
   * that adds its own produces "3. 14. Confidentiality" and a body full of cross-references pointing
   * at the wrong clause. The hanging indent went with it: a column reserved for a number that is not
   * there is a margin of white down the page and a text block that starts nowhere in particular.
   *
   * This is the setting of the Master Software Development Agreement itself: every line flush to the
   * margin, the clause number run into the first line of its own paragraph, and the wrapped lines
   * returning to the margin under it.
   */
  return (
    <AgreementPages
      data={data}
      company={company}
      {...(mark ? { mark } : {})}
      {...(stamp ? { stamp } : {})}
      {...(signature ? { signature } : {})}
    >
      {rich.length > 0
        ? rich.map((block, i) => <RichBlockView key={i} block={block} />)
        : data.sections.map((section, i) => (
            <View key={i} style={A.clause}>
              {section.heading ? <Text style={A.clauseHeading}>{section.heading}</Text> : null}
              <TextLines text={section.body} style={A.clauseText} />
            </View>
          ))}
    </AgreementPages>
  );
}

/** Invoice layout. Recovered verbatim from the compiled bundle after an edit removed it. */
const iv = StyleSheet.create({
    top: {
        paddingHorizontal: 40,
        paddingTop: 28,
        flexDirection: "row",
        justifyContent: "space-between"
    },
    brandRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10
    },
    logo: {
        width: 24,
        height: 28
    },
    brand: {
        fontSize: 12,
        fontWeight: 700,
        color: C.ink
    },
    companyMeta: {
        fontSize: 8.5,
        color: C.grey,
        marginTop: 4,
        lineHeight: 1.5
    },
    invoiceWord: {
        fontSize: 26,
        fontWeight: 700,
        color: C.purple,
        textAlign: "right"
    },
    invNumber: {
        fontSize: 9,
        color: C.grey,
        textAlign: "right",
        marginTop: 2
    },
    statusPill: {
        marginTop: 6,
        alignSelf: "flex-end",
        backgroundColor: C.purpleSoft,
        color: C.purple,
        fontSize: 8,
        fontWeight: 700,
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: 999,
        textTransform: "uppercase"
    },
    parties: {
        paddingHorizontal: 40,
        marginTop: 22,
        flexDirection: "row",
        gap: 24
    },
    party: {
        flex: 1
    },
    partyLabel: {
        fontSize: 8,
        fontWeight: 700,
        color: C.purple,
        textTransform: "uppercase",
        marginBottom: 4
    },
    partyText: {
        fontSize: 9.5,
        lineHeight: 1.5,
        color: C.ink
    },
    metaStrip: {
        marginHorizontal: 40,
        marginTop: 18,
        flexDirection: "row",
        backgroundColor: C.faint,
        borderRadius: 4,
        paddingVertical: 8,
        paddingHorizontal: 12,
        gap: 20
    },
    metaItem: {},
    metaKey: {
        fontSize: 7.5,
        color: C.grey,
        textTransform: "uppercase",
        letterSpacing: 0.5
    },
    metaVal: {
        fontSize: 9.5,
        fontWeight: 700,
        marginTop: 1
    },
    table: {
        marginHorizontal: 40,
        marginTop: 20
    },
    thead: {
        flexDirection: "row",
        backgroundColor: C.purple,
        color: "#fff",
        paddingVertical: 7,
        paddingHorizontal: 8,
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4
    },
    row: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: C.line,
        paddingVertical: 7,
        paddingHorizontal: 8
    },
    cDesc: {
        flex: 1
    },
    cQty: {
        width: 44,
        textAlign: "right"
    },
    cRate: {
        width: 92,
        textAlign: "right"
    },
    cAmt: {
        width: 100,
        textAlign: "right"
    },
    white: {
        color: "#fff"
    },
    totals: {
        marginHorizontal: 40,
        marginTop: 12,
        flexDirection: "row",
        justifyContent: "flex-end"
    },
    totalsBox: {
        width: 260
    },
    tRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 3
    },
    tKey: {
        color: C.grey
    },
    grand: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 4,
        paddingTop: 6,
        borderTopWidth: 2,
        borderTopColor: C.ink
    },
    grandVal: {
        fontSize: 12,
        fontWeight: 700,
        color: C.purple
    },
    bankBox: {
        marginTop: 6,
        padding: 8,
        borderRadius: 4,
        backgroundColor: C.purpleSoft,
        flexDirection: "row",
        justifyContent: "space-between"
    },
    words: {
        marginHorizontal: 40,
        marginTop: 16,
        fontSize: 9,
        color: C.ink
    },
    block: {
        marginHorizontal: 40,
        marginTop: 16
    },
    blockLabel: {
        fontSize: 8,
        fontWeight: 700,
        color: C.purple,
        textTransform: "uppercase",
        marginBottom: 3
    },
    blockText: {
        fontSize: 9,
        lineHeight: 1.5,
        color: C.grey
    },
    nrs: {
        marginHorizontal: 40,
        marginTop: 16,
        padding: 10,
        borderWidth: 1,
        borderColor: C.line,
        borderRadius: 4,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },
    qr: {
        width: 46,
        height: 46,
        borderWidth: 1,
        borderColor: C.line,
        borderRadius: 3,
        alignItems: "center",
        justifyContent: "center"
    },
    bold: {
        fontWeight: 700
    }
});

/** How an engagement type reads on an invoice. */
const ENGAGEMENT_LABEL: Record<string, string> = {
  "one-off": "One-off project",
  retainer: "Retainer",
  project: "Project",
};

function InvoiceTemplate({
  data,
  invoice,
  company,
  logo,
}: {
  data: DocumentData;
  invoice: InvoiceInfo;
  company: CompanyInfo;
  logo?: Buffer;
}): React.ReactElement {
  const t = computeInvoice(invoice, company.vatRate);
  const billTo = [invoice.clientCompany, invoice.clientName].filter(Boolean).join("\n") || "The client";
  const isMilestone = invoice.billingBasis === "milestone";

  return (
    <Page size="A4" style={base.page}>
      <View style={iv.top}>
        <View>
          <View style={iv.brandRow}>
            {logo ? <Image src={{ data: logo, format: "png" }} style={iv.logo} /> : null}
            <Text style={iv.brand}>Nexoris Technologies</Text>
          </View>
          <TextLines
            style={iv.companyMeta}
            text={[
              company.legalName,
              company.address,
              `${company.email}  |  ${company.phone}`,
              company.tin ? `TIN: ${company.tin}` : null,
            ]
              .filter(Boolean)
              .join("\n")}
          />
        </View>
        <View>
          <Text style={iv.invoiceWord}>INVOICE</Text>
          <Text style={iv.invNumber}>{invoice.invoiceNumber}</Text>
          <Text style={iv.statusPill}>{company.nrsEnabled ? "NRS Pending" : "Draft"}</Text>
        </View>
      </View>

      <View style={iv.parties}>
        <View style={iv.party}>
          <Text style={iv.partyLabel}>Bill to</Text>
          <TextLines
            style={iv.partyText}
            text={[billTo, invoice.clientAddress, invoice.clientTin ? `TIN: ${invoice.clientTin}` : null]
              .filter(Boolean)
              .join("\n")}
          />
        </View>
        <View style={iv.party}>
          <Text style={iv.partyLabel}>From</Text>
          <TextLines
            style={iv.partyText}
            text={[company.legalName, company.address, company.tin ? `TIN: ${company.tin}` : null]
              .filter(Boolean)
              .join("\n")}
          />
        </View>
      </View>

      <View style={iv.metaStrip}>
        <View style={iv.metaItem}>
          <Text style={iv.metaKey}>Issue date</Text>
          <Text style={iv.metaVal}>{data.date}</Text>
        </View>
        {invoice.dueDate ? (
          <View style={iv.metaItem}>
            <Text style={iv.metaKey}>Due date</Text>
            <Text style={iv.metaVal}>{invoice.dueDate}</Text>
          </View>
        ) : null}
        <View style={iv.metaItem}>
          <Text style={iv.metaKey}>Engagement</Text>
          <Text style={iv.metaVal}>{ENGAGEMENT_LABEL[invoice.engagementType]}</Text>
        </View>
        <View style={iv.metaItem}>
          <Text style={iv.metaKey}>Billing</Text>
          <Text style={iv.metaVal}>
            {isMilestone
              ? `${invoice.milestoneLabel || "Milestone"} · ${invoice.milestonePercent ?? 0}%`
              : "Full payment"}
          </Text>
        </View>
      </View>

      <View style={iv.table}>
        <View style={iv.thead}>
          <Text style={[iv.cDesc, iv.white, iv.bold]}>Description</Text>
          <Text style={[iv.cQty, iv.white, iv.bold]}>Qty</Text>
          <Text style={[iv.cRate, iv.white, iv.bold]}>Rate</Text>
          <Text style={[iv.cAmt, iv.white, iv.bold]}>Amount</Text>
        </View>
        {invoice.lineItems.map((line, i) => (
          <View key={i} style={iv.row}>
            <Text style={iv.cDesc}>{line.description}</Text>
            <Text style={iv.cQty}>{String(line.quantity)}</Text>
            <Text style={iv.cRate}>{naira(line.rate)}</Text>
            <Text style={iv.cAmt}>{naira(Math.max(0, line.quantity) * Math.max(0, line.rate))}</Text>
          </View>
        ))}
      </View>

      <View style={iv.totals}>
        <View style={iv.totalsBox}>
          {isMilestone ? (
            <>
              <View style={iv.tRow}>
                <Text style={iv.tKey}>Engagement value</Text>
                <Text>{naira(t.itemsSubtotal)}</Text>
              </View>
              <View style={iv.tRow}>
                <Text style={iv.tKey}>
                  {`This invoice: ${invoice.milestoneLabel || "Milestone"} (${invoice.milestonePercent ?? 0}%)`}
                </Text>
                <Text style={iv.bold}>{naira(t.billableBase)}</Text>
              </View>
            </>
          ) : (
            <View style={iv.tRow}>
              <Text style={iv.tKey}>Subtotal</Text>
              <Text>{naira(t.billableBase)}</Text>
            </View>
          )}
          {invoice.vatEnabled ? (
            <View style={iv.tRow}>
              <Text style={iv.tKey}>{`VAT (${company.vatRate}%)`}</Text>
              <Text>{naira(t.vat)}</Text>
            </View>
          ) : null}
          <View style={iv.grand}>
            <Text style={iv.bold}>Total</Text>
            <Text style={iv.grandVal}>{naira(t.total)}</Text>
          </View>
          {invoice.whtRate > 0 ? (
            <>
              <View style={[iv.tRow, { marginTop: 4 }]}>
                <Text style={iv.tKey}>{`Less WHT the client withholds (${invoice.whtRate}%)`}</Text>
                <Text>{`-${naira(t.wht)}`}</Text>
              </View>
              <View style={iv.bankBox}>
                <Text style={iv.bold}>Amount due to bank</Text>
                <Text style={iv.bold}>{naira(t.amountDueToBank)}</Text>
              </View>
            </>
          ) : null}
        </View>
      </View>

      <Text style={iv.words}>Amount in words: {nairaInWords(invoice.whtRate > 0 ? t.amountDueToBank : t.total)}.</Text>

      {invoice.bankDetails ? (
        <View style={iv.block}>
          <Text style={iv.blockLabel}>Payment details</Text>
          <TextLines style={iv.blockText} text={invoice.bankDetails} />
        </View>
      ) : null}

      {invoice.notes ? (
        <View style={iv.block}>
          <Text style={iv.blockLabel}>Notes</Text>
          <TextLines style={iv.blockText} text={invoice.notes} />
        </View>
      ) : null}

      <View style={iv.nrs}>
        <View>
          <Text style={iv.blockLabel}>NRS e-invoicing</Text>
          <TextLines
            style={iv.blockText}
            text={`IRN: ${company.nrsEnabled ? "pending submission" : "not applicable yet"}\nStatus: ${
              company.nrsEnabled ? "Pending" : "Not applicable"
            }`}
          />
        </View>
        <View style={iv.qr}>
          <TextLines
            lineStyle={{ fontSize: 6, color: C.grey, textAlign: "center" }}
            text={"QR on\nsubmission"}
          />
        </View>
      </View>

      <Footer company={company} />
    </Page>
  );
}

/* ------------------------------- Dispatcher ------------------------------- */

export function NexorisDocument({
  data,
  logo,
  mark,
  stamp,
  signature,
  brandLogoWhite,
  brandLogoPurple,
}: {
  data: DocumentData;
  /** White mark, for the proposal's purple cover band. */
  logo?: Buffer;
  /** Purple mark, for the agreements' plain letterhead. */
  mark?: Buffer;
  stamp?: Buffer;
  signature?: Buffer;
  /** The branding kit's marks: white for the navy cover, purple for the running header. */
  brandLogoWhite?: Buffer;
  brandLogoPurple?: Buffer;
}): React.ReactElement {
  const company = data.company ?? DEFAULT_COMPANY;
  const brand = {
    ...(logo ? { logo } : {}),
    ...(mark ? { mark } : {}),
    ...(stamp ? { stamp } : {}),
    ...(signature ? { signature } : {}),
  };
  return (
    <Document title={`${data.kind}: ${data.title}`} author="Nexoris Technologies">
      {data.kind === "Invoice" && data.invoice ? (
        <InvoiceTemplate data={data} invoice={data.invoice} company={company} {...(logo ? { logo } : {})} />
      ) : data.kind === "Proposal" || data.kind === "Scope of Work" ? (
        /* The two documents a client reads before anything is agreed, so both carry the full brand
           from the kit: navy cover, contents, numbered sections. The agreements below deliberately
           do not. */
        <BrandedTemplate
          data={data}
          company={company}
          {...(brandLogoWhite ? { logoWhite: brandLogoWhite } : {})}
          {...(brandLogoPurple ? { logoPurple: brandLogoPurple } : {})}
          {...(stamp ? { stamp } : {})}
          {...(signature ? { signature } : {})}
        />
      ) : (
        <StructuredTemplate data={data} company={company} {...brand} />
      )}
    </Document>
  );
}
