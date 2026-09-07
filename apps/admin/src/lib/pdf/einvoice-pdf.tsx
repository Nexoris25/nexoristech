/**
 * The official NRS tax-invoice PDF (self-contained, so the CRM Document Engine stays untouched). Runs
 * server-side in the Node runtime. Premium monospace layout set in JetBrains Mono - which aligns
 * figures beautifully in tabular columns - with the full legal letterhead (logo, legal name, RC, TIN,
 * registered address, phone, email, website), a spacious items table, the tax breakdown, and payment
 * instructions.
 *
 * It serves two documents, and the difference between them is stated on the page rather than left to
 * be inferred. A document the NRS has accepted is headed "Tax Invoice" and prints its IRN and
 * verification reference. One that has not is headed "Invoice" and says in as many words that it is
 * not a tax invoice, so the two can never be mistaken for one another. An invoice that charges no
 * VAT says that too, rather than showing a silent zero that reads like an arithmetic slip.
 *
 * Uses "NGN " (the embedded font has no naira glyph) and never a literal newline inside a single
 * Text, per the engine's known @react-pdf constraints.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToBuffer, Document, Page, View, Text, Image, StyleSheet, Font } from "@react-pdf/renderer";

export interface EinvoicePdfData {
  docLabel: string;
  number: string;
  issueDate: string;
  dueDate: string | null;
  irn: string | null;
  qrData: string | null;
  /** Whether the NRS has accepted this document. Only then may it call itself a tax invoice. */
  isTaxInvoice?: boolean;
  /** Whether VAT was charged. When it was not, the invoice says so rather than showing a silent 0. */
  vatCharged?: boolean;
  cancelled?: boolean;
  /** Printed when no VAT was charged, so the customer sees the basis rather than a silent zero. */
  vatNotice?: string | null;
  /**
   * What the customer is expected to withhold and remit themselves. Shown for information and never
   * added to or deducted from what is billed: it was being calculated and then shown to nobody,
   * which left the client to work out their own deduction and us with no stated expectation of it.
   */
  whtExpected?: number | null;
  projectName?: string | null;
  invoicePercentage?: string | null;
  environment: string;
  customer: { name: string; tin: string | null; email: string | null; address: string | null };
  lines: { description: string; quantity: number; unitPrice: number; lineTotal: number; vatApplicable: boolean }[];
  subtotal: number; vat: number; total: number; amountPaid: number; outstanding: number;
  paymentTerms: string | null;
  company: {
    legalName: string; rcNumber: string | null; tin: string | null; address: string;
    phone: string; email: string; website: string | null; paymentInstructions: string | null;
    /** Where to send the money. Printed on every invoice: an invoice without it needs a reply. */
    bankAccounts?: { accountName: string; accountNumber: string; bank: string }[];
  };
}

let fontsRegistered = false;
function registerFonts(): void {
  if (fontsRegistered) return;
  fontsRegistered = true;
  const dir = join(process.cwd(), "public");
  Font.register({
    family: "JetBrainsMono",
    fonts: [
      { src: join(dir, "jetbrains-mono-Regular.ttf"), fontWeight: 400 },
      { src: join(dir, "jetbrains-mono-Medium.ttf"), fontWeight: 500 },
      { src: join(dir, "jetbrains-mono-Bold.ttf"), fontWeight: 700 },
    ],
  });
  // Keep long descriptions from breaking mid-word awkwardly in a monospace face.
  Font.registerHyphenationCallback((word) => [word]);
}
let logoCache: Buffer | undefined | null = null;
function logo(): Buffer | undefined {
  if (logoCache !== null) return logoCache;
  try { logoCache = readFileSync(join(process.cwd(), "public", "logo-mark-purple.png")); } catch { logoCache = undefined; }
  return logoCache;
}

function ngn(n: number): string {
  return `NGN ${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtDate(s: string): string {
  return new Date(s).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" });
}

const BRAND = "#543CDA";
const INK = "#0F172A";
const MUTE = "#555269";
/*
 * The quietest text on the page still has to be read.
 *
 * This was #8B8AA0, which is about 3.2:1 on white — under the 4.5:1 minimum, and set at 6 to 7.5pt
 * on a document people read as a printout or a phone-sized PDF. The account-name label above the
 * name someone checks before transferring money was the faintest thing on the invoice. #63607A is
 * about 5.9:1 and still recedes behind INK and MUTE, which is all the tone was ever for.
 */
const FAINT = "#63607A";
const LINE = "#E4E2EF";
const TINT = "#F4F1FD";

const s = StyleSheet.create({
  page: { paddingTop: 0, paddingBottom: 58, fontFamily: "JetBrainsMono", fontSize: 8.5, color: INK, lineHeight: 1.45 },
  // Brand accent band across the very top.
  topbar: { height: 6, backgroundColor: BRAND },
  body: { paddingHorizontal: 44, paddingTop: 26 },

  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  brandRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, maxWidth: 320 },
  logo: { width: 30, height: 34 },
  legalName: { fontSize: 12.5, fontWeight: 700, color: INK, letterSpacing: 0.2 },
  meta: { fontSize: 7.5, color: MUTE, marginTop: 2, lineHeight: 1.5 },
  titleBox: { alignItems: "flex-end" },
  title: { fontSize: 15, fontWeight: 700, color: BRAND, letterSpacing: 2 },
  numMeta: { fontSize: 8, color: MUTE, marginTop: 3 },
  numStrong: { fontSize: 8.5, color: INK, fontWeight: 500 },

  divider: { borderBottomWidth: 1, borderBottomColor: LINE, marginVertical: 16 },

  billRow: { flexDirection: "row", justifyContent: "space-between", gap: 24 },
  label: { fontSize: 6.5, color: FAINT, letterSpacing: 1, marginBottom: 4 },
  billName: { fontSize: 9.5, fontWeight: 700, color: INK },
  billLine: { fontSize: 8, color: MUTE, marginTop: 2, lineHeight: 1.5 },
  envPill: { fontSize: 7, color: BRAND, fontWeight: 700, backgroundColor: TINT, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 4 },

  th: { flexDirection: "row", backgroundColor: BRAND, paddingVertical: 7, paddingHorizontal: 10, borderRadius: 4, marginTop: 20 },
  thText: { fontSize: 7, color: "#FFFFFF", fontWeight: 700, letterSpacing: 0.6 },
  tr: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: LINE },
  cDesc: { flex: 1, paddingRight: 12, fontSize: 8.5, lineHeight: 1.4 },
  cQty: { width: 46, textAlign: "right", fontSize: 8.5 },
  cUnit: { width: 108, textAlign: "right", fontSize: 8.5 },
  cAmt: { width: 112, textAlign: "right", fontSize: 8.5, fontWeight: 500 },
  noVat: { fontSize: 6.5, color: FAINT },

  lower: { flexDirection: "row", justifyContent: "space-between", marginTop: 22, gap: 24 },
  irnBox: { width: 232 },
  irnValue: { fontSize: 8.5, fontWeight: 700, color: INK, marginTop: 2 },
  qrCaption: { fontSize: 6.5, color: FAINT, marginTop: 6, lineHeight: 1.4 },
  // A plain statement of what this document is not, so it can never be taken for a filed tax
  // invoice. Small, but present on every page it belongs on.
  notTax: { fontSize: 7, color: FAINT, marginTop: 5, lineHeight: 1.4 },
  voided: {
    marginTop: 10, borderWidth: 1, borderColor: "#B91C1C", borderRadius: 4,
    paddingVertical: 6, paddingHorizontal: 10,
  },
  voidedText: { fontSize: 9, fontWeight: 700, color: "#B91C1C", letterSpacing: 1 },
  projMeta: { fontSize: 7.5, color: FAINT, marginTop: 4, lineHeight: 1.4 },

  totals: { width: 210 },
  tRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3.5 },
  tLabel: { fontSize: 8, color: MUTE },
  tValue: { fontSize: 8.5, color: INK },
  grandBand: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: BRAND, borderRadius: 5, paddingVertical: 8, paddingHorizontal: 12, marginTop: 6 },
  grandLabel: { fontSize: 9, color: "#FFFFFF", fontWeight: 700, letterSpacing: 0.5 },
  grandValue: { fontSize: 11, color: "#FFFFFF", fontWeight: 700 },
  balRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3.5, marginTop: 2 },
  balLabel: { fontSize: 8.5, color: INK, fontWeight: 700 },
  balValue: { fontSize: 9, color: BRAND, fontWeight: 700 },

  payBox: { marginTop: 22, backgroundColor: TINT, borderRadius: 6, borderLeftWidth: 3, borderLeftColor: BRAND, paddingVertical: 12, paddingHorizontal: 14 },
  payText: { fontSize: 8, color: MUTE, marginTop: 3, lineHeight: 1.5 },
  /*
   * Account details, laid out as separate accounts rather than as a table.
   *
   * Three aligned columns with the same account name on every row read as a spreadsheet, and the one
   * thing that tells the two accounts apart - the bank - was the last column, in the smallest type.
   * Each account is now its own bordered block headed by the bank, so the choice between them is
   * obvious at a glance. The number is the largest thing in the block because it is the thing being
   * copied into a banking app, and it is set in the monospace face so digits align and cannot be
   * misread. The account name sits under it as the confirmation somebody checks before sending.
   */
  bankLead: { fontSize: 7.5, color: MUTE, marginTop: 8, marginBottom: 5 },
  bankRow: { flexDirection: "row", gap: 10 },
  bankCard: {
    flex: 1, borderWidth: 0.75, borderColor: BRAND, borderRadius: 5,
    backgroundColor: "#FFFFFF", paddingVertical: 8, paddingHorizontal: 10,
  },
  bankBank: { fontSize: 8.5, fontWeight: 700, color: BRAND, letterSpacing: 0.3 },
  bankNumber: { fontSize: 13, fontWeight: 700, color: INK, marginTop: 4, letterSpacing: 0.8 },
  /* The account name is checked against a banking app before money moves, so it is set at the size
     of ordinary text rather than as a caption. */
  bankLabel: { fontSize: 6.5, color: FAINT, letterSpacing: 0.6, marginTop: 5 },
  bankHolder: { fontSize: 9, color: INK, fontWeight: 500, marginTop: 2 },

  footer: { position: "absolute", bottom: 26, left: 44, right: 44, borderTopWidth: 1, borderTopColor: LINE, paddingTop: 8 },
  footText: { fontSize: 6.5, color: FAINT, textAlign: "center", lineHeight: 1.5 },
});

function InvoiceDoc({ data }: { data: EinvoicePdfData }): React.ReactElement {
  const c = data.company;
  const idLines = [
    c.rcNumber ? `RC ${c.rcNumber}` : null,
    c.tin ? `TIN ${c.tin}` : null,
  ].filter(Boolean).join("   ");
  const contact = [c.phone, c.email, c.website].filter(Boolean).join("   |   ");
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.topbar} fixed />
        <View style={s.body}>
          {/* Letterhead */}
          <View style={s.headerRow}>
            <View style={s.brandRow}>
              {logo() ? <Image src={{ data: logo() as Buffer, format: "png" }} style={s.logo} /> : null}
              <View style={{ maxWidth: 268 }}>
                <Text style={s.legalName}>{c.legalName}</Text>
                {idLines ? <Text style={s.meta}>{idLines}</Text> : null}
                <Text style={s.meta}>{c.address}</Text>
                <Text style={s.meta}>{contact}</Text>
              </View>
            </View>
            <View style={s.titleBox}>
              <Text style={s.title}>{data.docLabel.toUpperCase()}</Text>
              <Text style={s.numMeta}>No.</Text>
              <Text style={s.numStrong}>{data.number}</Text>
              <Text style={s.numMeta}>Issued  {fmtDate(data.issueDate)}</Text>
              {data.dueDate ? <Text style={s.numMeta}>Due     {fmtDate(data.dueDate)}</Text> : null}
              {data.projectName ? (
                <Text style={s.projMeta}>
                  {data.invoicePercentage
                    ? `${Number(data.invoicePercentage).toFixed(2)}% of ${data.projectName}`
                    : data.projectName}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={s.divider} />

          {data.cancelled ? (
            <View style={s.voided}>
              <Text style={s.voidedText}>CANCELLED — THIS INVOICE IS NOT PAYABLE</Text>
            </View>
          ) : null}

          {/* Bill to */}
          <View style={s.billRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>BILL TO</Text>
              <Text style={s.billName}>{data.customer.name}</Text>
              {data.customer.tin ? <Text style={s.billLine}>TIN {data.customer.tin}</Text> : null}
              {data.customer.address ? <Text style={s.billLine}>{data.customer.address}</Text> : null}
              {data.customer.email ? <Text style={s.billLine}>{data.customer.email}</Text> : null}
            </View>
            {/* Which NRS environment a document was filed against is a fact about filing, and it
                means nothing on an invoice that was never filed. Printing SANDBOX on a document a
                client is asked to pay reads as a test that escaped. */}
            {data.isTaxInvoice ? (
              <View style={{ alignItems: "flex-end" }}>
                <Text style={s.label}>ENVIRONMENT</Text>
                <Text style={s.envPill}>{data.environment === "production" ? "PRODUCTION" : "SANDBOX"}</Text>
              </View>
            ) : null}
          </View>

          {/* Items */}
          <View style={s.th}>
            <Text style={[s.thText, { flex: 1, paddingRight: 12 }]}>DESCRIPTION</Text>
            <Text style={[s.thText, { width: 46, textAlign: "right" }]}>QTY</Text>
            <Text style={[s.thText, { width: 108, textAlign: "right" }]}>UNIT PRICE</Text>
            <Text style={[s.thText, { width: 112, textAlign: "right" }]}>AMOUNT</Text>
          </View>
          {data.lines.map((l, i) => (
            <View key={i} style={s.tr} wrap={false}>
              <View style={s.cDesc}><Text>{l.description}</Text>{!l.vatApplicable ? <Text style={s.noVat}>VAT exempt</Text> : null}</View>
              <Text style={s.cQty}>{l.quantity}</Text>
              <Text style={s.cUnit}>{ngn(l.unitPrice)}</Text>
              <Text style={s.cAmt}>{ngn(l.lineTotal)}</Text>
            </View>
          ))}

          {/* IRN/QR + totals */}
          <View style={s.lower}>
            <View style={s.irnBox}>
              {/*
                * The document does not comment on its own fiscal status.
                *
                * A "this is not a tax invoice, it has not been filed" notice stood here. It was the
                * most prominent thing in the block and it told the customer about our filing
                * position rather than about their bill. The invoice now states neither that it is a
                * tax invoice nor that it is not one: where the NRS has accepted it, the IRN and
                * verification reference below say so on their own, and where it has not, nothing is
                * claimed either way.
                */}
              {/* The basis for charging no VAT belongs on any invoice that charges none, filed or
                  not. A zero VAT line with no explanation reads as an arithmetic slip. */}
              {data.vatCharged === false ? (
                <Text style={s.notTax}>{data.vatNotice ?? "No VAT has been charged on this invoice."}</Text>
              ) : null}
              {data.irn ? (
                <>
                  <Text style={s.label}>NRS IRN</Text>
                  <Text style={s.irnValue}>{data.irn}</Text>
                  {data.qrData ? <Text style={s.qrCaption}>NRS verification reference</Text> : null}
                  {data.qrData ? <Text style={[s.qrCaption, { marginTop: 0 }]}>{data.qrData}</Text> : null}
                </>
              ) : null}
            </View>
            <View style={s.totals}>
              <View style={s.tRow}><Text style={s.tLabel}>Subtotal</Text><Text style={s.tValue}>{ngn(data.subtotal)}</Text></View>
              <View style={s.tRow}><Text style={s.tLabel}>VAT</Text><Text style={s.tValue}>{ngn(data.vat)}</Text></View>
              <View style={s.grandBand}><Text style={s.grandLabel}>TOTAL</Text><Text style={s.grandValue}>{ngn(data.total)}</Text></View>
              {data.whtExpected && data.whtExpected > 0 ? (
                <View style={s.tRow}><Text style={s.tLabel}>WHT to deduct</Text><Text style={s.tValue}>{ngn(data.whtExpected)}</Text></View>
              ) : null}
              {data.whtExpected && data.whtExpected > 0 ? (
                <View style={s.tRow}><Text style={s.tLabel}>Net payable</Text><Text style={s.tValue}>{ngn(data.total - data.whtExpected)}</Text></View>
              ) : null}
              {data.amountPaid > 0 ? <View style={s.tRow}><Text style={s.tLabel}>Amount paid</Text><Text style={s.tValue}>{ngn(data.amountPaid)}</Text></View> : null}
              {data.amountPaid > 0 ? <View style={s.balRow}><Text style={s.balLabel}>Balance due</Text><Text style={s.balValue}>{ngn(data.outstanding)}</Text></View> : null}
            </View>
          </View>

          {/* Payment instructions, and where to send the money */}
          {c.paymentInstructions || data.paymentTerms || (c.bankAccounts?.length ?? 0) > 0 ? (
            <View style={s.payBox} wrap={false}>
              <Text style={s.label}>PAYMENT INSTRUCTIONS</Text>
              {data.paymentTerms ? <Text style={s.payText}>Terms: {data.paymentTerms}</Text> : null}
              {c.paymentInstructions ? <Text style={s.payText}>{c.paymentInstructions}</Text> : null}
              {(c.bankAccounts ?? []).length > 0 ? (
                <>
                  <Text style={s.bankLead}>
                    {(c.bankAccounts ?? []).length > 1
                      ? "Pay into either of these accounts."
                      : "Pay into this account."}
                  </Text>
                  <View style={s.bankRow}>
                    {(c.bankAccounts ?? []).map((a) => (
                      <View style={s.bankCard} key={`${a.bank}-${a.accountNumber}`}>
                        <Text style={s.bankBank}>{a.bank.toUpperCase()}</Text>
                        <Text style={s.bankNumber}>{a.accountNumber}</Text>
                        <Text style={s.bankLabel}>ACCOUNT NAME</Text>
                        <Text style={s.bankHolder}>{a.accountName}</Text>
                      </View>
                    ))}
                  </View>
                </>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footText}>{c.legalName}{c.rcNumber ? `   |   RC ${c.rcNumber}` : ""}{c.tin ? `   |   TIN ${c.tin}` : ""}</Text>
          {/* One line for every invoice, making no claim about filing either way. It previously
              branched on isTaxInvoice and asserted one status or the other; the document now simply
              says what it is. */}
          <Text style={s.footText}>
            Invoice issued by {c.legalName}. Please quote the invoice number with your payment.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function renderEinvoicePdf(data: EinvoicePdfData): Promise<Buffer> {
  registerFonts();
  return await renderToBuffer(<InvoiceDoc data={data} />);
}
