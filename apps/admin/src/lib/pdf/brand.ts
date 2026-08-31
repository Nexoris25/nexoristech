/**
 * The Nexoris document brand system, ported from the branding kit.
 *
 * The kit ships as a Python/ReportLab module. This platform renders with react-pdf in TypeScript, so
 * what is ported is the design, not the code: the palette, the page metrics, the type scale and the
 * rules about how a section header, a table and a callout are built. Every value below is the kit's
 * value, kept exact so a document produced here and one produced by the kit's own script are the same
 * document.
 *
 * Units. ReportLab works in millimetres; react-pdf works in PDF points. A4 is 210mm by 297mm and
 * 595.28 by 841.89 points, so one millimetre is 2.8346 points. The kit's numbers are preserved as
 * millimetres and converted once, here, rather than being re-measured by eye into points, which is how
 * a port stops matching its source.
 *
 * Font sizes are the exception: the kit already states them in points, so they are used as they are.
 */

/** Millimetres to PDF points, so the kit's measurements survive the port intact. */
export const mm = (value: number): number => value * 2.8346;

/** The exact palette from the kit. Names kept so the two are searchable against each other. */
export const C = {
  purple: "#543cda",
  purpleDark: "#3b2ab0",
  purpleFade: "#d3ccf6",
  navy: "#0b0e1e",
  ink: "#1d2030",
  inkSoft: "#4a4f63",
  rule: "#e6e3f5",
  rowTint: "#f5f3ff",
  headTint: "#f0edff",
  white: "#ffffff",
  /* Cover-only tints. The kit uses these as literals inside the cover drawer rather than naming
     them, so they are named here to keep the cover component readable. */
  coverSpineRule: "#6450e0",
  coverLabel: "#a9a3d6",
  coverSubtitle: "#c9c5e8",
  coverMeta: "#9d97cc",
  coverPreparedBy: "#bcb8dd",
  coverDivider: "#2a2e44",
} as const;

/** Page metrics. A4 with the kit's margins. */
export const PAGE = {
  width: mm(210),
  height: mm(297),
  left: mm(20),
  right: mm(18),
  top: mm(26),
  bottom: mm(22),
} as const;

/** Usable content width, the kit's CW. */
export const CONTENT_WIDTH = PAGE.width - PAGE.left - PAGE.right;

/** The registered family names. Poppins is the kit's typeface throughout. */
export const FONT = {
  regular: "Poppins",
  medium: "PoppinsMedium",
  bold: "PoppinsBold",
  light: "PoppinsLight",
} as const;

/**
 * The kit's named paragraph styles, as plain objects for react-pdf StyleSheet.
 *
 * Sizes and leading are the kit's, in points. `spaceAfter` becomes marginBottom.
 */
export const TYPE = {
  body: { fontFamily: FONT.regular, fontSize: 9.6, lineHeight: 15.2 / 9.6, color: C.ink, marginBottom: 8 },
  lead: { fontFamily: FONT.regular, fontSize: 9.8, lineHeight: 15.5 / 9.8, color: C.ink, marginBottom: 9 },
  h2: { fontFamily: FONT.bold, fontSize: 11.5, lineHeight: 15 / 11.5, color: C.purple, marginTop: 9, marginBottom: 4 },
  h3: { fontFamily: FONT.bold, fontSize: 10, lineHeight: 13.5 / 10, color: C.ink, marginTop: 6, marginBottom: 3 },
  bullet: { fontFamily: FONT.regular, fontSize: 9.3, lineHeight: 14.2 / 9.3, color: C.ink, marginBottom: 4 },
  bullet2: { fontFamily: FONT.regular, fontSize: 9.1, lineHeight: 13.6 / 9.1, color: C.ink, marginBottom: 4 },
  cell: { fontFamily: FONT.regular, fontSize: 8.7, lineHeight: 12.2 / 8.7, color: C.ink },
  cellSmall: { fontFamily: FONT.regular, fontSize: 8.2, lineHeight: 11.4 / 8.2, color: C.ink },
  cellLabel: { fontFamily: FONT.medium, fontSize: 8.7, lineHeight: 12.2 / 8.7, color: C.ink },
  cellHead: { fontFamily: FONT.bold, fontSize: 8.6, lineHeight: 11.5 / 8.6, color: C.white },
  note: { fontFamily: FONT.regular, fontSize: 8.6, lineHeight: 13 / 8.6, color: C.inkSoft },
} as const;

/** Indents for the two bullet levels, from the kit's leftIndent values. */
export const BULLET_INDENT = { level1: 13, level2: 23 } as const;

/**
 * A two-digit section number, as the kit writes them.
 *
 * The kit's documents number sections 01, 02, 03, which is what the large faded number in the corner
 * of each section header shows. Past ninety-nine it simply stops padding rather than truncating.
 */
export function sectionNumber(index: number): string {
  return index < 10 ? `0${index}` : String(index);
}

/**
 * Separate a heading's own number from its words.
 *
 * A drafter who writes "7. Confidentiality", "Section 7 — Confidentiality" or "07 Confidentiality"
 * has numbered their document, and that numbering is the one the parties will cite. Renumbering it
 * from the top produces two numbers on the same heading and, worse, a citation in the body that
 * points at the wrong clause. So the heading's own number wins wherever there is one, and the
 * sequence is only a fallback for text that carries none.
 *
 * Multi-level numbers are kept whole ("4.2.1"), and a trailing dot is dropped: the templates supply
 * their own punctuation.
 */
export function splitLeadingNumber(heading: string): { number?: string; title: string } {
  const match = /^\s*(?:section\s+|clause\s+|article\s+)?(\d+(?:\.\d+)*)\s*[.)\]:–—-]?\s+(\S.*)$/i.exec(heading);
  if (!match) return { title: heading.trim() };
  return { number: match[1]!.replace(/\.$/, ""), title: match[2]!.trim() };
}
