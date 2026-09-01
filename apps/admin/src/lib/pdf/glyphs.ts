/**
 * Keep text inside what the embedded fonts can actually draw.
 *
 * react-pdf does not degrade when a character has no glyph. Deep inside textkit, appendGlyph reads
 * `.codePoints` off a null lookup and the whole render throws "Cannot read properties of null
 * (reading 'codePoints')". One character pasted from Word takes down a twenty-page proposal, and the
 * salesperson is told the document could not be produced with no indication which character did it.
 *
 * Two steps, in order, because the order is what makes the output readable rather than merely safe.
 *
 * First, ask the fonts. Coverage is read from the TTFs with fontkit, the same library react-pdf uses,
 * so this is the real answer for these files rather than a guess about which ranges a font "probably"
 * has.
 *
 * Second, fold the characters the fonts cannot draw but which have an obvious plain equivalent: a
 * hollow bullet becomes a hyphen, an arrow becomes "->". That is what those characters meant, and
 * dropping them would silently delete the structure of a list. The fold applies only where the glyph
 * is genuinely missing — it used to run unconditionally, which rewrote perfectly setable text and
 * turned every bullet a writer pasted into a hyphen.
 *
 * Anything still unsupported is dropped, because a missing glyph and a crash are not a trade: one of
 * them keeps the document.
 *
 * Non-obvious characters are written as escapes rather than pasted in literally. This file is about
 * invisible and unusual characters, and a source file full of them is unreadable, unreviewable, and
 * reads as binary to half the tools that touch it.
 */
import { readFileSync } from "node:fs";
/*
 * Namespace import with a default fallback. fontkit 2.x is ESM, and a plain default import resolves
 * to undefined under this bundler: `fontkit.create` then threw, the catch below swallowed it, the
 * coverage set came back empty, and the filter skipped every character. The folding rules still ran,
 * so bullets and smart quotes looked fixed while emoji and CJK carried on crashing the renderer. The
 * empty case is now reported rather than passed over silently.
 */
import * as fontkitNamespace from "fontkit";

interface FontkitApi {
  create(buffer: Buffer): { characterSet?: number[] };
}
/*
 * Resolved through an index rather than a named `.default`.
 *
 * fontkit 2.x genuinely has no default export, and webpack says so at build time when it sees the
 * property named statically. The fallback is still wanted, because bundlers and the dev runtime do
 * not agree about interop, so the lookup is done on an indexable type: the same runtime behaviour
 * without a warning about a property that is allowed to be absent.
 */
const fontkitModule = fontkitNamespace as unknown as Record<string, unknown>;
const fontkit = (fontkitModule["default"] ?? fontkitModule) as FontkitApi;

/** Characters with a plain equivalent worth keeping rather than dropping. */
const FOLD: [RegExp, string][] = [
  // Curly single and double quotes.
  [/[‘’‚‛]/g, "'"],
  [/[“”„‟]/g, '"'],
  // En dash, em dash, horizontal bar, and the narrower hyphens.
  [/[–—―‐‑‒]/g, "-"],
  // Bullets of every shape a word processor produces.
  [/[•‣▪●◦⁃·]/g, "-"],
  [/[→➡⇒]/g, "->"],
  [/[←⇐]/g, "<-"],
  [/[✓✔]/g, "Yes"],
  [/[✗✘✕]/g, "No"],
  [/…/g, "..."],
  [/⁄/g, "/"],
  [/[«»]/g, '"'],
  [/™/g, "(TM)"],
  [/®/g, "(R)"],
];

/**
 * Invisible characters that carry no meaning in a PDF and frequently have no glyph.
 *
 * Zero-width space through to the right-to-left mark, the directional overrides, the word joiner and
 * invisible operators, the byte-order mark, and the soft hyphen. All of these arrive constantly in
 * text pasted from Word and Google Docs.
 */
const INVISIBLE = new RegExp("[\u200b-\u200f\u202a-\u202e\u2060-\u2064\ufeff\u00ad]", "g");

/**
 * Control characters. The newline and carriage return are deliberately not in this set.
 *
 * The rule below exists to catch control characters written into a regex by accident. Here they are
 * the entire point: these are exactly what has to be removed before layout.
 */
// eslint-disable-next-line no-control-regex
const CONTROL = new RegExp("[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]", "g");

/**
 * Spaces that are not the ordinary space.
 *
 * Folded whatever the fonts can draw, because this is whitespace normalisation rather than a glyph
 * fallback: text pasted from Word is full of non-breaking spaces, and a place the renderer is not
 * allowed to break at is how a line ends up running past the margin.
 */
const HARD_SPACES = new RegExp("[\u00a0\u2007\u202f]", "g");

let coverage: Set<number> | null = null;

/**
 * The set of code points at least one embedded font can draw.
 *
 * Built once and cached. A font that fails to open is reported and skipped rather than throwing: the
 * filter degrades to the folding rules above, which is better than refusing to render at all.
 */
function supportedCodePoints(fontFiles: string[]): Set<number> {
  if (coverage) return coverage;
  const set = new Set<number>();
  for (const file of fontFiles) {
    try {
      const font = fontkit.create(readFileSync(file));
      for (const cp of font.characterSet ?? []) set.add(cp);
    } catch (e) {
      console.warn(
        `[pdf] could not read glyph coverage from ${file}: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }
  if (set.size === 0) {
    // Worth saying out loud. An empty set disables the filter entirely, which is how a broken import
    // here looked like a working guard for one round of testing.
    console.warn("[pdf] no glyph coverage could be read; unsupported characters will not be filtered");
  }
  coverage = set;
  return set;
}

/** Reset the cached coverage. For the test that proves the coverage is real. */
export function resetGlyphCoverage(): void {
  coverage = null;
}

/**
 * Make text safe for the embedded fonts.
 *
 * Newlines are preserved: the renderers split on them deliberately, and removing them here would
 * undo the fix for the other way this crashed. Everything else outside the fonts' coverage is folded
 * or dropped.
 */
export function toRenderableText(text: string, fontFiles: string[]): string {
  let out = text.normalize("NFC").replace(INVISIBLE, "").replace(CONTROL, "").replace(HARD_SPACES, " ");
  const supported = supportedCodePoints(fontFiles);

  /*
   * Fold only what the fonts cannot draw.
   *
   * This used to fold unconditionally, which quietly rewrote text the fonts were perfectly capable of
   * setting: every bullet a writer pasted became a hyphen, and every curly quote and en dash became
   * its typewriter equivalent, in a document whose typeface has all of them. The fold is a fallback
   * for a missing glyph, not a house style, so a character the fonts have is left exactly as written.
   */
  if (supported.size === 0) {
    for (const [pattern, replacement] of FOLD) out = out.replace(pattern, replacement);
    return out;
  }
  for (const [pattern, replacement] of FOLD) {
    out = out.replace(pattern, (match) => {
      const cp = match.codePointAt(0);
      return cp !== undefined && supported.has(cp) ? match : replacement;
    });
  }

  let result = "";
  for (const ch of out) {
    const cp = ch.codePointAt(0);
    if (cp === undefined) continue;
    // Newline and carriage return survive: the renderers handle them and need no glyph.
    if (cp === 0x0a || cp === 0x0d || supported.has(cp)) result += ch;
  }
  return result;
}

/**
 * Apply the filter to every string in a document, however deeply nested.
 *
 * Done to the whole payload rather than at each render site because there are many render sites and
 * only one payload, and a character that crashes the renderer must not be able to reach any of them.
 */
export function sanitiseForFonts<T>(value: T, fontFiles: string[]): T {
  if (typeof value === "string") return toRenderableText(value, fontFiles) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => sanitiseForFonts(v, fontFiles)) as unknown as T;
  if (value && typeof value === "object" && !Buffer.isBuffer(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      // Image payloads are long base64 strings — the signing assets, and the `src` of a diagram
      // pasted into the body. Filtering them would be pointless work on every render, and could
      // corrupt them if the fold table ever grew a rule that touched base64.
      out[k] = k.endsWith("Image") || k === "src" ? v : sanitiseForFonts(v, fontFiles);
    }
    return out as unknown as T;
  }
  return value;
}
