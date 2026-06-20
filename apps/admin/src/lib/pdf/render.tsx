/**
 * Render a document to a PDF buffer (PRD Part Three, 5). Runs server-side in the Node runtime. The
 * white logo is read once from the app's public folder and embedded.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToBuffer, Font } from "@react-pdf/renderer";
import { NexorisDocument } from "./document.js";
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
}

let logoCache: Buffer | undefined;
let logoLoaded = false;

function logo(): Buffer | undefined {
  if (logoLoaded) return logoCache;
  logoLoaded = true;
  try {
    logoCache = readFileSync(
      join(process.cwd(), "public", "nexoris-logo-white.png"),
    );
  } catch {
    logoCache = undefined;
  }
  return logoCache;
}

export async function renderDocument(data: DocumentData): Promise<Buffer> {
  registerFonts();
  const buffer = logo();
  return renderToBuffer(
    buffer ? (
      <NexorisDocument data={data} logo={buffer} />
    ) : (
      <NexorisDocument data={data} />
    ),
  );
}
