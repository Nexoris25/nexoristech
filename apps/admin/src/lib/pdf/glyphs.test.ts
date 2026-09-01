/**
 * The glyph filter.
 *
 * Tested against the real embedded fonts rather than a stub, because the thing that went wrong was
 * the font layer itself: a default import that resolved to undefined made the coverage set empty,
 * which disabled the filter while the folding rules carried on working. A stubbed font would have
 * passed that state happily. The last test here is the one that would have caught it.
 */
import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { resetGlyphCoverage, sanitiseForFonts, toRenderableText } from "./glyphs.js";

const FONTS = [
  "poppins-300.ttf", "poppins-400.ttf", "poppins-500.ttf", "poppins-700.ttf",
  "jakarta-400.ttf", "jakarta-700.ttf", "lora-400.ttf", "lora-700.ttf", "lora-italic.ttf",
]
  .map((f) => join(process.cwd(), "public", f));

const clean = (text: string): string => toRenderableText(text, FONTS);

describe("a character the fonts can draw is left exactly as written", () => {
  /*
   * The fold is a fallback for a missing glyph, not a house style. It used to run unconditionally,
   * which rewrote text the typeface was perfectly capable of setting: every bullet a writer pasted
   * became a hyphen, and every curly quote and en dash became its typewriter equivalent.
   */
  it("keeps the bullet, the curly quotes and the em dash", () => {
    expect(clean("• Discovery")).toBe("• Discovery");
    expect(clean("“Phase 1” — the client’s scope")).toBe("“Phase 1” — the client’s scope");
  });
});

describe("characters with a plain equivalent are folded, not dropped", () => {
  it("keeps a bulleted list readable", () => {
    // The square and the triangle are in none of the embedded fonts, so each falls back to a mark
    // that is, rather than disappearing and leaving the item unmarked.
    expect(clean("▪ Design ‣ Build")).toBe("- Design - Build");
  });

  it("turns arrows into something a reader understands", () => {
    expect(clean("Design → Build ← Review")).toBe("Design -> Build <- Review");
  });

  it("spells out ticks and crosses", () => {
    expect(clean("Certified ✓ Rejected ✗")).toBe("Certified Yes Rejected No");
  });
});

describe("characters that would crash the renderer are removed", () => {
  it("drops emoji", () => {
    // react-pdf throws "Cannot read properties of null (reading 'codePoints')" on these.
    expect(clean("Ship it 🚀 today 💰")).toBe("Ship it  today ");
  });

  it("drops scripts the brand fonts do not carry", () => {
    expect(clean("Delivery 交付 and Ж")).toBe("Delivery  and ");
  });

  it("removes invisible characters pasted from a word processor", () => {
    expect(clean("Nexoris​Technologies﻿ Ltd")).toBe("NexorisTechnologies Ltd");
    expect(clean("a b")).toBe("a b");
  });
});

describe("ordinary text is left alone", () => {
  it("keeps plain prose exactly as written", () => {
    const text = "Nexoris Technologies Ltd builds custom software for businesses in Nigeria.";
    expect(clean(text)).toBe(text);
  });

  it("keeps the newlines the renderers rely on", () => {
    // TextLines splits on these; stripping them here would undo the fix for the other crash.
    expect(clean("Line one\nLine two")).toBe("Line one\nLine two");
  });

  it("keeps the naira sign, which the documents are full of", () => {
    expect(clean("Investment: ₦12,500,000")).toContain("12,500,000");
  });
});

describe("sanitiseForFonts walks a whole document", () => {
  it("cleans nested strings and leaves image payloads untouched", () => {
    const doc = {
      kind: "Proposal",
      title: "Ship it 🚀",
      meta: [{ label: "Phase", value: "• one" }],
      richContent: [{ type: "paragraph", runs: [{ text: "Design → Build" }] }],
      signatureImage: "data:image/png;base64,AAAA🚀",
    };
    const out = sanitiseForFonts(doc, FONTS);
    expect(out.title).toBe("Ship it ");
    expect(out.meta[0]!.value).toBe("• one");
    expect(out.richContent[0]!.runs[0]!.text).toBe("Design -> Build");
    // Not a candidate for folding, and rewriting base64 would be a good way to corrupt it.
    expect(out.signatureImage).toBe("data:image/png;base64,AAAA🚀");
  });
});

describe("the fonts are actually readable", () => {
  it("finds real coverage, so the filter is not silently disabled", () => {
    /*
     * The regression that matters. When the fontkit import resolved to undefined the coverage set was
     * empty, toRenderableText returned early, and every unsupported character sailed through while
     * the folding tests above still passed. If this ever fails, the filter is off.
     */
    resetGlyphCoverage();
    expect(clean("🚀")).toBe("");
    expect(clean("A")).toBe("A");
  });
});
