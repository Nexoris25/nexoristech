import { describe, it, expect } from "vitest";
import { resolveProof, type ProofLadderInput } from "./proof-ladder.js";

const base: ProofLadderInput = {
  industryLabel: "Healthcare and Clinics",
  techLabel: "AI Chatbots and Virtual Assistants",
  location: "Lagos",
};

describe("resolveProof", () => {
  it("uses exact client proof when it exists", () => {
    const block = resolveProof({
      ...base,
      exact: [{ detail: "Cut missed messages by half.", industry: "Healthcare" }],
    });
    expect(block.tier).toBe("exact");
    expect(block.items[0]?.label).toContain("Our work in Healthcare");
  });

  it("falls back to adjacent proof, labelled honestly", () => {
    const block = resolveProof({
      ...base,
      adjacent: [{ detail: "A logistics project with similar needs.", industry: "Logistics" }],
    });
    expect(block.tier).toBe("adjacent");
    expect(block.items[0]?.label).toContain("similar project in Logistics");
  });

  it("prefers exact over adjacent when both exist", () => {
    const block = resolveProof({
      ...base,
      exact: [{ detail: "Exact.", industry: "Healthcare" }],
      adjacent: [{ detail: "Adjacent.", industry: "Logistics" }],
    });
    expect(block.tier).toBe("exact");
  });

  it("never renders empty: falls to in-house products and capability proof", () => {
    const block = resolveProof(base);
    expect(block.tier).toBe("in-house");
    expect(block.items.length).toBeGreaterThan(0);
    const text = block.items.map((i) => `${i.label} ${i.detail}`).join(" ");
    expect(text).toContain("Covyvo");
    expect(text).toContain("GLEEN");
    expect(text).toContain("Paystack");
    expect(text).toContain("written scope");
  });

  it("never fabricates a client result at the in-house tier", () => {
    const block = resolveProof(base);
    expect(block.items.every((i) => !i.label.startsWith("Our work in"))).toBe(
      true,
    );
  });
});
