/**
 * The plain layout for agreements: Master Service Agreement, Contract, Service Level Agreement, and
 * Scope of Work.
 *
 * Deliberately not the Proposal. A proposal is a sales document and is allowed to be handsome — a purple
 * cover, a lede, a closing invitation. An agreement is a working legal instrument that gets read closely,
 * marked up, and filed, so it is set plainly: a restrained letterhead, a parties block that names who is
 * bound, numbered clauses that can be cited in conversation ("clause 4.2"), and a signing page.
 *
 * The same single rich text editor feeds it. The writer pastes the agreement text; this file supplies
 * only the frame.
 */
import React from "react";
import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import type { CompanyInfo, DocumentData } from "./types.js";

const C = {
  ink: "#111118",
  grey: "#43434F",
  faint: "#6B6B79",
  line: "#D9D9E2",
  rule: "#111118",
};

const M = 56; // wider gutter than the proposal: agreements are read line by line and often annotated

export const a = StyleSheet.create({
  /**
   * The top and bottom padding must sit on the Page, not on the content wrapper. A wrapper's padding
   * applies once, to the first page; every page after it would start at y=0 and run underneath the
   * fixed letterhead. This reserves the band on each page the body flows onto.
   */
  page: { paddingTop: 78, paddingBottom: 66, fontFamily: "Lora", fontSize: 10.5, color: C.ink },

  // Letterhead, not a cover. Rule and type only, no colour field.
  head: {
    position: "absolute", top: 0, left: 0, right: 0,
    paddingHorizontal: M, paddingTop: 26, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: C.line,
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
  },
  headBrand: { flexDirection: "row", alignItems: "center" },
  /** 195x218 source, so 15pt wide lands at ~17pt tall: the mark's own proportions, never stretched. */
  headMark: { width: 15, height: 17, objectFit: "contain", marginRight: 7 },
  headName: { fontFamily: "Jakarta", fontSize: 9, fontWeight: 700, letterSpacing: 0.6 },
  headMeta: { fontFamily: "Jakarta", fontSize: 7, color: C.faint, textAlign: "right", lineHeight: 1.5 },

  foot: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: M, paddingBottom: 24, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: C.line,
    flexDirection: "row", justifyContent: "space-between",
  },
  footText: { fontFamily: "Jakarta", fontSize: 7.5, color: C.faint },

  body: { paddingHorizontal: M },

  docType: { fontFamily: "Jakarta", fontSize: 7.5, letterSpacing: 2, color: C.faint, fontWeight: 700, textAlign: "center" },
  title: { fontFamily: "Lora", fontSize: 16, fontWeight: 700, textAlign: "center", marginTop: 8, lineHeight: 1.3 },
  titleRule: { height: 1, backgroundColor: C.rule, marginTop: 16, marginBottom: 20 },

  // Who is bound, stated before anything else.
  parties: { marginBottom: 20 },
  partiesLabel: { fontFamily: "Jakarta", fontSize: 7, letterSpacing: 1.4, color: C.faint, fontWeight: 700, marginBottom: 8 },
  partyRow: { flexDirection: "row", marginBottom: 7 },
  partyTag: { fontFamily: "Lora", width: 62, fontSize: 8.5, fontWeight: 700 },
  partyBody: { flex: 1, fontSize: 10.5, lineHeight: 1.65 },
  dateLine: { fontSize: 10.5, marginTop: 10, lineHeight: 1.65 },

  intro: { fontSize: 10.5, color: C.ink, lineHeight: 1.8, marginBottom: 18 },

  // Numbered clauses. The number sits in the margin so the text block stays flush.
  clause: { flexDirection: "row", marginBottom: 14 },
  clauseNum: { fontFamily: "Lora", width: 26, fontSize: 11, fontWeight: 700 },
  clauseBody: { flex: 1 },
  clauseHeading: { fontFamily: "Lora", fontSize: 11, fontWeight: 700, marginBottom: 6, letterSpacing: 0.2 },
  clauseText: { fontSize: 10.5, lineHeight: 1.8, color: C.ink },

  // Signing page
  signIntro: { fontSize: 10.5, lineHeight: 1.8, marginTop: 8, marginBottom: 26 },
  signRow: { flexDirection: "row", marginTop: 6 },
  signCol: { flex: 1, paddingRight: 30 },
  signParty: { fontFamily: "Jakarta", fontSize: 7.5, fontWeight: 700, letterSpacing: 1.2, marginBottom: 16, color: C.faint },
  signField: { marginBottom: 18 },
  signLabel: { fontFamily: "Jakarta", fontSize: 7, color: C.faint, letterSpacing: 1.1, fontWeight: 700, marginBottom: 4 },
  signValue: { fontFamily: "Lora", fontSize: 10, fontWeight: 700 },
  /** Height reserved either way, so inserting a signature never moves the rule or the other column. */
  signSlot: { height: 46, justifyContent: "flex-end" },
  /** Aspect and orientation preserved; nothing painted behind it. */
  signImg: { height: 44, maxWidth: 170, objectFit: "contain", objectPosition: "left bottom" },
  signRule: { borderBottomWidth: 1, borderBottomColor: C.rule, marginTop: 2 },
  stampWrap: { alignItems: "flex-start", marginTop: 10 },
  stampImg: { width: 92, height: 92, objectFit: "contain" },
});

function Furniture({ data, company, client, mark }: { data: DocumentData; company: CompanyInfo; client: string; mark?: Buffer }): React.ReactElement {
  return (
    <>
      <View style={a.head} fixed>
        <View style={a.headBrand}>
          {mark ? <Image src={{ data: mark, format: "png" }} style={a.headMark} /> : null}
          <Text style={a.headName}>{company.legalName}</Text>
        </View>
        {/* Two Text elements rather than one carrying a newline: with a registered TTF, react-pdf
            crashes on a literal newline inside a Text (it reads unitsPerEm off an undefined run). */}
        <View>
          <Text style={a.headMeta}>
            {data.kind}
            {data.reference ? `  ·  ${data.reference}` : ""}
          </Text>
          <Text style={a.headMeta}>{data.date}</Text>
        </View>
      </View>
      <View style={a.foot} fixed>
        <Text style={a.footText}>
          {data.kind}
          {client ? ` — ${company.legalName} and ${client}` : ""}
        </Text>
        <Text style={a.footText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
      </View>
    </>
  );
}

/**
 * A clause. `heading` is optional because agreement text is often a bare numbered paragraph with no
 * sub-title, and forcing one would invent structure the drafter did not write.
 */
export function Clause({ n, heading, children }: { n: string; heading?: string; children?: React.ReactNode }): React.ReactElement {
  return (
    <View style={a.clause} wrap={false}>
      <Text style={a.clauseNum}>{n}</Text>
      <View style={a.clauseBody}>
        {heading ? <Text style={a.clauseHeading}>{heading}</Text> : null}
        {children}
      </View>
    </View>
  );
}

export function AgreementSigning({
  data, company, client, stamp, signature,
}: {
  data: DocumentData; company: CompanyInfo; client: string;
  stamp?: Buffer; signature?: Buffer;
}): React.ReactElement {
  return (
    <View wrap={false}>
      <Text style={a.signIntro}>
        The parties have executed this {data.kind.toLowerCase()} as of the date first written above, each signatory
        warranting that they are duly authorised to do so.
      </Text>
      <View style={a.signRow}>
        <View style={a.signCol}>
          <Text style={a.signParty}>FOR {company.legalName.toUpperCase()}</Text>
          <View style={a.signField}>
            <Text style={a.signLabel}>NAME</Text>
            <Text style={a.signValue}>{data.signatory?.name || " "}</Text>
          </View>
          <View style={a.signField}>
            <Text style={a.signLabel}>TITLE</Text>
            <Text style={a.signValue}>{data.signatory?.title || " "}</Text>
          </View>
          <View style={a.signField}>
            <Text style={a.signLabel}>SIGNATURE</Text>
            <View style={a.signSlot}>
              {data.insertSignature && signature
                ? <Image src={{ data: signature, format: "png" }} style={a.signImg} />
                : null}
            </View>
            <View style={a.signRule} />
          </View>
          <View style={a.signField}>
            <Text style={a.signLabel}>DATE</Text>
            <View style={a.signSlot}>
              {data.insertSignature ? <Text style={a.signValue}>{data.date}</Text> : null}
            </View>
            <View style={a.signRule} />
          </View>
          {/* Applied by Nexoris Technologies, so it belongs in the Nexoris column rather than floating
              at the foot of the page between both signatories. */}
          {data.insertStamp && stamp ? (
            <View style={a.stampWrap}>
              <Image src={{ data: stamp, format: "png" }} style={a.stampImg} />
            </View>
          ) : null}
        </View>

        <View style={a.signCol}>
          <Text style={a.signParty}>FOR {(client || "THE CLIENT").toUpperCase()}</Text>
          {/* Never pre-completed on the client's behalf. */}
          {["NAME", "TITLE", "SIGNATURE", "DATE"].map((label) => (
            <View key={label} style={a.signField}>
              <Text style={a.signLabel}>{label}</Text>
              <View style={a.signSlot} />
              <View style={a.signRule} />
            </View>
          ))}
        </View>
      </View>

    </View>
  );
}

/**
 * The agreement page. One flowing document: letterhead, title, parties, the pasted body, then the
 * signing block at the end of the text rather than on a page of its own — a signature that has floated
 * away from the terms it signs is a drafting smell.
 */
export function AgreementPages({
  data, company, mark, stamp, signature, children,
}: {
  data: DocumentData; company: CompanyInfo;
  mark?: Buffer; stamp?: Buffer; signature?: Buffer;
  children: React.ReactNode;
}): React.ReactElement {
  const client = [data.recipientCompany, data.recipientName].filter(Boolean).join(", ");
  return (
    <Page size="A4" style={a.page}>
      <Furniture data={data} company={company} client={client} {...(mark ? { mark } : {})} />
      <View style={a.body}>
        <Text style={a.docType}>{data.kind.toUpperCase()}</Text>
        <Text style={a.title}>{data.title}</Text>
        <View style={a.titleRule} />

        <View style={a.parties}>
          <Text style={a.partiesLabel}>BETWEEN</Text>
          <View style={a.partyRow}>
            <Text style={a.partyTag}>(1)</Text>
            <Text style={a.partyBody}>
              {company.legalName}
              {company.tin ? ` (TIN ${company.tin})` : ""}, of {company.address} (the &ldquo;Provider&rdquo;)
            </Text>
          </View>
          <View style={a.partyRow}>
            <Text style={a.partyTag}>(2)</Text>
            <Text style={a.partyBody}>
              {client || "the Client"}
              {data.recipientAddress ? `, of ${data.recipientAddress}` : ""} (the &ldquo;Client&rdquo;)
            </Text>
          </View>
          <Text style={a.dateLine}>Dated {data.date}.</Text>
        </View>

        {data.intro ? <Text style={a.intro}>{data.intro}</Text> : null}

        {children}

        {data.signature ? (
          <AgreementSigning
            data={data}
            company={company}
            client={client}
            {...(stamp ? { stamp } : {})}
            {...(signature ? { signature } : {})}
          />
        ) : null}
      </View>
    </Page>
  );
}
