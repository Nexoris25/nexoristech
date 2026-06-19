import { describe, it, expect } from "vitest";
import {
  parseRationale,
  deterministicRationale,
  buildRationaleUser,
} from "./finder-prompt.js";
import { matchRecommendation } from "@nexoris/recommend";

const rec = matchRecommendation({
  industry: "healthcare-software",
  headache: "missed-messages",
});

describe("parseRationale", () => {
  it("reads the rationale from strict JSON", () => {
    expect(parseRationale('{"rationale": "It fits well."}')).toBe(
      "It fits well.",
    );
  });

  it("tolerates a code fence around the JSON", () => {
    expect(
      parseRationale('```json\n{"rationale": "Fenced."}\n```'),
    ).toBe("Fenced.");
  });

  it("extracts the JSON after a reasoning model's think block", () => {
    expect(
      parseRationale(
        '<think>\nReasoning about the answer here.\n</think>\n\n{"rationale": "After thinking."}',
      ),
    ).toBe("After thinking.");
  });

  it("returns null for malformed or empty output", () => {
    expect(parseRationale("not json at all")).toBeNull();
    expect(parseRationale('{"rationale": ""}')).toBeNull();
    expect(parseRationale('{"other": "x"}')).toBeNull();
  });
});

describe("deterministicRationale", () => {
  it("names the chosen services and industry, with no em dash", () => {
    const text = deterministicRationale(
      { industry: "healthcare-software", headache: "missed-messages" },
      rec,
    );
    expect(text).toContain("AI Chatbots and Virtual Assistants");
    expect(text).toContain("Healthcare and Clinics");
    expect(text).toContain("Nexoris Technologies");
    expect(text).not.toContain("—");
  });
});

describe("buildRationaleUser", () => {
  it("passes the human labels of the chosen pages, not slugs", () => {
    const user = buildRationaleUser(
      { industry: "healthcare-software", headache: "missed-messages" },
      rec,
    );
    expect(user).toContain("AI Chatbots and Virtual Assistants");
    expect(user).toContain("We miss customer messages");
  });
});
