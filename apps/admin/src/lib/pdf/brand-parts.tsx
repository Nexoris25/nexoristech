/**
 * The branded page furniture, ported from the kit's cover and furniture drawers.
 *
 * The kit draws these straight onto a ReportLab canvas with absolute coordinates. react-pdf has no
 * canvas, so each piece is rebuilt as absolutely positioned Views at the same coordinates. Positions
 * are measured from the top here rather than the bottom, because ReportLab's origin is bottom-left
 * and react-pdf's is top-left; every `PAGE_H - x` in the kit therefore becomes a plain `top: x`.
 *
 * The wordmark reads up the purple spine, as it does in the reference. It is drawn as a band the
 * length of the page, rotated a quarter turn about its own centre, rather than as rotated text inside
 * an upright box: the layout engine measures the band before the rotation is applied, so giving it
 * the shape it will actually occupy is what stops it clipping.
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
  /*
   * The wordmark reading up the spine, as the reference sets it.
   *
   * Drawn as a box the height of the page turned a quarter turn: the text is laid out horizontally in
   * a band as long as the page is tall, and the whole band is then rotated about its own centre so it
   * stands upright in the 52mm spine. Rotating the text alone leaves the layout engine measuring a
   * box of the wrong shape, which is what made an earlier attempt clip.
   */
  spineWordmark: {
    position: "absolute",
    top: PAGE.height / 2 - SPINE / 2,
    left: SPINE / 2 - PAGE.height / 2,
    width: PAGE.height,
    height: SPINE,
    transform: "rotate(-90deg)",
    justifyContent: "center",
    alignItems: "center",
  },
  spineWordmarkText: {
    fontFamily: FONT.bold, fontSize: 19, color: C.white, letterSpacing: 10, textAlign: "center",
  },
  coverLogo: { position: "absolute", right: mm(18), top: mm(14), height: mm(16), objectFit: "contain" },
  /* The eyebrow sits at the top of the cover, above everything, as it does in the reference. */
  eyebrow: {
    position: "absolute", right: mm(18), top: mm(34), width: COVER_W,
    textAlign: "right", fontFamily: FONT.medium, fontSize: 7.3, color: C.coverLabel, letterSpacing: 1.2,
  },
  preparedForLabel: { fontFamily: FONT.medium, fontSize: 9, color: C.coverLabel, letterSpacing: 0.6 },
  client: { fontFamily: FONT.bold, fontSize: 23, color: C.white, marginTop: mm(1.2) },
  title: { fontFamily: FONT.bold, fontSize: 14.5, color: C.white, marginTop: mm(7) },
  meta: { fontFamily: FONT.regular, fontSize: 9.2, color: C.coverSubtitle, marginTop: mm(3.6), lineHeight: 1.6 },
  metaLabel: { fontFamily: FONT.medium, color: C.coverMeta },
  /*
   * The foot of the cover, as one block anchored to the bottom edge.
   *
   * Each piece used to be positioned absolutely at its own distance from the bottom, which meant a
   * party name of more than one line grew upward into the rule above it. As one column the group
   * grows as a whole instead, and nothing can overlap anything else.
   */
  /* Anchored where the reference sets its party block: the label lands at about y 695. */
  foot: { position: "absolute", left: COVER_X, bottom: mm(36.2), width: COVER_W },
  preparedByRule: { height: 0.8, backgroundColor: C.coverDivider, marginBottom: mm(6) },
  /* The two parties side by side, as the reference sets them. */
  parties: { flexDirection: "row" },
  party: { flex: 1, paddingRight: mm(6) },
  preparedByLabel: { fontFamily: FONT.medium, fontSize: 8, color: C.coverLabel, letterSpacing: 0.6, marginBottom: mm(1) },
  partyName: { fontFamily: FONT.bold, fontSize: 10.5, color: C.white },
  preparedByLine: { fontFamily: FONT.regular, fontSize: 8.6, color: C.coverPreparedBy, lineHeight: 1.55, marginTop: mm(1.4) },

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

  section: { marginTop: 25, marginBottom: 17.5 },
  sectionRow: { flexDirection: "row", alignItems: "flex-start", position: "relative" },
  sectionBar: { width: mm(2.6), height: mm(10.5), backgroundColor: C.purple, marginRight: mm(3.9) },
  sectionTitle: { fontFamily: FONT.bold, fontSize: 14.5, color: C.ink, flex: 1, paddingTop: 2.6 },
  /*
   * The big faded number sits outside the flow, at the right.
   *
   * In the flow its 40 point line box, not the purple bar, decided how tall the heading was, which
   * pushed the rule below it a further fourteen points down the page. The reference lets the number
   * overhang: the rule is measured from the bar, and the number reaches past it.
   */
  sectionNumber: {
    // Width and right alignment, not `right: 0` alone: an auto-width absolute box lands at the margin
    // and runs off the page rather than ending at it.
    position: "absolute", right: 0, top: -6, width: 90, textAlign: "right",
    fontFamily: FONT.bold, fontSize: 40, color: C.purpleFade,
  },
  /* The reference draws this under every section heading, and under the contents title, at 1.1pt. */
  sectionRule: { height: 1.1, backgroundColor: C.purple, marginTop: 10 },

  /* A tinted block across the column, padded, with no border: the reference's notice, exactly. */
  callout: {
    backgroundColor: C.rowTint,
    paddingVertical: 10, paddingHorizontal: 10, marginTop: 4, marginBottom: 12,
  },
  calloutText: { ...TYPE.note, marginBottom: 0 },

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
  tocRow: {
    flexDirection: "row", alignItems: "flex-start",
    paddingBottom: mm(1.9), marginBottom: mm(1.9), borderBottomWidth: 0.5, borderBottomColor: C.rule,
  },
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
  /** Who wrote it: the legal name, and the registration it trades under. */
  preparedByLines: string[];
  /** The date the document is put forward. */
  proposalDate: string;
  /** How long it stands. */
  validity?: string;
  logoWhite?: Buffer;
}

/**
 * The navy and purple cover page.
 *
 * What this is, who it is for, who wrote it, when, and how long it stands. Nothing else: the
 * confidentiality notice used to sit at the foot in full, and a paragraph of terms across the bottom
 * of a cover is a legal page pretending to be a front page. It belongs in the document, which is
 * where the reference puts it and where it now goes.
 *
 * The parties are named the way the reference names them, with the standing each takes in the
 * document underneath: the recipient as the Client, Nexoris as the Developer.
 */
export function BrandCover({
  title, preparedFor, preparedByLines, proposalDate, validity, logoWhite,
}: CoverProps): React.ReactElement {
  const client = preparedFor || "The client";
  return (
    <View style={{ position: "absolute", top: 0, left: 0, width: PAGE.width, height: PAGE.height, backgroundColor: C.navy }}>
      <View style={s.spine} />
      <SpineRules />
      <View style={s.spineFoot} />
      <Text style={s.spineUrl}>www.nexoristech.com</Text>
      <View style={s.spineWordmark}>
        <Text style={s.spineWordmarkText}>NEXORIS TECHNOLOGIES</Text>
      </View>
      {logoWhite ? <Image src={logoWhite} style={s.coverLogo} /> : null}
      <Text style={s.eyebrow}>{`CONFIDENTIAL  ·  ${proposalDate.toUpperCase()}`}</Text>

      <View style={{ position: "absolute", left: COVER_X, top: mm(75), width: COVER_W }}>
        <Text style={s.preparedForLabel}>PREPARED FOR</Text>
        <Text style={s.client}>{client}</Text>
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

      <View style={s.foot}>
        <View style={s.preparedByRule} />
        <View style={s.parties}>
          <View style={s.party}>
            <Text style={s.preparedByLabel}>PREPARED FOR</Text>
            <Text style={s.partyName}>{client}</Text>
            <Text style={s.preparedByLine}>(&quot;Client&quot;)</Text>
          </View>
          <View style={s.party}>
            <Text style={s.preparedByLabel}>PREPARED BY</Text>
            <Text style={s.partyName}>{preparedByLines[0] || "Nexoris Technologies Ltd"}</Text>
            {preparedByLines.slice(1).map((entry) => (
              <Text key={entry} style={s.preparedByLine}>{entry}</Text>
            ))}
            <Text style={s.preparedByLine}>(&quot;Developer&quot;)</Text>
          </View>
        </View>
      </View>
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
    <View style={s.section} wrap={false} minPresenceAhead={mm(24)}>
      <View style={s.sectionRow}>
        <View style={s.sectionBar} />
        <Text style={s.sectionTitle}>{title}</Text>
        {number ? <Text style={s.sectionNumber}>{number}</Text> : null}
      </View>
      <View style={s.sectionRule} />
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

/**
 * A tinted note set apart from the copy.
 *
 * Rendered a line at a time, because the text can be typed into a textarea and a newline inside a
 * single Text does not wrap — it ends the render.
 */
export function Callout({ children }: { children: string }): React.ReactElement {
  const lines = children.split(/\r\n?|\n/).map((l) => l.trim()).filter((l) => l !== "");
  return (
    <View style={s.callout} minPresenceAhead={mm(16)}>
      {(lines.length > 0 ? lines : [" "]).map((entry, i) => (
        <Text key={i} style={s.calloutText}>{entry}</Text>
      ))}
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
