/**
 * Render a document to a PDF buffer (PRD Part Three, 5). Runs server-side in the Node runtime. The
 * white logo is read once from the app's public folder and embedded.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToBuffer, Font } from "@react-pdf/renderer";
import { NexorisDocument } from "./document.js";
import { sanitiseForFonts } from "./glyphs.js";
import type { DocumentData } from "./types.js";

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

/** The TTFs actually embedded, which is what decides whether a character can be drawn. */
function embeddedFontFiles(): string[] {
  const dir = join(process.cwd(), "public");
  return ["jakarta-400.ttf", "jakarta-700.ttf", "lora-400.ttf", "lora-700.ttf", "lora-italic.ttf"]
    .map((f) => join(dir, f));
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
  const data = sanitiseForFonts(input, embeddedFontFiles());
  // The full-resolution marks: white for the purple cover band, purple for the plain letterheads.
  const logo = asset("logo-mark-white.png");
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
      />,
    );
  } catch (error) {
    console.error("PDF_RENDER_FAIL", data.kind, error instanceof Error ? error.stack : error);
    throw error;
  }
}
