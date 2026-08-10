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
  LineItem,
  RichBlock,
  RichRun,
} from "./types.js";
import { computeInvoice } from "./types.js";
import { nairaInWords } from "./amount-in-words.js";
import { CoverPage, DocumentInfoPage, TableOfContentsPage, tocEntries, AcceptancePage, ContactPage, PageFurniture, p as P } from "./proposal-layout.js";
import { AgreementPages, Clause, a as A } from "./agreement-layout.js";

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

  richPara: { marginBottom: 8, lineHeight: 1.55 },
  richH2: { fontSize: 14, fontWeight: 700, marginTop: 10, marginBottom: 5, color: C.ink },
  richH3: { fontSize: 11.5, fontWeight: 700, marginTop: 7, marginBottom: 3, color: C.purple },
  rBold: { fontWeight: 700 },
  rUnderline: { textDecoration: "underline" },
  rAccent: { color: C.purple },
  rLink: { color: C.purple, textDecoration: "underline" },
  listRow: { flexDirection: "row", marginBottom: 3, paddingLeft: 4 },
  listMark: { width: 16, lineHeight: 1.5 },
  listText: { flex: 1, lineHeight: 1.5 },

  table: { marginTop: 8, marginBottom: 6, borderWidth: 1, borderColor: C.line, borderRadius: 4 },
  thead: { flexDirection: "row", backgroundColor: C.purpleSoft, paddingVertical: 7, paddingHorizontal: 10 },
  row: { flexDirection: "row", borderTopWidth: 1, borderTopColor: C.line, paddingVertical: 7, paddingHorizontal: 10 },
  totalRow: { flexDirection: "row", borderTopWidth: 2, borderTopColor: C.ink, paddingVertical: 8, paddingHorizontal: 10 },
  cellDesc: { flex: 1 },
  cellAmt: { width: 130, textAlign: "right" },
  bold: { fontWeight: 700 },

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
function RichRuns({ runs }: { runs: RichRun[] }): React.ReactElement {
  return (
    <>
      {runs.map((run, i) => {
        const parts = [];
        if (run.bold) parts.push(n.rBold);
        if (run.underline) parts.push(n.rUnderline);
        if (run.href) parts.push(n.rLink);
        else if (run.italic) parts.push(n.rAccent);
        return (
          <Text key={i} style={parts}>
            {run.text.length > 0 ? run.text : " "}
          </Text>
        );
      })}
    </>
  );
}

function RichBlockView({ block }: { block: RichBlock }): React.ReactElement {
  if (block.type === "h2") {
    return (
      <Text style={n.richH2}>
        <RichRuns runs={block.runs ?? []} />
      </Text>
    );
  }
  if (block.type === "h3") {
    return (
      <Text style={n.richH3}>
        <RichRuns runs={block.runs ?? []} />
      </Text>
    );
  }
  if (block.type === "bulleted" || block.type === "numbered") {
    return (
      <View style={{ marginBottom: 8 }}>
        {(block.items ?? []).map((item, i) => (
          <View key={i} style={n.listRow}>
            <Text style={n.listMark}>{block.type === "numbered" ? `${i + 1}.` : "•"}</Text>
            <Text style={n.listText}>
              <RichRuns runs={item} />
            </Text>
          </View>
        ))}
      </View>
    );
  }
  return (
    <Text style={n.richPara}>
      <RichRuns runs={block.runs ?? []} />
    </Text>
  );
}

function PricingTable({
  items,
  total,
  label,
}: {
  items: LineItem[];
  total: number;
  label: string;
}): React.ReactElement {
  return (
    <View wrap={false}>
      <Text style={n.h2}>{label}</Text>
      <View style={n.table}>
        <View style={n.thead}>
          <Text style={[n.cellDesc, n.bold]}>Item</Text>
          <Text style={[n.cellAmt, n.bold]}>Amount</Text>
        </View>
        {items.map((item, i) => (
          <View key={i} style={n.row}>
            <Text style={n.cellDesc}>{item.description}</Text>
            <Text style={n.cellAmt}>{naira(item.amount)}</Text>
          </View>
        ))}
        <View style={n.totalRow}>
          <Text style={[n.cellDesc, n.bold]}>Total</Text>
          <Text style={[n.cellAmt, n.bold]}>{naira(total)}</Text>
        </View>
      </View>
      <Text style={{ fontSize: 8, color: C.grey, marginTop: 3 }}>
        Final figures and terms are confirmed in writing before any work begins.
      </Text>
    </View>
  );
}


/**
 * The Proposal, laid out to the approved handoff: a cover page, document information with the
 * confidentiality notice, the body the writer pasted into the editor, an acceptance page, and a
 * contact page. Everything except the body is furniture; the writer supplies only the content.
 */
function ProposalTemplate({
  data,
  company,
  logo,
  stamp,
  signature,
}: {
  data: DocumentData;
  company: CompanyInfo;
  logo?: Buffer;
  stamp?: Buffer;
  signature?: Buffer;
}): React.ReactElement {
  const items = data.lineItems ?? [];
  const total = items.reduce((sum, i) => sum + i.amount, 0);
  const client = [data.recipientCompany, data.recipientName].filter(Boolean).join(", ");
  const rich = data.richContent ?? [];
  const toc = tocEntries(rich);

  return (
    <>
      <CoverPage
        data={data}
        company={company}
        client={client}
        {...(data.subtitle ? { subtitle: data.subtitle } : {})}
        {...(logo ? { logo } : {})}
      />
      <DocumentInfoPage data={data} company={company} client={client} />
      {/* Only worth a page when the body actually has sections to list. */}
      {toc.length >= 3 ? <TableOfContentsPage data={data} company={company} client={client} entries={toc} /> : null}

      {/* The pasted proposal. It flows across as many pages as it needs; the running header and
          footer repeat on each because they are marked fixed. */}
      <Page size="A4" style={P.page}>
        <PageFurniture data={data} company={company} client={client} />
        <View style={P.body}>
          {rich.length > 0
            ? rich.map((block, i) => <RichBlockView key={i} block={block} />)
            : data.sections.map((section, i) => (
                <View key={i} style={n.section}>
                  <Text style={n.h2}>{section.heading}</Text>
                  <TextLines text={section.body} style={n.body} />
                </View>
              ))}
          {items.length > 0 ? <PricingTable items={items} total={total} label="Investment summary" /> : null}
          {data.terms ? (
            <View style={n.section}>
              <Text style={n.h2}>Terms</Text>
              <TextLines text={data.terms} style={n.body} />
            </View>
          ) : null}
        </View>
      </Page>

      {data.signature ? (
        <AcceptancePage
          data={data}
          company={company}
          client={client}
          {...(stamp ? { stamp } : {})}
          {...(signature ? { signature } : {})}
        />
      ) : null}
      <ContactPage data={data} company={company} client={client} />
    </>
  );
}

/**
 * Agreements: Scope of Work, Master Service Agreement, Service Level Agreement, Contract.
 *
 * Plain by design. The pasted body is rendered as numbered clauses so a term can be cited by number,
 * which is how these documents are actually used in a negotiation. Where the writer supplied headings
 * they become clause headings; where they did not, the clause is a bare numbered paragraph.
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
  const clauses: { heading?: string; blocks: RichBlock[] }[] = [];
  for (const block of rich) {
    if (block.type === "h2") {
      clauses.push({ heading: (block.runs ?? []).map((r) => r.text).join("").trim(), blocks: [] });
    } else {
      if (clauses.length === 0) clauses.push({ blocks: [] });
      clauses[clauses.length - 1]!.blocks.push(block);
    }
  }

  return (
    <AgreementPages
      data={data}
      company={company}
      {...(mark ? { mark } : {})}
      {...(stamp ? { stamp } : {})}
      {...(signature ? { signature } : {})}
    >
      {clauses.length > 0
        ? clauses.map((c, i) => (
            <Clause key={i} n={`${i + 1}.`} {...(c.heading ? { heading: c.heading } : {})}>
              {c.blocks.map((b, j) => <RichBlockView key={j} block={b} />)}
            </Clause>
          ))
        : data.sections.map((section, i) => (
            <Clause key={i} n={`${i + 1}.`} heading={section.heading}>
              <TextLines text={section.body} style={A.clauseText} />
            </Clause>
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
}: {
  data: DocumentData;
  /** White mark, for the proposal's purple cover band. */
  logo?: Buffer;
  /** Purple mark, for the agreements' plain letterhead. */
  mark?: Buffer;
  stamp?: Buffer;
  signature?: Buffer;
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
      ) : data.kind === "Proposal" ? (
        <ProposalTemplate data={data} company={company} {...brand} />
      ) : (
        <StructuredTemplate data={data} company={company} {...brand} />
      )}
    </Document>
  );
}
