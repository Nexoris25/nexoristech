import { describe, it, expect } from "vitest";
import { buildSystemPrompt, OGE_SYSTEM_PROMPT_HEADER } from "./prompt.js";
import type { RetrievedChunk } from "../retrieval/retrieve.js";

const chunk: RetrievedChunk = {
  chunkId: "https://nexoristech.com/how-we-work/#0",
  url: "https://nexoristech.com/how-we-work/",
  title: "How We Work | Nexoris Technologies",
  content: "We agree the outcome and price before we start.",
};

describe("buildSystemPrompt", () => {
  it("carries the verbatim grounding rules", () => {
    const prompt = buildSystemPrompt([chunk]);
    expect(prompt).toContain(OGE_SYSTEM_PROMPT_HEADER);
    expect(prompt).toContain("Answer ONLY from the provided context");
    expect(prompt).toContain("Never use an em dash");
  });

  it("includes the chunk content and its source URL for citation", () => {
    const prompt = buildSystemPrompt([chunk]);
    expect(prompt).toContain("We agree the outcome and price before we start.");
    expect(prompt).toContain("https://nexoristech.com/how-we-work/");
  });

  it("never contains an em dash", () => {
    expect(buildSystemPrompt([chunk])).not.toContain("—");
  });

  it("states plainly when no context was found", () => {
    expect(buildSystemPrompt([])).toContain("(no relevant context was found)");
  });
});

/**
 * Voice rules the assistant kept breaking.
 *
 * Asked what Nexoris Technologies does, on the Nexoris Technologies website, it answered "They help
 * companies solve problems" and "They work with various types of businesses". It was describing the
 * company to a visitor as though it were a third party, in the same panel whose greeting says "Ask
 * me what we build". It also wrote "organizations", which is not the spelling used anywhere else on
 * the site.
 */
describe("assistant voice", () => {
  it("tells the model it speaks as the company, not about it", () => {
    expect(OGE_SYSTEM_PROMPT_HEADER).toMatch(/speak[s]? AS Nexoris Technologies/i);
    expect(OGE_SYSTEM_PROMPT_HEADER).toMatch(/never "they"/i);
  });

  it("names the spelling convention rather than only saying English", () => {
    expect(OGE_SYSTEM_PROMPT_HEADER).toMatch(/British and Nigerian spelling/i);
    expect(OGE_SYSTEM_PROMPT_HEADER).toMatch(/organisation/);
  });

  it("still keeps page names out of the prose, which the source list handles instead", () => {
    // The two rules work together: no "according to our About page" in the answer, and a quiet
    // list of the pages underneath so a visitor can still check it.
    expect(OGE_SYSTEM_PROMPT_HEADER).toMatch(/do not reveal where the information came from/i);
  });
});
