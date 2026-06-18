import { describe, expect, it } from "vitest";
import { buildKnowledgeBase } from "@nexoris/kb";
import { hardcodedKbSources, pageToKbSource } from "./kb-source.js";
import { home } from "./core/home.js";
import { howWeWork } from "./core/how-we-work.js";

describe("pageToKbSource", () => {
  it("uses the canonical URL and includes the H1 and subline", () => {
    const source = pageToKbSource(home);
    expect(source.url).toBe("https://nexoristech.com");
    expect(source.text).toContain(
      "Software built around the way your business really works.",
    );
    expect(source.text).toContain(
      "Nexoris Technologies designs and builds websites",
    );
  });

  it("keeps an FAQ question and answer together in one block", () => {
    const source = pageToKbSource(howWeWork);
    const block = source.text
      .split(/\n\s*\n/)
      .find((b) => b.startsWith("How long does a typical project take?"));
    expect(block).toBeDefined();
    expect(block).toContain("four to eight weeks");
  });
});

describe("hardcodedKbSources", () => {
  it("produces one source per hardcoded page, each with text", () => {
    const sources = hardcodedKbSources();
    expect(sources).toHaveLength(36);
    expect(
      sources.every((s) => s.text.length > 0 && s.url.startsWith("https://")),
    ).toBe(true);
  });

  it("chunks cleanly into a knowledge base carrying source URLs", () => {
    const kb = buildKnowledgeBase(hardcodedKbSources());
    expect(kb.length).toBeGreaterThanOrEqual(36);
    expect(kb.every((c) => c.url.startsWith("https://nexoristech.com"))).toBe(
      true,
    );
  });
});
