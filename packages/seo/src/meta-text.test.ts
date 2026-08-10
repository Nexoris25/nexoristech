/**
 * Meta text fitting.
 *
 * The generator used to end a description with `.slice(0, 160)`, so a snippet could stop mid-word.
 * These pin the two properties that matters: nothing is ever cut, and the title comes from the page
 * title rather than being invented alongside it.
 */
import { describe, it, expect } from "vitest";
import { fitMetaDescription, deriveMetaTitle, splitSentences } from "./meta-text.js";
import { META_LIMITS } from "./constants.js";

const { descriptionMin: MIN, descriptionMax: MAX, titleMax: TITLE_MAX } = META_LIMITS;

describe("splitSentences", () => {
  it("splits on sentence ends", () => {
    expect(splitSentences("One thing. Two things! Three?")).toEqual(["One thing.", "Two things!", "Three?"]);
  });

  it("does not split inside an abbreviation or an address", () => {
    // "No. 5" is the company's own address, and it broke a naive split.
    expect(splitSentences("We are at No. 5 Mojisola Dokpesi Street. Come and see us.")).toEqual([
      "We are at No. 5 Mojisola Dokpesi Street.",
      "Come and see us.",
    ]);
  });

  it("keeps a final sentence with no terminator", () => {
    expect(splitSentences("First one. Second with no stop")).toEqual(["First one.", "Second with no stop"]);
  });

  it("returns nothing for empty input", () => {
    expect(splitSentences("   ")).toEqual([]);
  });
});

describe("fitMetaDescription", () => {
  it("never exceeds the maximum", () => {
    const long = "We build custom software for Nigerian businesses that removes manual work. " +
      "Our team designs, builds and supports the system end to end. " +
      "Tell us the problem and we will scope it honestly and quickly for you today.";
    const fitted = fitMetaDescription(long);
    expect(fitted.length).toBeLessThanOrEqual(MAX);
  });

  it("ends on a sentence boundary rather than mid-word", () => {
    const long = "Nexoris Technologies designs and builds websites, apps and dashboards for companies " +
      "across Nigeria. We start from the bottleneck rather than the technology. " +
      "Every build ships in reviewable stages.";
    const fitted = fitMetaDescription(long);
    expect(fitted.text).toMatch(/[.!?]$/);
    // The exact failure the old slice produced: a word cut in half.
    expect(fitted.text.endsWith("techn")).toBe(false);
    expect(long.startsWith(fitted.text)).toBe(true);
  });

  it("reports when it lands inside the target window", () => {
    const good = "We design and build websites, apps and custom business software for companies across " +
      "Nigeria and abroad. Tell us the problem, and we will solve it properly.";
    const fitted = fitMetaDescription(good);
    expect(fitted.length).toBeGreaterThanOrEqual(MIN);
    expect(fitted.length).toBeLessThanOrEqual(MAX);
    expect(fitted.inRange).toBe(true);
  });

  it("reports out of range rather than padding when the copy is short", () => {
    const fitted = fitMetaDescription("Too short to fill the window.");
    expect(fitted.complete).toBe(true);
    expect(fitted.inRange).toBe(false);
    expect(fitted.text).toBe("Too short to fill the window.");
  });

  it("gives back nothing when not even one sentence fits", () => {
    // Better an empty field the editor can see than a severed one they cannot.
    const fitted = fitMetaDescription(`${"word ".repeat(60)}end.`);
    expect(fitted.complete).toBe(false);
    expect(fitted.text).toBe("");
  });

  it("strips quotes a model wraps its answer in", () => {
    expect(fitMetaDescription('"A complete sentence here."').text).toBe("A complete sentence here.");
  });
});

describe("deriveMetaTitle", () => {
  it("uses the page title unchanged when it fits", () => {
    expect(deriveMetaTitle("How Nigerian businesses use automation")).toBe("How Nigerian businesses use automation");
  });

  it("never exceeds the limit and never cuts a word", () => {
    const long = "How Nigerian manufacturing businesses use automation to remove repetitive back office work";
    const out = deriveMetaTitle(long);
    expect(out.length).toBeLessThanOrEqual(TITLE_MAX);
    expect(long.startsWith(out)).toBe(true);
    expect(long[out.length] === undefined || long[out.length] === " ").toBe(true);
  });

  it("does not end on a dangling connector or punctuation", () => {
    const out = deriveMetaTitle("Dashboards, analytics and predictive reporting for logistics teams and operators");
    expect(out).not.toMatch(/[,;:\-–—]$/);
    expect(out).not.toMatch(/\s(and|or|for|the|a|an|to|of|in|with|on)$/i);
  });

  it("collapses whitespace from a pasted title", () => {
    expect(deriveMetaTitle("  Custom   software   in Lagos  ")).toBe("Custom software in Lagos");
  });
});
