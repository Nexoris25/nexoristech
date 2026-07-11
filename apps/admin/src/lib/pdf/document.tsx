/**
 * The branded Nexoris Technologies PDF template (PRD Part Three, 5). One layout serves every
 * document kind: a purple header with the white logo, the document meta, the title and body
 * sections, an optional priced line-item table with a total, terms, and a fixed footer with the
 * company details and page numbers. Text is real and selectable (Plus Jakarta Sans). Amounts in
 * NGN. Content comes entirely from the caller; nothing is fabricated.
 */
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import type { DocumentData } from "./types.js";

const COLORS = {
  purple: "#543CDA",
  ink: "#0D0A1C",
  grey: "#5b5b6b",
  line: "#e5e5ee",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 0,
    paddingBottom: 64,
    fontFamily: "Jakarta",
    fontSize: 10,
    color: COLORS.ink,
  },
  header: {
    backgroundColor: COLORS.purple,
    color: "#ffffff",
    paddingHorizontal: 40,
    paddingVertical: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: { width: 28, height: 32 },
  brand: { fontSize: 14, fontWeight: 700, color: "#ffffff" },
  kind: { fontSize: 9, color: "#e7e2ff", marginTop: 2 },
  content: { paddingHorizontal: 40, paddingTop: 24 },
  meta: { marginBottom: 16, color: COLORS.grey, fontSize: 9 },
  metaLine: { marginBottom: 2 },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 12 },
  intro: { marginBottom: 16, lineHeight: 1.5 },
  section: { marginBottom: 14 },
  h2: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 4,
    color: COLORS.ink,
  },
  body: { lineHeight: 1.5 },
  table: { marginTop: 8, marginBottom: 16 },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    paddingVertical: 6,
  },
  totalRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderTopWidth: 2,
    borderTopColor: COLORS.ink,
  },
  cellDesc: { flex: 1 },
  cellAmt: { width: 120, textAlign: "right" },
  bold: { fontWeight: 700 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    fontSize: 8,
    color: COLORS.grey,
    textAlign: "center",
  },
});

function naira(amount: number): string {
  return `NGN ${amount.toLocaleString("en-NG")}`;
}

export function NexorisDocument({
  data,
  logo,
}: {
  data: DocumentData;
  logo?: Buffer;
}): React.ReactElement {
  const items = data.lineItems ?? [];
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const recipient = [data.recipientName, data.recipientCompany]
    .filter(Boolean)
    .join(", ");

  return (
    <Document title={`${data.kind}: ${data.title}`} author="Nexoris Technologies">
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          {logo ? (
            <Image src={{ data: logo, format: "png" }} style={styles.logo} />
          ) : null}
          <View>
            <Text style={styles.brand}>Nexoris Technologies</Text>
            <Text style={styles.kind}>{data.kind}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.meta}>
            {data.reference ? (
              <Text style={styles.metaLine}>Reference: {data.reference}</Text>
            ) : null}
            <Text style={styles.metaLine}>Date: {data.date}</Text>
            {recipient ? (
              <Text style={styles.metaLine}>Prepared for: {recipient}</Text>
            ) : null}
          </View>

          <Text style={styles.title}>{data.title}</Text>
          {data.intro ? <Text style={styles.intro}>{data.intro}</Text> : null}

          {data.sections.map((section, i) => (
            <View key={i} style={styles.section} wrap={false}>
              <Text style={styles.h2}>{section.heading}</Text>
              <Text style={styles.body}>{section.body}</Text>
            </View>
          ))}

          {items.length > 0 ? (
            <View style={styles.table}>
              {items.map((item, i) => (
                <View key={i} style={styles.row}>
                  <Text style={styles.cellDesc}>{item.description}</Text>
                  <Text style={styles.cellAmt}>{naira(item.amount)}</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={[styles.cellDesc, styles.bold]}>Total</Text>
                <Text style={[styles.cellAmt, styles.bold]}>{naira(total)}</Text>
              </View>
            </View>
          ) : null}

          {data.terms ? (
            <View style={styles.section}>
              <Text style={styles.h2}>Terms</Text>
              <Text style={styles.body}>{data.terms}</Text>
            </View>
          ) : null}
        </View>

        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) =>
            `Nexoris Technologies Ltd  -  No. 5, Mojisola Dokpesi Street, Badore, Ajah, Lagos State  -  business@nexoristech.com  -  Page ${pageNumber} of ${totalPages}`
          }
        />
      </Page>
    </Document>
  );
}
