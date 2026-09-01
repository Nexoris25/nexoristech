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
import { C as BRAND } from "./brand.js";

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

const M = 72; // an inch, as the executed Master Software Development Agreement is set

/*
 * Set the way the executed agreement is set: Arial, 11 point, an inch of margin, everything flush.
 *
 * The reference here is the Master Software Development Agreement itself, not the branding kit. A
 * proposal is a Nexoris document and wears the house face; an agreement is an instrument the parties
 * print, mark up and file, and it is set in the face that instrument was drafted in. Measured off it:
 * Arial 11 on 14.6 leading, a 72 point margin, clause headings at 14 point bold, sub-clause numbers
 * run into the line in bold, and no indentation anywhere.
 *
 * Arimo rather than Arial itself. Arimo is Arial's metric-compatible twin — the same widths, so the
 * same words fall on the same lines — and it is Apache licensed, which means it can live in the
 * repository. Arial cannot: it is licensed software. The built-in Helvetica was the obvious answer
 * and is not usable at all here, because this renderer cannot resolve metrics for the standard PDF
 * fonts; every attempt ends in the same crash a missing font does.
 */
export const SANS = "Arimo";
export const SANS_BOLD = "ArimoBold";
export const SANS_ITALIC = "ArimoItalic";
export const a = StyleSheet.create({
  /**
   * The top and bottom padding must sit on the Page, not on the content wrapper. A wrapper's padding
   * applies once, to the first page; every page after it would start at y=0 and run underneath the
   * fixed letterhead. This reserves the band on each page the body flows onto.
   */
  /*
   * Leading is set once, on the Page, and nowhere else.
   *
   * A lineHeight on a Text is not the multiple of the font size it looks like: this renderer applies
   * it to the font's em box, which for Arimo is about 1.6em, so 1.33 came out as 23.9 points of
   * leading on 11 point text instead of 14.6. Measured both ways against the executed agreement, the
   * Page-level value is the one that matches it exactly.
   */
  page: { paddingTop: 84, paddingBottom: 66, fontFamily: SANS, fontSize: 11, lineHeight: 1.33, color: C.ink },

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
  headName: { fontFamily: SANS_BOLD, fontSize: 9, letterSpacing: 0.6 },
  headMeta: { fontFamily: SANS, fontSize: 7.5, color: C.faint, textAlign: "right" },

  foot: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: M, paddingBottom: 24, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: C.line,
    flexDirection: "row", justifyContent: "space-between",
  },
  footText: { fontFamily: SANS, fontSize: 8, color: C.faint },

  body: { paddingHorizontal: M },

  docType: { fontFamily: SANS_BOLD, fontSize: 7.5, letterSpacing: 2, color: C.faint, textAlign: "center" },
  title: { fontFamily: SANS_BOLD, fontSize: 15, textAlign: "center", marginTop: 8, lineHeight: 1.3 },
  titleRule: { height: 1, backgroundColor: C.rule, marginTop: 14, marginBottom: 18 },

  // Who is bound, stated before anything else.
  parties: { marginBottom: 18 },
  partiesLabel: { fontFamily: SANS_BOLD, fontSize: 7, letterSpacing: 1.4, color: C.faint, marginBottom: 8 },
  partyRow: { flexDirection: "row", marginBottom: 6 },
  partyTag: { fontFamily: SANS_BOLD, width: 58, fontSize: 8.5 },
  partyBody: { flex: 1, fontSize: 11 },
  dateLine: { fontSize: 11, marginTop: 9 },

  intro: { fontSize: 11, color: C.ink, marginBottom: 15 },

  /*
   * A clause is a block of text at the margin, nothing more.
   *
   * There is no number column and no indent. Both existed to hold numbering this template generated,
   * and generating numbering for an instrument that carries its own was the mistake underneath them.
   */
  clause: { marginBottom: 12 },
  clauseHeading: { fontFamily: SANS_BOLD, fontSize: 14, marginBottom: 8 },
  clauseText: { fontSize: 11, color: C.ink },

  // Signing page
  signIntro: { fontSize: 11, marginTop: 8, marginBottom: 22 },
  signRow: { flexDirection: "row", marginTop: 6 },
  signCol: { flex: 1 },
  /** A real gutter between the two blocks, rather than padding inside each that a long name eats. */
  signGutter: { width: 34 },
  /*
   * Two lines' worth, whether the name needs them or not.
   *
   * A client whose registered name wraps would otherwise push its own column half a line down and
   * leave the two sets of labels stepping past each other.
   */
  signParty: {
    fontFamily: SANS_BOLD, fontSize: 8, letterSpacing: 1.2, marginBottom: 16, color: C.faint,
    height: 24, lineHeight: 1.35,
  },
  signField: { marginBottom: 16 },
  signLabel: { fontFamily: SANS_BOLD, fontSize: 7.5, color: C.faint, letterSpacing: 1.1, marginBottom: 4 },
  signValue: { fontFamily: SANS_BOLD, fontSize: 11 },
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
export function AgreementSigning({
  data, company, client, stamp, signature,
}: {
  data: DocumentData; company: CompanyInfo; client: string;
  stamp?: Buffer; signature?: Buffer;
}): React.ReactElement {
  /*
   * The two blocks are built from the same parts, in the same order, at the same heights.
   *
   * They were not, and it showed: Nexoris's name and title were plain lines of text while the
   * client's were reserved slots, so the two columns kept different rhythms and the labels
   * interleaved down the page — one side's SIGNATURE level with the other's TITLE, which reads as two
   * blocks colliding. The party line is given the height of two lines for the same reason: a client
   * whose registered name wraps must not push its own column half a line below the other.
   */
  const ours: Record<string, string> = {
    NAME: data.signatory?.name ?? "",
    TITLE: data.signatory?.title ?? "",
    DATE: data.insertSignature ? data.date : "",
  };
  const fields = ["NAME", "TITLE", "SIGNATURE", "DATE"] as const;

  const Party = ({ heading, filled }: { heading: string; filled: boolean }): React.ReactElement => (
    <View style={a.signCol}>
      <Text style={a.signParty}>{heading}</Text>
      {fields.map((label) => (
        <View key={label} style={a.signField}>
          <Text style={a.signLabel}>{label}</Text>
          <View style={a.signSlot}>
            {filled && label === "SIGNATURE" && data.insertSignature && signature ? (
              <Image src={{ data: signature, format: "png" }} style={a.signImg} />
            ) : filled && ours[label] ? (
              <Text style={a.signValue}>{ours[label]}</Text>
            ) : null}
          </View>
          <View style={a.signRule} />
        </View>
      ))}
      {/* Applied by Nexoris Technologies, so it belongs in the Nexoris column rather than floating at
          the foot of the page between both signatories. */}
      {filled && data.insertStamp && stamp ? (
        <View style={a.stampWrap}>
          <Image src={{ data: stamp, format: "png" }} style={a.stampImg} />
        </View>
      ) : null}
    </View>
  );

  return (
    <View wrap={false}>
      <Text style={a.signIntro}>
        The parties have executed this {data.kind.toLowerCase()} as of the date first written above, each signatory
        warranting that they are duly authorised to do so.
      </Text>
      <View style={a.signRow}>
        <Party heading={`FOR ${company.legalName.toUpperCase()}`} filled />
        <View style={a.signGutter} />
        {/* Never pre-completed on the client's behalf. */}
        <Party heading={`FOR ${(client || "THE CLIENT").toUpperCase()}`} filled={false} />
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
