/**
 * The branded payslip PDF - the same premium JetBrains Mono letterhead and Nexoris Technologies brand
 * (#543CDA) as the tax invoice, so every document the platform issues looks like one company. Shows
 * the worker, the pay period, the earnings and each statutory deduction by name, and the net pay.
 * Employer-only costs never appear (they are not part of the payslip). Server-side, Node runtime.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToBuffer, Document, Page, View, Text, Image, StyleSheet, Font } from "@react-pdf/renderer";

export interface PayslipPdfData {
  employeeName: string;
  period: string;
  regime: string;
  paidOn: string | null;
  gross: number;
  deductions: { label: string; amount: number }[];
  net: number;
  company: { legalName: string; rcNumber: string | null; tin: string | null; address: string; phone: string; email: string; website: string | null };
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
}
let logoCache: Buffer | undefined | null = null;
function logo(): Buffer | undefined {
  if (logoCache !== null) return logoCache;
  try { logoCache = readFileSync(join(process.cwd(), "public", "logo-mark-purple.png")); } catch { logoCache = undefined; }
  return logoCache;
}

const ngn = (n: number): string => `NGN ${n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (s: string): string => new Date(s).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" });

const BRAND = "#543CDA";
const INK = "#0F172A";
const MUTE = "#555269";
const FAINT = "#8B8AA0";
const LINE = "#E4E2EF";
const TINT = "#F4F1FD";

const s = StyleSheet.create({
  page: { paddingBottom: 58, fontFamily: "JetBrainsMono", fontSize: 8.5, color: INK, lineHeight: 1.45 },
  topbar: { height: 6, backgroundColor: BRAND },
  body: { paddingHorizontal: 44, paddingTop: 26 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  brandRow: { flexDirection: "row", gap: 10, maxWidth: 320 },
  logo: { width: 30, height: 34 },
  legalName: { fontSize: 12.5, fontWeight: 700, color: INK, letterSpacing: 0.2 },
  meta: { fontSize: 7.5, color: MUTE, marginTop: 2, lineHeight: 1.5 },
  title: { fontSize: 15, fontWeight: 700, color: BRAND, letterSpacing: 2 },
  numMeta: { fontSize: 8, color: MUTE, marginTop: 3, textAlign: "right" },
  divider: { borderBottomWidth: 1, borderBottomColor: LINE, marginVertical: 16 },
  label: { fontSize: 6.5, color: FAINT, letterSpacing: 1, marginBottom: 4 },
  who: { fontSize: 10.5, fontWeight: 700, color: INK },
  whoLine: { fontSize: 8, color: MUTE, marginTop: 2 },
  sectionHead: { fontSize: 7, color: "#FFFFFF", fontWeight: 700, letterSpacing: 0.6, backgroundColor: BRAND, borderRadius: 4, paddingVertical: 6, paddingHorizontal: 10, marginTop: 20 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 7, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: LINE },
  rowLabel: { fontSize: 8.5, color: INK },
  rowVal: { fontSize: 8.5, fontWeight: 500 },
  subtotal: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 7, paddingHorizontal: 10 },
  subLabel: { fontSize: 8.5, fontWeight: 700, color: INK },
  netBand: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: BRAND, borderRadius: 5, paddingVertical: 10, paddingHorizontal: 14, marginTop: 20 },
  netLabel: { fontSize: 10, color: "#FFFFFF", fontWeight: 700, letterSpacing: 0.5 },
  netVal: { fontSize: 13, color: "#FFFFFF", fontWeight: 700 },
  note: { marginTop: 20, backgroundColor: TINT, borderRadius: 6, borderLeftWidth: 3, borderLeftColor: BRAND, paddingVertical: 10, paddingHorizontal: 14, fontSize: 7.5, color: MUTE, lineHeight: 1.5 },
  footer: { position: "absolute", bottom: 26, left: 44, right: 44, borderTopWidth: 1, borderTopColor: LINE, paddingTop: 8 },
  footText: { fontSize: 6.5, color: FAINT, textAlign: "center" },
});

function PayslipDoc({ data }: { data: PayslipPdfData }): React.ReactElement {
  const c = data.company;
  const idLine = [c.rcNumber ? `RC ${c.rcNumber}` : null, c.tin ? `TIN ${c.tin}` : null].filter(Boolean).join("   ");
  const contact = [c.phone, c.email, c.website].filter(Boolean).join("   ·   ");
  const totalDeductions = data.deductions.reduce((t, d) => t + d.amount, 0);
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.topbar} fixed />
        <View style={s.body}>
          <View style={s.headerRow}>
            <View style={s.brandRow}>
              {logo() ? <Image src={{ data: logo() as Buffer, format: "png" }} style={s.logo} /> : null}
              <View style={{ maxWidth: 268 }}>
                <Text style={s.legalName}>{c.legalName}</Text>
                {idLine ? <Text style={s.meta}>{idLine}</Text> : null}
                <Text style={s.meta}>{c.address}</Text>
                <Text style={s.meta}>{contact}</Text>
              </View>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={s.title}>PAYSLIP</Text>
              <Text style={s.numMeta}>{data.period}</Text>
              {data.paidOn ? <Text style={s.numMeta}>Paid {fmtDate(data.paidOn)}</Text> : null}
            </View>
          </View>

          <View style={s.divider} />

          <View>
            <Text style={s.label}>EMPLOYEE</Text>
            <Text style={s.who}>{data.employeeName}</Text>
            <Text style={s.whoLine}>{data.regime} regime · Pay period {data.period}</Text>
          </View>

          <Text style={s.sectionHead}>EARNINGS</Text>
          <View style={s.row}><Text style={s.rowLabel}>Gross pay</Text><Text style={s.rowVal}>{ngn(data.gross)}</Text></View>
          <View style={s.subtotal}><Text style={s.subLabel}>Total earnings</Text><Text style={s.subLabel}>{ngn(data.gross)}</Text></View>

          <Text style={s.sectionHead}>DEDUCTIONS</Text>
          {data.deductions.length === 0
            ? <View style={s.row}><Text style={s.rowLabel}>No deductions</Text><Text style={s.rowVal}>{ngn(0)}</Text></View>
            : data.deductions.map((d, i) => (
              <View key={i} style={s.row}><Text style={s.rowLabel}>{d.label}</Text><Text style={s.rowVal}>{ngn(d.amount)}</Text></View>
            ))}
          <View style={s.subtotal}><Text style={s.subLabel}>Total deductions</Text><Text style={s.subLabel}>{ngn(totalDeductions)}</Text></View>

          <View style={s.netBand}><Text style={s.netLabel}>NET PAY</Text><Text style={s.netVal}>{ngn(data.net)}</Text></View>

          <Text style={s.note}>Computed under the Nigeria Tax Act 2025. This is a record of a disbursed payment. Employer-only costs (employer pension and Employees&apos; Compensation) are not shown on the payslip.</Text>
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footText}>{c.legalName}{c.rcNumber ? `   ·   RC ${c.rcNumber}` : ""}{c.tin ? `   ·   TIN ${c.tin}` : ""}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function renderPayslipPdf(data: PayslipPdfData): Promise<Buffer> {
  registerFonts();
  return await renderToBuffer(<PayslipDoc data={data} />);
}
