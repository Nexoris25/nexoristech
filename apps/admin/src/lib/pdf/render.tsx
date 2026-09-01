/**
 * Render a document to a PDF buffer (PRD Part Three, 5). Runs server-side in the Node runtime. The
 * white logo is read once from the app's public folder and embedded.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToBuffer, Font } from "@react-pdf/renderer";
import { NexorisDocument } from "./document.js";
import { sanitiseForFonts } from "./glyphs.js";
import { AGREEMENT_KINDS, type DocumentData } from "./types.js";

// Register a real TTF so font metrics resolve in the server runtime (the bundled standard fonts
// do not). Plus Jakarta Sans is the brand display font (PRD 14.1).
let fontsRegistered = false;
function registerFonts(): void {
  if (fontsRegistered) return;
  fontsRegistered = true;
  const dir = join(process.cwd(), "public");
  Font.register({
    family: "Jakarta",
    fonts: [
      { src: join(dir, "jakarta-400.ttf") },
      { src: join(dir, "jakarta-700.ttf"), fontWeight: 700 },
    ],
  });
  /*
   * Poppins, from the branding kit. It is the typeface every Nexoris document in the kit is set in,
   * so the proposal and scope of work use it and match documents produced by the kit's own script.
   * Registered under separate family names per weight rather than one family with weights, because
   * the layouts select them explicitly and a missed weight should be visible rather than silently
   * synthesised.
   */
  Font.register({ family: "Poppins", fonts: [{ src: join(dir, "poppins-400.ttf") }] });
  Font.register({ family: "PoppinsMedium", fonts: [{ src: join(dir, "poppins-500.ttf") }] });
  Font.register({ family: "PoppinsBold", fonts: [{ src: join(dir, "poppins-700.ttf") }] });
  Font.register({ family: "PoppinsLight", fonts: [{ src: join(dir, "poppins-300.ttf") }] });

  /*
   * Arimo, for the agreements.
   *
   * The executed Master Software Development Agreement is set in Arial, and Arimo is Arial's
   * metric-compatible twin — same widths, same line breaks, and licensed under Apache 2.0 so it can
   * live in the repository, which Arial cannot. The built-in Helvetica would have been closer still
   * on paper and is not usable: this renderer cannot resolve metrics for the standard fonts at all,
   * which is the reason the note at the top of this file exists.
   *
   * Registered per weight, like the others, because a family with weights resolves to the regular cut
   * and bold quietly stops being bold.
   */
  Font.register({ family: "Arimo", fonts: [{ src: join(dir, "arimo-400.ttf") }] });
  Font.register({ family: "ArimoBold", fonts: [{ src: join(dir, "arimo-700.ttf") }] });
  Font.register({ family: "ArimoItalic", fonts: [{ src: join(dir, "arimo-italic.ttf") }] });

  /*
   * No hyphenation.
   *
   * react-pdf's default callback breaks a word that will not fit and does not draw a hyphen, so a
   * client's name in a signing block came out as "WHOL" on one line and "LY OWNED SUBSIDIARIES" on
   * the next, which reads as a typo in a document somebody is about to sign. Words now stay whole and
   * wrap to the next line like every other typesetting system does.
   */
  Font.registerHyphenationCallback((word) => [word]);

  // Lora, for the legal documents. A serif is the convention for contracts and agreements: it is what
  // the reader expects on an instrument they will print, mark up and file, and the bracketed serifs
  // help the eye hold a line across a long clause. Instantiated as static 400/700 cuts from the
  // variable original, because react-pdf cannot select a weight off a variable axis.
  Font.register({
    family: "Lora",
    fonts: [
      { src: join(dir, "lora-400.ttf") },
      { src: join(dir, "lora-700.ttf"), fontWeight: 700 },
      { src: join(dir, "lora-italic.ttf"), fontStyle: "italic" },
    ],
  });
}

// The brand assets are read once and embedded: the white logo for the purple header band, the
// purple mark for the light stamp seal, and the real official stamp PNG if the business has added
// one to the public folder (public/official-stamp.png). Each is optional and cached, including a
// cached miss so a missing file is not re-read on every render.
const assetCache = new Map<string, Buffer | undefined>();

function asset(file: string): Buffer | undefined {
  if (assetCache.has(file)) return assetCache.get(file);
  let buffer: Buffer | undefined;
  try {
    buffer = readFileSync(join(process.cwd(), "public", file));
  } catch {
    buffer = undefined;
  }
  assetCache.set(file, buffer);
  return buffer;
}

/** Decode a base64 data URL into a Buffer, ignoring anything that is not one. */
function dataUrlToBuffer(value: string | undefined): Buffer | undefined {
  if (!value) return undefined;
  const comma = value.indexOf(",");
  if (!value.startsWith("data:image/") || comma < 0) return undefined;
  try {
    return Buffer.from(value.slice(comma + 1), "base64");
  } catch {
    return undefined;
  }
}

/**
 * The TTFs a document of this kind is set in, which is what decides whether a character can be drawn.
 *
 * Split by kind rather than pooled. An agreement is set in Arimo and nothing else, so measuring it
 * against the union of every font the engine has would pass a character Arimo cannot draw — and an
 * unresolved run does not degrade, it ends the render.
 */
function fontFilesFor(kind: DocumentData["kind"]): string[] {
  const dir = join(process.cwd(), "public");
  const legal = AGREEMENT_KINDS.includes(kind) && kind !== "Scope of Work";
  const files = legal
    ? ["arimo-400.ttf", "arimo-700.ttf", "arimo-italic.ttf"]
    : [
        "poppins-300.ttf", "poppins-400.ttf", "poppins-500.ttf", "poppins-700.ttf", "poppins-italic.ttf",
        "jakarta-400.ttf", "jakarta-700.ttf", "lora-400.ttf", "lora-700.ttf", "lora-italic.ttf",
      ];
  return files.map((f) => join(dir, f));
}

export async function renderDocument(input: DocumentData): Promise<Buffer> {
  registerFonts();
  /*
   * Fold the text to what the embedded fonts can draw, before anything tries to lay it out.
   *
   * react-pdf does not skip a character it has no glyph for; it throws from inside textkit and the
   * whole document is lost. A real proposal failed exactly this way, on one character somewhere in
   * twenty pages of pasted copy. Cleaning the payload once here covers every render path at the only
   * point that all of them share.
   */
  // Filtered against the fonts this kind is actually set in: Arimo for the agreements, the brand
  // faces for everything else. The union of both would pass a character one of them cannot draw.
  const data = sanitiseForFonts(input, fontFilesFor(input.kind));
  // The full-resolution marks: white for the purple cover band, purple for the plain letterheads.
  const logo = asset("logo-mark-white.png");
  const brandLogoWhite = asset("brand-logo-white.png");
  const brandLogoPurple = asset("brand-logo-purple.png");
  const mark = asset("logo-mark-purple.png");
  // Uploaded images win. There is no fallback to a file on disk for either: a stamp pinned in the
  // repo would carry a stale date onto every document, which is the whole reason these are uploads.
  const stamp = dataUrlToBuffer(data.stampImage);
  const signature = dataUrlToBuffer(data.signatureImage);
  try {
    return await renderToBuffer(
      <NexorisDocument
        data={data}
        {...(logo ? { logo } : {})}
        {...(mark ? { mark } : {})}
        {...(stamp ? { stamp } : {})}
        {...(signature ? { signature } : {})}
        {...(brandLogoWhite ? { brandLogoWhite } : {})}
        {...(brandLogoPurple ? { brandLogoPurple } : {})}
      />,
    );
  } catch (error) {
    console.error("PDF_RENDER_FAIL", data.kind, error instanceof Error ? error.stack : error);
    throw error;
  }
}
