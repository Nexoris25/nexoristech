import { describe, it, expect } from "vitest";
import { rulesBaselineScore } from "./score.js";
import { bandForScore } from "./lead.js";
import { parseScore } from "./score-prompt.js";

describe("bandForScore", () => {
  it("bands by the documented thresholds", () => {
    expect(bandForScore(85)).toBe("Hot");
    expect(bandForScore(70)).toBe("Hot");
    expect(bandForScore(60)).toBe("Warm");
    expect(bandForScore(45)).toBe("Warm");
    expect(bandForScore(20)).toBe("Cold");
  });
});

describe("rulesBaselineScore", () => {
  it("scores a complete, urgent, well-fit lead as Hot", () => {
    const result = rulesBaselineScore({
      source: "solution-finder",
      page: "/healthcare-software",
      email: "ada@clinic.ng",
      company: "Lagos Clinic Group",
      message:
        "I am the operations director and we need to stop missing patient messages after hours. We want to start quickly.",
      finder: {
        industry: "healthcare-software",
        headache: "missed-messages",
        urgency: "asap",
        budget: "rough",
      },
    });
    expect(result.band).toBe("Hot");
    expect(result.scoredBy).toBe("rules");
    expect(result.justification).toContain("Hot");
    expect(result.score).toBeGreaterThanOrEqual(70);
  });

  it("scores a sparse, exploratory lead low but never zero", () => {
    const result = rulesBaselineScore({
      source: "contact-form",
      message: "hi",
    });
    expect(result.score).toBeGreaterThanOrEqual(1);
    expect(result.band).toBe("Cold");
  });

  it("always returns a score within 1 to 100", () => {
    const result = rulesBaselineScore({
      source: "solution-finder",
      page: "/fintech-software",
      email: "a@b.ng",
      phone: "+2348000000000",
      company: "Acme",
      message: "x".repeat(500),
      finder: {
        industry: "fintech-software",
        headache: "duplicate-data",
        urgency: "asap",
        budget: "rough",
      },
    });
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.score).toBeGreaterThanOrEqual(1);
  });
});

describe("parseScore", () => {
  it("reads a valid strict-JSON score block", () => {
    const result = parseScore(
      '{"score": 82, "band": "Hot", "justification": "Strong fit and clear intent."}',
    );
    expect(result?.score).toBe(82);
    expect(result?.band).toBe("Hot");
    expect(result?.scoredBy).toBe("ai");
  });

  it("derives the band from the score when the model omits it", () => {
    const result = parseScore('{"score": 50, "justification": "Some intent."}');
    expect(result?.band).toBe("Warm");
  });

  it("clamps an out-of-range score and tolerates a think block", () => {
    const result = parseScore(
      '<think>reasoning</think>{"score": 140, "band": "Hot", "justification": "Very strong."}',
    );
    expect(result?.score).toBe(100);
  });

  it("returns null for malformed output so the caller uses the baseline", () => {
    expect(parseScore("no json")).toBeNull();
    expect(parseScore('{"justification": "missing score"}')).toBeNull();
  });
});
