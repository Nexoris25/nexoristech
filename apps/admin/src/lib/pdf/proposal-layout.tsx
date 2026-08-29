/**
 * The branded Proposal layout, matching the approved handoff (Custom Lottery Platform Development
 * Proposal, July 2026).
 *
 * The shape of the document is fixed and the content is not. A human writes the proposal in one rich
 * text editor and pastes it in; everything around it — cover, document information, confidentiality
 * notice, running header and footer, acceptance page, contact page — is furniture this file supplies.
 * That is the whole point of the single-editor model: the writer never rebuilds the wrapper, and the
 * wrapper never depends on what was written.
 *
 * Page furniture uses react-pdf's `fixed` so it repeats on every page of a flowing body, and the page
 * number comes from the `render` callback rather than being counted by hand.
 */
import React from "react";
import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { CompanyInfo, DocumentData, RichBlock } from "./types.js";

/**
 * The palette, read out of the approved handoff's own content streams rather than eyeballed. These are
 * the exact fills that document uses, so the theme matches by measurement instead of by impression.
 */
const C = {
  purple: "#543CDA",
  purpleDeep: "#3D2BA8",
  purpleTint: "#E7E1FA",
  purpleSoft: "#DAD3F5",
  coverInk: "#0E1020",
  ink: "#161726",
  grey: "#3A3B4C",
  faint: "#62637A",
  line: "#E7E5F0",
  wash: "#F6F4FD",
};

const M = 48; // page margin, matching the handoff's generous gutter

export const p = StyleSheet.create({
  /**
   * Padding belongs on the Page, not the content wrapper: a wrapper pads only its first page, so a
   * body flowing onto page 2 would start under the fixed running header.
   */
  page: { paddingTop: 76, paddingBottom: 66, fontFamily: "Jakarta", fontSize: 10.5, color: C.ink },

  // ---- Cover ----------------------------------------------------------------
  coverPage: { fontFamily: "Jakarta", color: "#FFFFFF", backgroundColor: C.coverInk, paddingTop: 0 },
  /** The handoff runs a purple column down the full height of the cover, about a sixth of the width. */
  coverSpine: { position: "absolute", left: 0, top: 0, bottom: 0, width: 96, backgroundColor: C.purple },
  coverBand: { paddingLeft: 130, paddingRight: M, paddingTop: 54 },
  coverLogoRow: { flexDirection: "row", alignItems: "center" },
  /** The mark is 195x218, so a 26pt width lands at ~29pt tall: the wordmark's own proportions. */
  coverMark: { width: 26, height: 29, objectFit: "contain", marginRight: 11 },
  coverBrand: { fontSize: 13, fontWeight: 700, color: "#FFFFFF", letterSpacing: 1.4 },
  coverBrandSub: { fontSize: 6.5, color: C.purpleSoft, letterSpacing: 2.6, marginTop: 2 },
  coverBandFoot: { marginTop: 22 },
  coverSite: { fontSize: 8.5, color: C.purpleSoft, letterSpacing: 0.5 },
  coverConf: { fontSize: 7.5, color: C.purpleSoft, letterSpacing: 1.4, marginTop: 4 },
  coverBody: { paddingLeft: 130, paddingRight: M, paddingTop: 44 },
  coverEyebrow: { fontSize: 7.5, color: C.purpleSoft, letterSpacing: 1.6, fontWeight: 700 },
  coverClient: { fontSize: 15, fontWeight: 700, marginTop: 5, color: "#FFFFFF" },
  coverTitle: { fontSize: 29, fontWeight: 700, marginTop: 26, lineHeight: 1.18, color: "#FFFFFF" },
  coverSub: { fontSize: 12, color: C.purpleSoft, marginTop: 11, fontWeight: 700 },
  coverLede: { fontSize: 10.5, color: "#C9C6D8", marginTop: 15, lineHeight: 1.68 },
  coverRule: { height: 3, width: 56, backgroundColor: C.purple, marginTop: 28, marginBottom: 20 },
  /** On the dark field the facts sit on a raised block rather than a light wash. */
  coverFacts: { backgroundColor: "#1A1C2E", borderLeftWidth: 3, borderLeftColor: C.purple, paddingVertical: 14, paddingHorizontal: 16 },
  coverFact: { fontSize: 9.5, color: "#B7B4C6", marginBottom: 5, lineHeight: 1.55 },
  coverFactKey: { fontWeight: 700, color: "#FFFFFF" },
  coverFoot: { position: "absolute", bottom: 0, left: 96, right: 0, flexDirection: "row", borderTopWidth: 1, borderTopColor: "#2A2C40" },
  coverFootCell: { flex: 1, paddingVertical: 18, paddingHorizontal: 34 },
  coverFootLabel: { fontSize: 6.5, color: "#A9A6BC", letterSpacing: 1.3, fontWeight: 700 },
  coverFootValue: { fontSize: 9.5, fontWeight: 700, marginTop: 4, color: "#FFFFFF" },

  // ---- Running furniture ----------------------------------------------------
  runHead: {
    position: "absolute", top: 0, left: 0, right: 0,
    flexDirection: "row", justifyContent: "space-between",
    paddingHorizontal: M, paddingTop: 22, paddingBottom: 12,
    borderBottomWidth: 2, borderBottomColor: C.purple,
    backgroundColor: C.wash,
  },
  runHeadL: { fontSize: 7, color: C.purple, letterSpacing: 1.1, fontWeight: 700 },
  runHeadR: { fontSize: 7, color: C.faint, letterSpacing: 1.1, fontWeight: 700 },
  runFoot: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: M, paddingBottom: 18, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: C.purpleTint,
  },
  runFootText: { fontSize: 7, color: C.faint },
  /** Plain "Page N" at the footer's own size, matching the handoff. A filled badge was my invention. */
  runFootPage: { fontSize: 7.5, fontWeight: 700, color: C.purple },

  body: { paddingHorizontal: M },

  // ---- Section furniture ----------------------------------------------------
  sectionTitleRow: {
    flexDirection: "row", alignItems: "center", marginTop: 4, marginBottom: 14,
    backgroundColor: C.purpleTint, paddingVertical: 9, paddingHorizontal: 12,
  },
  sectionNum: {
    width: 21, height: 21, borderRadius: 11, backgroundColor: C.purple,
    color: "#FFFFFF", fontSize: 9, fontWeight: 700, textAlign: "center", paddingTop: 5.5, marginRight: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: 700, flex: 1, color: C.purpleDeep },
  /** Stands in for the number badge on unnumbered furniture pages, keeping the same left rhythm. */
  sectionAccent: { width: 4, height: 21, backgroundColor: C.purple, marginRight: 12 },

  // ---- Document information -------------------------------------------------
  infoRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.line, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: C.wash },
  infoKey: { width: 132, fontSize: 9, color: C.purple, fontWeight: 700, letterSpacing: 0.4 },
  infoVal: { flex: 1, fontSize: 10.5, lineHeight: 1.6 },
  notice: { backgroundColor: C.wash, borderLeftWidth: 3, borderLeftColor: C.purple, padding: 14, marginTop: 26 },
  noticeTitle: { fontSize: 8, fontWeight: 700, letterSpacing: 1.2, color: C.purple },
  noticeBody: { fontSize: 9.5, color: C.ink, lineHeight: 1.7, marginTop: 6 },

  // ---- Table of contents ----------------------------------------------------
  tocRow: { flexDirection: "row", alignItems: "flex-end", paddingVertical: 6 },
  tocNum: { width: 20, fontSize: 8.5, color: C.purple, fontWeight: 700 },
  tocText: { fontSize: 10.5 },
  tocDots: { flex: 1, borderBottomWidth: 1, borderBottomColor: C.line, marginHorizontal: 6, marginBottom: 2.5 },

  // ---- Acceptance -----------------------------------------------------------
  acceptLede: { fontSize: 10.5, color: C.ink, lineHeight: 1.75, marginBottom: 26 },
  signRow: { flexDirection: "row", marginTop: 4 },
  signCol: { flex: 1, paddingRight: 26 },
  signParty: { fontSize: 7.5, color: C.purple, fontWeight: 700, letterSpacing: 1.2, marginBottom: 14 },
  signField: { marginBottom: 16 },
  signLabel: { fontSize: 6.5, color: C.faint, letterSpacing: 1.1, fontWeight: 700, marginBottom: 4 },
  signValue: { fontSize: 10, fontWeight: 700 },
  /** Reserves the signature's height so inserting one never moves the rule beneath it. */
  signSlot: { height: 46, justifyContent: "flex-end" },
  /** Aspect and orientation preserved; nothing is painted behind it. */
  signImg: { height: 44, maxWidth: 170, objectFit: "contain", objectPosition: "left bottom" },
  signRule: { borderBottomWidth: 1.5, borderBottomColor: C.purple, marginTop: 2 },
  stampWrap: { alignItems: "flex-start", marginTop: 10 },
  stampImg: { width: 96, height: 96, objectFit: "contain" },

  // ---- Contact --------------------------------------------------------------
  contactCard: { backgroundColor: C.wash, borderLeftWidth: 3, borderLeftColor: C.purple, padding: 22, marginBottom: 26 },
  contactRow: { flexDirection: "row", paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: C.line },
  contactKey: { width: 88, fontSize: 6.5, color: C.purple, letterSpacing: 1.1, fontWeight: 700, paddingTop: 2 },
  contactVal: { flex: 1, fontSize: 10.5, lineHeight: 1.55 },
  closingTitle: { fontSize: 19, fontWeight: 700, marginBottom: 10, color: C.purpleDeep },
  closingBody: { fontSize: 10.5, color: C.ink, lineHeight: 1.75 },
  closingSign: { fontSize: 10, fontWeight: 700, color: C.purple, marginTop: 14 },
});

const CONFIDENTIALITY = (company: string, client: string): string =>
  `This proposal contains confidential and proprietary information belonging to ${company}. It is prepared exclusively for ${client} for the purpose of evaluating the proposed services. No part of this document may be copied, distributed, or disclosed to any third party without the prior written consent of ${company}.`;

/** The running header and footer, repeated on every page of the flowing body. */
export function PageFurniture({ data, company, client }: { data: DocumentData; company: CompanyInfo; client: string }): React.ReactElement {
  return (
    <>
      <View style={p.runHead} fixed>
        <Text style={p.runHeadL}>{data.title.toUpperCase()}</Text>
        <Text style={p.runHeadR}>{company.legalName.toUpperCase()}</Text>
      </View>
      <View style={p.runFoot} fixed>
        <Text style={p.runFootText}>
          {company.legalName}  |  Confidential &amp; Proprietary{client ? `  |  Prepared for ${client}` : ""}
        </Text>
        <Text style={p.runFootPage} render={({ pageNumber }) => `Page ${pageNumber}`} />
      </View>
    </>
  );
}

/**
 * A section heading, with the handoff's badge when a number is given.
 *
 * The furniture pages deliberately carry no number. In the handoff they sit inside a 26-section
 * document and are numbered accordingly, but here the body comes from a free-form editor whose
 * headings the system does not count. Printing a fixed "1" on Document Information while the pasted
 * body starts at its own "Executive Summary" would be worse than printing nothing.
 */
export function SectionTitle({ n, children }: { n?: number; children: string }): React.ReactElement {
  return (
    <View style={p.sectionTitleRow} wrap={false}>
      {n === undefined ? <View style={p.sectionAccent} /> : <Text style={p.sectionNum}>{n}</Text>}
      <Text style={p.sectionTitle}>{children}</Text>
    </View>
  );
}

export function CoverPage({
  data, company, client, subtitle, logo,
}: { data: DocumentData; company: CompanyInfo; client: string; subtitle?: string; logo?: Buffer }): React.ReactElement {
  const registration = [
    company.tin ? `TIN ${company.tin}` : null,
  ].filter(Boolean).join(" | ");
  return (
    <Page size="A4" style={p.coverPage}>
      {/* The purple spine runs the full height behind everything, so the cover reads as brand first. */}
      <View style={p.coverSpine} />
      <View style={p.coverBand}>
        <View style={p.coverLogoRow}>
          {logo ? <Image src={{ data: logo, format: "png" }} style={p.coverMark} /> : null}
          <View>
            <Text style={p.coverBrand}>{company.legalName.replace(/ Ltd\.?$/i, "").toUpperCase()}</Text>
            <Text style={p.coverBrandSub}>TECHNOLOGIES</Text>
          </View>
        </View>
        <View style={p.coverBandFoot}>
          {/* The canonical spelling of the site, which is the bare host. The fallback said
              www.nexoristech.com, so a proposal sent to a client before the company profile was
              filled in printed an address the site does not use. */}
          <Text style={p.coverSite}>{company.website ?? "nexoristech.com"}</Text>
          <Text style={p.coverConf}>CONFIDENTIAL  ·  {data.date.toUpperCase()}</Text>
        </View>
      </View>

      <View style={p.coverBody}>
        <Text style={p.coverEyebrow}>PREPARED FOR</Text>
        <Text style={p.coverClient}>{client || "—"}</Text>

        <Text style={p.coverTitle}>{data.title}</Text>
        {subtitle ? <Text style={p.coverSub}>{subtitle}</Text> : null}
        {data.intro ? <Text style={p.coverLede}>{data.intro}</Text> : null}

        <View style={p.coverRule} />
        <View style={p.coverFacts}>
          <Text style={p.coverFact}>
            <Text style={p.coverFactKey}>Prepared by: </Text>
            {company.legalName}{registration ? ` (${registration})` : ""}
          </Text>
          <Text style={p.coverFact}><Text style={p.coverFactKey}>Proposal Date: </Text>{data.date}</Text>
          <Text style={p.coverFact}><Text style={p.coverFactKey}>Validity: </Text>30 days from the date above</Text>
        </View>
      </View>

      <View style={p.coverFoot}>
        <View style={p.coverFootCell}>
          <Text style={p.coverFootLabel}>PREPARED FOR</Text>
          <Text style={p.coverFootValue}>{client || "—"}</Text>
        </View>
        <View style={p.coverFootCell}>
          <Text style={p.coverFootLabel}>PREPARED BY</Text>
          <Text style={p.coverFootValue}>{company.legalName}</Text>
        </View>
      </View>
    </Page>
  );
}

/**
 * The top-level headings of the pasted body, in order.
 *
 * Derived rather than authored: in a single-editor model the writer types headings and the contents
 * page follows from them. Asking for the list a second time would let the two disagree, and a contents
 * page that disagrees with the document is worse than none.
 */
export function tocEntries(rich: RichBlock[]): string[] {
  return rich
    .filter((b) => b.type === "h2")
    .map((b) => (b.runs ?? []).map((r) => r.text).join("").trim())
    .filter((t) => t.length > 0);
}

export function TableOfContentsPage({
  data, company, client, entries,
}: { data: DocumentData; company: CompanyInfo; client: string; entries: string[] }): React.ReactElement {
  return (
    <Page size="A4" style={p.page}>
      <PageFurniture data={data} company={company} client={client} />
      <View style={p.body}>
        <SectionTitle>Table of Contents</SectionTitle>
        {entries.map((e, i) => (
          <View key={`${e}-${i}`} style={p.tocRow}>
            <Text style={p.tocNum}>{i + 1}</Text>
            <Text style={p.tocText}>{e}</Text>
            <View style={p.tocDots} />
          </View>
        ))}
      </View>
    </Page>
  );
}

export function DocumentInfoPage({
  data, company, client,
}: { data: DocumentData; company: CompanyInfo; client: string }): React.ReactElement {
  const rows: [string, string][] = [
    ["Document Title", data.title],
    ["Prepared For", client || "—"],
    ["Prepared By", `${company.legalName}${company.tin ? ` (TIN ${company.tin})` : ""}`],
    ["Registered Address", company.address],
    ["Proposal Date", data.date],
    ["Validity", "30 days from the date above"],
    ...(data.reference ? ([["Reference", data.reference]] as [string, string][]) : []),
  ];
  return (
    <Page size="A4" style={p.page}>
      <PageFurniture data={data} company={company} client={client} />
      <View style={p.body}>
        <SectionTitle>Document Information</SectionTitle>
        {rows.map(([k, v]) => (
          <View key={k} style={p.infoRow}>
            <Text style={p.infoKey}>{k}</Text>
            <Text style={p.infoVal}>{v}</Text>
          </View>
        ))}
        <View style={p.notice}>
          <Text style={p.noticeTitle}>CONFIDENTIALITY NOTICE</Text>
          <Text style={p.noticeBody}>{CONFIDENTIALITY(company.legalName, client || "the recipient")}</Text>
        </View>
      </View>
    </Page>
  );
}

/**
 * The acceptance page. The signature and stamp are inserted only when asked for AND the real file
 * exists; neither is ever drawn, and the client's line is always left blank for them to sign.
 */
export function AcceptancePage({
  data, company, client, stamp, signature,
}: {
  data: DocumentData; company: CompanyInfo; client: string;
  stamp?: Buffer; signature?: Buffer;
}): React.ReactElement {
  return (
    <Page size="A4" style={p.page}>
      <PageFurniture data={data} company={company} client={client} />
      <View style={p.body}>
        <SectionTitle>Acceptance</SectionTitle>
        <Text style={p.acceptLede}>
          By signing below, the Client acknowledges acceptance of this proposal and authorises {company.legalName} to
          commence the project in accordance with the terms stated herein.
        </Text>

        <View style={p.signRow}>
          <View style={p.signCol}>
            <Text style={p.signParty}>FOR THE CLIENT</Text>
            <View style={p.signField}>
              <Text style={p.signLabel}>NAME</Text>
              <Text style={p.signValue}>{client || " "}</Text>
            </View>
            <View style={p.signField}>
              <Text style={p.signLabel}>SIGNATURE</Text>
              <View style={p.signSlot} />
              <View style={p.signRule} />
            </View>
            <View style={p.signField}>
              <Text style={p.signLabel}>DATE</Text>
              <View style={p.signSlot} />
              <View style={p.signRule} />
            </View>
          </View>

          <View style={p.signCol}>
            <Text style={p.signParty}>FOR {company.legalName.toUpperCase()}</Text>
            <View style={p.signField}>
              <Text style={p.signLabel}>NAME</Text>
              <Text style={p.signValue}>{data.signatory?.name || " "}</Text>
            </View>
            <View style={p.signField}>
              <Text style={p.signLabel}>SIGNATURE</Text>
              <View style={p.signSlot}>
                {data.insertSignature && signature
                  ? <Image src={{ data: signature, format: "png" }} style={p.signImg} />
                  : null}
              </View>
              <View style={p.signRule} />
            </View>
            <View style={p.signField}>
              <Text style={p.signLabel}>DATE</Text>
              <View style={p.signSlot}>
                {data.insertSignature ? <Text style={p.signValue}>{data.date}</Text> : null}
              </View>
              <View style={p.signRule} />
            </View>
            {/* The stamp belongs to the party that applied it, so it sits in the Nexoris Technologies
                column rather than floating at the foot of the page between both signatories. */}
            {data.insertStamp && stamp ? (
              <View style={p.stampWrap}>
                <Image src={{ data: stamp, format: "png" }} style={p.stampImg} />
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Page>
  );
}

export function ContactPage({
  data, company, client,
}: { data: DocumentData; company: CompanyInfo; client: string }): React.ReactElement {
  const rows: [string, string][] = [
    ["COMPANY", company.legalName],
    ["ADDRESS", company.address],
    ["EMAIL", company.email],
    ["PHONE", company.phone],
    ...(company.website ? ([["WEBSITE", company.website]] as [string, string][]) : []),
  ];
  return (
    <Page size="A4" style={p.page}>
      <PageFurniture data={data} company={company} client={client} />
      <View style={p.body}>
        <SectionTitle>Contact</SectionTitle>
        <View style={p.contactCard}>
          {rows.map(([k, v], i) => (
            <View key={k} style={i === rows.length - 1 ? { ...p.contactRow, borderBottomWidth: 0 } : p.contactRow}>
              <Text style={p.contactKey}>{k}</Text>
              <Text style={p.contactVal}>{v}</Text>
            </View>
          ))}
        </View>
        <Text style={p.closingTitle}>Let&rsquo;s Build This Together</Text>
        <Text style={p.closingBody}>
          Thank you for the opportunity to submit this proposal. We look forward to partnering with you in bringing
          this work to life, delivered by a team that treats your business rules as the foundation of the build,
          not an afterthought.
        </Text>
        <Text style={p.closingSign}>— {company.legalName}</Text>
      </View>
    </Page>
  );
}
