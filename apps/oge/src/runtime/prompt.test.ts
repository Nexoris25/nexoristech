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
