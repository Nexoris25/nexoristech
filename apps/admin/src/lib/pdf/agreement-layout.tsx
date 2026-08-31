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
import { C as BRAND, FONT } from "./brand.js";

/*
 * The branding kit's palette, used with restraint.
 *
 * This is the same brand as the proposal and it should look like it, but an agreement earns nothing
 * from a field of colour. So the kit's ink, soft ink and rule carry the whole document, and the
 * purple appears in exactly two places: the hairline under the letterhead and the clause numbers.
 * That is enough to place the document in the family without turning an instrument into a brochure.
 */
const C = {
  ink: BRAND.ink,
  grey: BRAND.inkSoft,
  faint: BRAND.inkSoft,
  line: BRAND.rule,
  rule: BRAND.ink,
  accent: BRAND.purple,
};

const M = 56; // wider gutter than the proposal: agreements are read line by line and often annotated

/*
 * Set in the brand typeface, at the leading a legal document is normally set at.
 *
 * This was a serif at 10.5 point on 1.8 leading, which is a page-and-a-half of air for every page of
 * terms: it pushed clauses apart, and it was a second typeface in a house that has one. Poppins at
 * 9.8 on 1.5, the same face the rest of the document family uses, is the standard setting and reads
 * as one body of work.
 *
 * Poppins is registered as a family per weight rather than one family with weights, so bold is
 * selected by name. `fontWeight: 700` would silently resolve back to the regular cut.
 */
export const a = StyleSheet.create({
  /**
   * The top and bottom padding must sit on the Page, not on the content wrapper. A wrapper's padding
   * applies once, to the first page; every page after it would start at y=0 and run underneath the
   * fixed letterhead. This reserves the band on each page the body flows onto.
   */
  page: { paddingTop: 74, paddingBottom: 62, fontFamily: FONT.regular, fontSize: 9.8, color: C.ink },

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
  headName: { fontFamily: FONT.bold, fontSize: 9, letterSpacing: 0.6 },
  headMeta: { fontFamily: FONT.regular, fontSize: 7, color: C.faint, textAlign: "right", lineHeight: 1.5 },

  foot: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: M, paddingBottom: 24, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: C.line,
    flexDirection: "row", justifyContent: "space-between",
  },
  footText: { fontFamily: FONT.regular, fontSize: 7.5, color: C.faint },

  body: { paddingHorizontal: M },

  docType: { fontFamily: FONT.bold, fontSize: 7.5, letterSpacing: 2, color: C.faint, textAlign: "center" },
  title: { fontFamily: FONT.bold, fontSize: 15, textAlign: "center", marginTop: 8, lineHeight: 1.3 },
  titleRule: { height: 1, backgroundColor: C.rule, marginTop: 14, marginBottom: 18 },

  // Who is bound, stated before anything else.
  parties: { marginBottom: 18 },
  partiesLabel: { fontFamily: FONT.bold, fontSize: 7, letterSpacing: 1.4, color: C.faint, marginBottom: 8 },
  partyRow: { flexDirection: "row", marginBottom: 6 },
  partyTag: { fontFamily: FONT.bold, width: 58, fontSize: 8.5 },
  partyBody: { flex: 1, fontSize: 9.8, lineHeight: 1.5 },
  dateLine: { fontSize: 9.8, marginTop: 9, lineHeight: 1.5 },

  intro: { fontSize: 9.8, color: C.ink, lineHeight: 1.5, marginBottom: 15 },

  /*
   * Numbered clauses. The number hangs in the margin so the text block stays flush.
   *
   * The hanging column was 26 and 30 points wide against a 10.5 point face, which left a channel of
   * white between every number and its clause. It is now just wide enough for the numbers actually
   * used, which is what puts the text where the eye expects it.
   */
  clause: { flexDirection: "row", marginBottom: 10 },
  clauseNum: { fontFamily: FONT.bold, width: 21, fontSize: 10, color: C.accent },
  /* Sub-clauses are indented under their parent and numbered 1.1, 1.2, so they can be cited. */
  subClause: { flexDirection: "row", marginTop: 5, marginBottom: 2 },
  subClauseNum: { fontFamily: FONT.bold, width: 25, fontSize: 9.5, color: C.grey },
  subClauseBody: { flex: 1 },
  subClauseHeading: { fontFamily: FONT.bold, fontSize: 9.3, marginBottom: 3 },
  clauseBody: { flex: 1 },
  clauseHeading: { fontFamily: FONT.bold, fontSize: 10.5, marginBottom: 5, letterSpacing: 0.2 },
  clauseText: { fontSize: 9.8, lineHeight: 1.5, color: C.ink },

  // Signing page
  signIntro: { fontSize: 9.8, lineHeight: 1.5, marginTop: 8, marginBottom: 22 },
  signRow: { flexDirection: "row", marginTop: 6 },
  signCol: { flex: 1, paddingRight: 30 },
  signParty: { fontFamily: FONT.bold, fontSize: 7.5, letterSpacing: 1.2, marginBottom: 16, color: C.faint },
  signField: { marginBottom: 16 },
  signLabel: { fontFamily: FONT.medium, fontSize: 7, color: C.faint, letterSpacing: 1.1, marginBottom: 4 },
  signValue: { fontFamily: FONT.bold, fontSize: 9.8 },
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
/**
 * A numbered sub-clause, e.g. 4.2.
 *
 * An agreement is discussed by reference: "clause 4.2 needs to change". A sub-heading with no number
 * cannot be pointed at, so every h3 inside a clause becomes a numbered sub-clause rather than a bold
 * line of text.
 */
/*
 * Neither a clause nor a sub-clause sets wrap={false}.
 *
 * Both did, and it silently truncated agreements: a clause in a real instrument routinely runs longer
 * than the page it starts on, and a View that may not split simply loses whatever does not fit. That
 * is the worst failure available to a document somebody is going to sign. Small units that should
 * never be orphaned, a table row, a bullet, the execution block, still keep it.
 */
export function SubClause({ n, heading, children }: { n: string; heading?: string; children?: React.ReactNode }): React.ReactElement {
  return (
    <View style={a.subClause}>
      <Text style={a.subClauseNum}>{n}</Text>
      <View style={a.subClauseBody}>
        {heading ? <Text style={a.subClauseHeading}>{heading}</Text> : null}
        {children}
      </View>
    </View>
  );
}

export function Clause({ n, heading, children }: { n: string; heading?: string; children?: React.ReactNode }): React.ReactElement {
  return (
    <View style={a.clause}>
      {/* Never an empty string: textkit has no run to measure and throws on unitsPerEm. */}
      <Text style={a.clauseNum}>{n || " "}</Text>
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
      {/*
        The instrument is the pasted text, and nothing is generated on top of it.

        An MSA, an SLA or a Contract is drafted whole: it carries its own title, its own BETWEEN
        block and its own recitals. This template used to add a title page and a parties block of its
        own, so a real agreement stated its title twice and named the parties twice, once in the
        drafter's words and once in the platform's. What remains here is only what a sheet of paper
        needs: letterhead, page furniture, the text, and the execution block when it is asked for.
      */}
      <View style={a.body}>
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
