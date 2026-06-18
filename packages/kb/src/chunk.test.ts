import { describe, expect, it } from "vitest";
import {
  chunkBlocks,
  chunkText,
  estimateTokens,
  splitBlocks,
} from "./chunk.js";
import { buildKnowledgeBase } from "./build.js";

/** A block of roughly `tokens` tokens (about 0.75 words per token). */
function blockOf(tokens: number, label: string): string {
  const words = Math.round(tokens * 0.75);
  return `${label} ${Array.from({ length: words - 1 }, () => "word").join(" ")}`;
}

describe("estimateTokens", () => {
  it("grows with word count", () => {
    expect(estimateTokens("one two three")).toBeGreaterThan(0);
    expect(estimateTokens("a b c d e f g h")).toBeGreaterThan(
      estimateTokens("a b c"),
    );
  });

  it("treats empty text as zero-ish", () => {
    expect(estimateTokens("   ")).toBe(0);
  });
});

describe("splitBlocks", () => {
  it("splits on blank lines and trims", () => {
    expect(
      splitBlocks("First block.\n\n  Second block.  \n\n\nThird."),
    ).toEqual(["First block.", "Second block.", "Third."]);
  });
});

describe("chunkBlocks", () => {
  it("keeps small content in a single chunk", () => {
    const chunks = chunkBlocks(["A short paragraph.", "Another short one."], {
      maxTokens: 800,
    });
    expect(chunks).toHaveLength(1);
  });

  it("splits when the budget is exceeded", () => {
    const blocks = [blockOf(300, "P1"), blockOf(300, "P2"), blockOf(300, "P3")];
    const chunks = chunkBlocks(blocks, { maxTokens: 700, overlapTokens: 0 });
    expect(chunks.length).toBeGreaterThan(1);
  });

  it("never splits a single oversized block", () => {
    const huge = blockOf(1200, "HUGE");
    const chunks = chunkBlocks([huge], { maxTokens: 800 });
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe(huge);
  });

  it("overlaps neighbouring chunks with trailing blocks", () => {
    const blocks = [
      blockOf(400, "ONE"),
      blockOf(400, "TWO"),
      blockOf(400, "THREE"),
    ];
    const chunks = chunkBlocks(blocks, { maxTokens: 500, overlapTokens: 450 });
    // The second chunk should begin with content carried over from the first.
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[1]?.startsWith("TWO") || chunks[1]?.startsWith("ONE")).toBe(
      true,
    );
  });
});

describe("chunkText and buildKnowledgeBase", () => {
  it("keeps an FAQ pair block intact", () => {
    const text =
      "Intro paragraph.\n\nHow much does it cost? Every project gets a written scope.";
    const chunks = chunkText(text, { maxTokens: 800 });
    expect(chunks.join("\n")).toContain(
      "How much does it cost? Every project gets a written scope.",
    );
  });

  it("emits chunks carrying the source url and title with stable ids", () => {
    // Four 500-token blocks at a 600-token budget force more than one chunk.
    const text = [
      blockOf(500, "A1"),
      blockOf(500, "A2"),
      blockOf(500, "A3"),
      blockOf(500, "A4"),
    ].join("\n\n");
    const kb = buildKnowledgeBase(
      [{ url: "https://nexoristech.com/about/", title: "About", text }],
      { maxTokens: 600, overlapTokens: 50 },
    );
    expect(kb.length).toBeGreaterThan(1);
    expect(kb[0]?.id).toBe("https://nexoristech.com/about/#0");
    expect(
      kb.every(
        (c) =>
          c.url === "https://nexoristech.com/about/" && c.title === "About",
      ),
    ).toBe(true);
  });
});
