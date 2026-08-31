/**
 * The branded page furniture, ported from the kit's cover and furniture drawers.
 *
 * The kit draws these straight onto a ReportLab canvas with absolute coordinates. react-pdf has no
 * canvas, so each piece is rebuilt as absolutely positioned Views at the same coordinates. Positions
 * are measured from the top here rather than the bottom, because ReportLab's origin is bottom-left
 * and react-pdf's is top-left; every `PAGE_H - x` in the kit therefore becomes a plain `top: x`.
 *
 * One deliberate difference. The kit rotates "NEXORIS TECHNOLOGIES" ninety degrees up the purple
 * spine. react-pdf's transform support does not lay rotated text out reliably inside a fixed-height
 * band, and a spine that sometimes clips is worse than one that does not exist, so the spine carries
 * the rule pattern and the web address and the wordmark sits with the logo instead. Everything else
 * is the kit's geometry unchanged.
 */
import React from "react";
import { View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { C, CONTENT_WIDTH, FONT, PAGE, TYPE, mm } from "./brand.js";

const SPINE = mm(52);
const COVER_X = SPINE + mm(16);
const COVER_W = PAGE.width - COVER_X - mm(18);

const s = StyleSheet.create({
  coverPage: { backgroundColor: C.navy, position: "relative" },
  spine: { position: "absolute", left: 0, top: 0, width: SPINE, height: PAGE.height, backgroundColor: C.purple },
  spineRule: { position: "absolute", left: 0, width: SPINE, height: 0.6, backgroundColor: C.coverSpineRule },
  spineFoot: { position: "absolute", left: 0, bottom: 0, width: SPINE, height: mm(30), backgroundColor: C.purpleDark },
  spineUrl: {
    position: "absolute", left: 0, bottom: mm(12), width: SPINE,
    textAlign: "center", fontFamily: FONT.regular, fontSize: 8.5, color: C.white,
  },
  coverLogo: { position: "absolute", right: mm(18), top: mm(14), height: mm(16), objectFit: "contain" },
  /* The eyebrow sits at the top of the cover, above everything, as it does in the reference. */
  eyebrow: {
    position: "absolute", right: mm(18), top: mm(34), width: COVER_W,
    textAlign: "right", fontFamily: FONT.medium, fontSize: 7.3, color: C.coverLabel, letterSpacing: 1.2,
  },
  preparedForLabel: { fontFamily: FONT.medium, fontSize: 9, color: C.coverLabel, letterSpacing: 0.6 },
  client: { fontFamily: FONT.bold, fontSize: 23, color: C.white, marginTop: mm(5) },
  titleRule: { height: 2.2, backgroundColor: C.purple, marginTop: mm(6), width: COVER_W },
  title: { fontFamily: FONT.bold, fontSize: 14.5, color: C.white, marginTop: mm(8) },
  meta: { fontFamily: FONT.regular, fontSize: 9.2, color: C.coverSubtitle, marginTop: mm(2.4), lineHeight: 1.6 },
  metaLabel: { fontFamily: FONT.medium, color: C.coverMeta },
  preparedByRule: { position: "absolute", left: COVER_X, bottom: mm(61), width: COVER_W, height: 0.8, backgroundColor: C.coverDivider },
  /* The two parties side by side above the foot of the cover, as the reference sets them. */
  parties: { position: "absolute", left: COVER_X, bottom: mm(34), width: COVER_W, flexDirection: "row" },
  party: { flex: 1, paddingRight: mm(6) },
  preparedByLabel: { fontFamily: FONT.medium, fontSize: 8, color: C.coverLabel, letterSpacing: 0.6, marginBottom: mm(3) },
  partyName: { fontFamily: FONT.bold, fontSize: 10.5, color: C.white },
  preparedByLine: { fontFamily: FONT.regular, fontSize: 8.6, color: C.coverPreparedBy, lineHeight: 1.55, marginTop: mm(1.4) },
  notice: {
    position: "absolute", left: COVER_X, bottom: mm(16), width: COVER_W,
    fontFamily: FONT.regular, fontSize: 8.3, color: C.coverMeta, lineHeight: 1.5,
  },

  header: {
    position: "absolute", top: mm(11), left: PAGE.left, right: PAGE.right,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  headerLogo: { height: mm(5.5), objectFit: "contain", marginRight: mm(3) },
  headerText: { fontFamily: FONT.medium, fontSize: 7.2, color: C.inkSoft },
  headerRight: { fontFamily: FONT.medium, fontSize: 7.2, color: C.purple },
  headerRule: { position: "absolute", top: mm(16.5), left: PAGE.left, right: PAGE.right, height: 0.8, backgroundColor: C.purple },

  footerRule: { position: "absolute", bottom: mm(16), left: PAGE.left, right: PAGE.right, height: 0.7, backgroundColor: C.rule },
  footer: {
    position: "absolute", bottom: mm(9), left: PAGE.left, right: PAGE.right,
    flexDirection: "row", justifyContent: "space-between",
  },
  footerText: { fontFamily: FONT.regular, fontSize: 7.2, color: C.inkSoft },
  footerPage: { fontFamily: FONT.medium, fontSize: 7.2, color: C.purple },

  section: { marginTop: mm(7), marginBottom: mm(5) },
  sectionRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  sectionBar: { width: mm(2.6), height: mm(10.5), backgroundColor: C.purple, marginRight: mm(3.9) },
  sectionTitle: { fontFamily: FONT.bold, fontSize: 14.5, color: C.ink, flex: 1, paddingTop: mm(1.6) },
  sectionNumber: { fontFamily: FONT.bold, fontSize: 40, color: C.purpleFade, marginTop: -mm(3) },

  callout: {
    flexDirection: "row", backgroundColor: C.rowTint, borderLeftWidth: 2.4, borderLeftColor: C.purple,
    paddingVertical: 8, paddingHorizontal: 10, marginBottom: 8,
  },
  calloutText: { ...TYPE.note, flex: 1 },

  tableHeadRow: { flexDirection: "row", backgroundColor: C.purple },
  tableHeadCell: { ...TYPE.cellHead, paddingVertical: 6.5, paddingHorizontal: 6 },
  tableRow: { flexDirection: "row", borderBottomWidth: 0.4, borderBottomColor: C.rule },
  tableRowTint: { backgroundColor: C.rowTint },
  tableCell: { ...TYPE.cell, paddingVertical: 5.5, paddingHorizontal: 6 },
  tableCellLabel: { ...TYPE.cellLabel, paddingVertical: 5.5, paddingHorizontal: 6 },
  table: { borderWidth: 0.6, borderColor: C.rule, marginBottom: 10 },
  /* The summary rows: subtotals lifted off the body, and the figure that matters set in the brand. */
  tableSubtotalRow: { backgroundColor: C.headTint },
  tableTotalRow: { backgroundColor: C.purpleDark },
  tableStrong: { fontFamily: FONT.bold, fontSize: 8.6 },
  tableTotalText: { color: C.white },
  cellRight: { textAlign: "right" },

  kvRow: { flexDirection: "row", borderBottomWidth: 0.4, borderBottomColor: C.rule },
  kvLabel: { ...TYPE.cellLabel, width: mm(52), paddingVertical: 6, paddingHorizontal: 8, borderRightWidth: 0.4, borderRightColor: C.rule },
  kvValue: { ...TYPE.cell, flex: 1, paddingVertical: 6, paddingHorizontal: 8 },
  kv: { borderWidth: 0.6, borderColor: C.rule, marginBottom: 10 },

  /* The reference sets the contents flush left, number and title in the same size, generously led. */
  tocRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: mm(3.4) },
  tocNumber: { fontFamily: FONT.medium, fontSize: 9.3, color: C.purple, width: mm(9) },
  tocTitle: { fontFamily: FONT.regular, fontSize: 9.3, color: C.ink, flex: 1, lineHeight: 1.35 },

  /*
   * A pasted outline: a sitemap, an information architecture, a folder tree.
   *
   * Depth is drawn with a rule per level rather than with the connector characters of the source. The
   * characters are not in the embedded fonts and would be dropped one by one, leaving a tree with no
   * branches; a ruled indent says the same thing and survives.
   */
  tree: { marginTop: 4, marginBottom: 10, borderLeftWidth: 2, borderLeftColor: C.purpleFade, paddingLeft: mm(3) },
  treeRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 1.6 },
  treeRail: { width: mm(4), alignSelf: "stretch", borderLeftWidth: 0.6, borderLeftColor: C.rule },
  treeMark: { fontFamily: FONT.regular, fontSize: 8.6, color: C.purple, width: mm(3.4) },
  treeText: { ...TYPE.bullet, flex: 1, marginBottom: 0 },
  treeTop: { fontFamily: FONT.medium, fontSize: 9.3, color: C.ink },
});

/** The horizontal rules ruled up the purple spine, every 9mm as the kit draws them. */
function SpineRules(): React.ReactElement {
  const rules: React.ReactElement[] = [];
  for (let y = 0; y < PAGE.height; y += mm(9)) {
    rules.push(<View key={y} style={[s.spineRule, { top: y }]} />);
  }
  return <>{rules}</>;
}

export interface CoverProps {
  /** The document's title, e.g. "Scope of Work". */
  title: string;
  /** Who it is for. Set large, because it is the first thing the reader looks for. */
  preparedFor: string;
  /** Who wrote it: the legal name on the first line, anything else beneath it. */
  preparedByLines: string[];
  /** The date the document is put forward. */
  proposalDate: string;
  /** How long it stands. */
  validity?: string;
  /** The notice at the foot, which governs how the document may be read and passed on. */
  confidentiality?: string;
  logoWhite?: Buffer;
}

/**
 * The navy and purple cover page.
 *
 * Six things and no more: what this is, who it is for, who wrote it, when, how long it stands, and on
 * what terms it may be read. Everything else that used to sit here — a strapline, an address, a
 * service line — competed with those six and belonged inside the document anyway.
 */
export function BrandCover({
  title, preparedFor, preparedByLines, proposalDate, validity, confidentiality, logoWhite,
}: CoverProps): React.ReactElement {
  const client = preparedFor || "The client";
  return (
    <View style={{ position: "absolute", top: 0, left: 0, width: PAGE.width, height: PAGE.height, backgroundColor: C.navy }}>
      <View style={s.spine} />
      <SpineRules />
      <View style={s.spineFoot} />
      <Text style={s.spineUrl}>www.nexoristech.com</Text>
      {logoWhite ? <Image src={logoWhite} style={s.coverLogo} /> : null}
      <Text style={s.eyebrow}>{`CONFIDENTIAL  ·  ${proposalDate.toUpperCase()}`}</Text>

      <View style={{ position: "absolute", left: COVER_X, top: mm(80), width: COVER_W }}>
        <Text style={s.preparedForLabel}>PREPARED FOR</Text>
        <Text style={s.client}>{client}</Text>
        <View style={s.titleRule} />
        <Text style={s.title}>{title}</Text>
        <Text style={s.meta}>
          <Text style={s.metaLabel}>Proposal Date: </Text>
          {proposalDate}
        </Text>
        {validity ? (
          <Text style={s.meta}>
            <Text style={s.metaLabel}>Validity: </Text>
            {validity}
          </Text>
        ) : null}
      </View>

      <View style={s.preparedByRule} />
      <View style={s.parties}>
        <View style={s.party}>
          <Text style={s.preparedByLabel}>PREPARED FOR</Text>
          <Text style={s.partyName}>{client}</Text>
        </View>
        <View style={s.party}>
          <Text style={s.preparedByLabel}>PREPARED BY</Text>
          <Text style={s.partyName}>{preparedByLines[0] ?? ""}</Text>
          {preparedByLines.slice(1).map((line) => (
            <Text key={line} style={s.preparedByLine}>{line}</Text>
          ))}
        </View>
      </View>
      {confidentiality ? <Text style={s.notice}>{confidentiality}</Text> : null}
    </View>
  );
}

/**
 * The running header and footer for every page after the cover.
 *
 * `fixed` repeats these on each page. The page number counts from the cover, and the kit prints
 * `doc.page - 1` so the first content page reads "Page 1"; the same subtraction is applied here.
 */
export function RunningFurniture({
  runningTitle, footerText, logoPurple,
}: { runningTitle: string; footerText: string; logoPurple?: Buffer }): React.ReactElement {
  return (
    <>
      <View style={s.header} fixed>
        <View style={s.headerLeft}>
          {logoPurple ? <Image src={logoPurple} style={s.headerLogo} /> : null}
          <Text style={s.headerText}>{runningTitle}</Text>
        </View>
        <Text style={s.headerRight}>NEXORIS TECHNOLOGIES LTD</Text>
      </View>
      <View style={s.headerRule} fixed />
      <View style={s.footerRule} fixed />
      <View style={s.footer} fixed>
        <Text style={s.footerText}>{footerText}</Text>
        <Text style={s.footerPage} render={({ pageNumber }) => `Page ${pageNumber - 1}`} />
      </View>
    </>
  );
}

/**
 * A numbered section heading: purple bar, title, and the large faded number in the corner.
 *
 * The kit shrinks the title through 14.5, 12.5 and 11.5 point to keep it clear of the number, and
 * wraps to two lines only when it genuinely cannot fit. react-pdf reflows text on its own, so the
 * title is given the remaining width and allowed to wrap, which reaches the same outcome without
 * measuring strings.
 */
export function SectionHeading({ number, title }: { number: string; title: string }): React.ReactElement {
  return (
    <View style={s.section} wrap={false}>
      <View style={s.sectionRow}>
        <View style={s.sectionBar} />
        <Text style={s.sectionTitle}>{title}</Text>
        {number ? <Text style={s.sectionNumber}>{number}</Text> : null}
      </View>
    </View>
  );
}

/**
 * A pasted outline, reproduced as a structure.
 *
 * Each line keeps the depth it was pasted at, drawn as an indent with a hairline rail per level, so a
 * sitemap arrives as the shape the writer drew rather than as a paragraph of page names. Top-level
 * entries are set a little stronger, which is what makes a tree readable at a glance.
 */
export function Outline({
  items, levels,
}: { items: React.ReactNode[]; levels: number[] }): React.ReactElement {
  return (
    <View style={s.tree}>
      {items.map((item, i) => {
        const level = levels[i] ?? 0;
        return (
          <View key={i} style={s.treeRow} wrap={false}>
            {Array.from({ length: level }, (_, r) => <View key={r} style={s.treeRail} />)}
            <Text style={s.treeMark}>{level === 0 ? " " : "-"}</Text>
            <Text style={[s.treeText, ...(level === 0 ? [s.treeTop] : [])]}>{item}</Text>
          </View>
        );
      })}
    </View>
  );
}

/** A highlighted, left-bordered note. */
export function Callout({ children }: { children: string }): React.ReactElement {
  return (
    <View style={s.callout} wrap={false}>
      <Text style={s.calloutText}>{children}</Text>
    </View>
  );
}

/** A two-column label and value block. */
export function KeyValues({ rows }: { rows: [string, string][] }): React.ReactElement {
  return (
    <View style={s.kv}>
      {rows.map(([label, value], i) => (
        <View key={label} style={[s.kvRow, ...(i % 2 === 1 ? [s.tableRowTint] : [])]} wrap={false}>
          <Text style={s.kvLabel}>{label}</Text>
          <Text style={s.kvValue}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

/** How a row is set: an ordinary line, a subtotal, or the figure the document is about. */
export type RowEmphasis = "none" | "subtotal" | "total";

/**
 * A purple-header, alternating-row table. Widths are flex weights.
 *
 * Money is right-aligned and summary rows are lifted out of the body, because a price table is read
 * by running an eye down the last column: figures that do not share a right edge cannot be compared,
 * and a total that looks like another line item is one somebody will miss.
 */
export function BrandTable({
  headers, rows, widths, align = [], emphasis = [],
}: {
  headers: string[];
  rows: string[][];
  widths: number[];
  align?: ("left" | "right")[];
  emphasis?: RowEmphasis[];
}): React.ReactElement {
  return (
    <View style={s.table}>
      <View style={s.tableHeadRow} fixed>
        {headers.map((h, i) => (
          <Text key={h} style={[s.tableHeadCell, { flex: widths[i] ?? 1 }, ...(align[i] === "right" ? [s.cellRight] : [])]}>
            {h}
          </Text>
        ))}
      </View>
      {rows.map((row, r) => {
        const mark = emphasis[r] ?? "none";
        return (
          <View
            key={r}
            style={[
              s.tableRow,
              ...(mark === "none" && r % 2 === 1 ? [s.tableRowTint] : []),
              ...(mark === "subtotal" ? [s.tableSubtotalRow] : []),
              ...(mark === "total" ? [s.tableTotalRow] : []),
            ]}
            wrap={false}
          >
            {row.map((cell, i) => (
              <Text
                key={i}
                style={[
                  s.tableCell,
                  { flex: widths[i] ?? 1 },
                  ...(align[i] === "right" ? [s.cellRight] : []),
                  ...(mark === "none" ? [] : [s.tableStrong]),
                  ...(mark === "total" ? [s.tableTotalText] : []),
                ]}
              >
                {cell}
              </Text>
            ))}
          </View>
        );
      })}
    </View>
  );
}

/** The contents list, built from the section headings the document actually contains. */
export function TableOfContents({ entries }: { entries: { number: string; title: string }[] }): React.ReactElement {
  return (
    <View>
      {entries.map((e) => (
        <View key={e.number + e.title} style={s.tocRow} wrap={false}>
          <Text style={s.tocNumber}>{e.number}</Text>
          <Text style={s.tocTitle}>{e.title}</Text>
        </View>
      ))}
    </View>
  );
}

export const brandStyles = s;
export { COVER_X, COVER_W, CONTENT_WIDTH };
