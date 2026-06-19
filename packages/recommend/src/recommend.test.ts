import { describe, it, expect } from "vitest";
import { SERVICES, INDUSTRIES, isServiceSlug, isIndustrySlug } from "./registry.js";
import { SERVICE_INDUSTRIES, servicesForIndustry } from "./matrix.js";
import { HEADACHE_SERVICES, HEADACHE_OPTIONS } from "./questions.js";
import { matchRecommendation } from "./match.js";

describe("registry", () => {
  it("holds the 11 services and 20 industries with unique slugs", () => {
    expect(SERVICES).toHaveLength(11);
    expect(INDUSTRIES).toHaveLength(20);
    expect(new Set(SERVICES.map((s) => s.slug)).size).toBe(11);
    expect(new Set(INDUSTRIES.map((i) => i.slug)).size).toBe(20);
  });
});

describe("cross-linking matrix (PRD 8)", () => {
  it("references only real industry slugs and covers every service", () => {
    expect(Object.keys(SERVICE_INDUSTRIES).sort()).toEqual(
      SERVICES.map((s) => s.slug).sort(),
    );
    for (const industries of Object.values(SERVICE_INDUSTRIES)) {
      for (const slug of industries) expect(isIndustrySlug(slug)).toBe(true);
    }
  });

  it("reverses cleanly, for example fintech lists product development", () => {
    expect(servicesForIndustry("fintech-software")).toContain(
      "ai-product-development",
    );
  });
});

describe("headache mapping", () => {
  it("maps every headache option to at least one real service", () => {
    for (const option of HEADACHE_OPTIONS) {
      const services = HEADACHE_SERVICES[option.value];
      expect(services.length).toBeGreaterThan(0);
      for (const slug of services) expect(isServiceSlug(slug)).toBe(true);
    }
  });
});

describe("matchRecommendation", () => {
  it("reproduces the PRD 10.7 example: healthcare + missed messages", () => {
    const rec = matchRecommendation({
      industry: "healthcare-software",
      headache: "missed-messages",
      companySize: "51-200",
      urgency: "asap",
    });
    expect(rec.services.map((s) => s.slug)).toContain(
      "ai-chatbots-virtual-assistants",
    );
    expect(rec.industry.slug).toBe("healthcare-software");
    expect(rec.industry.href).toBe("/healthcare-software");
  });

  it("returns one to three services, all real pages", () => {
    const rec = matchRecommendation({
      industry: "manufacturing-software",
      headache: "slow-reports",
    });
    expect(rec.services.length).toBeGreaterThanOrEqual(1);
    expect(rec.services.length).toBeLessThanOrEqual(3);
    for (const s of rec.services) {
      expect(isServiceSlug(s.slug)).toBe(true);
      expect(s.href).toBe(`/${s.slug}`);
    }
  });

  it("ranks a service that covers the chosen industry first", () => {
    // duplicate-data -> [business-process-automation, ai-systems-integration].
    // For manufacturing, both cover it, BPA listed first; for retail, systems-integration
    // and BPA both cover retail too, so check an industry that separates them.
    // insurance-software is covered by business-process-automation but not ai-systems-integration.
    const rec = matchRecommendation({
      industry: "insurance-software",
      headache: "duplicate-data",
    });
    expect(rec.services[0]?.slug).toBe("business-process-automation");
  });
});
