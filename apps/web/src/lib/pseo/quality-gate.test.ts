import { describe, it, expect } from "vitest";
import {
  evaluatePublishable,
  type ReadinessRecord,
} from "./quality-gate.js";

const complete: ReadinessRecord = {
  authorSlug: "chinedu-nwogu",
  factCheckerSlug: "a-reviewer",
  dataSources: ["NBS data", "Paystack report", "Our project data"],
  hasProprietaryInsight: true,
  featureMatrixRows: 5,
  intent: "capability",
  hasPricingTable: false,
  hasComparisonMatrix: false,
  isLocationPage: false,
  localDataPoints: [],
  uniqueWordCount: 700,
};

describe("evaluatePublishable", () => {
  it("passes a complete, substantial record", () => {
    expect(evaluatePublishable(complete).publishable).toBe(true);
  });

  it("requires a named author", () => {
    const withoutAuthor: ReadinessRecord = { ...complete };
    delete withoutAuthor.authorSlug;
    const { publishable, reasons } = evaluatePublishable(withoutAuthor);
    expect(publishable).toBe(false);
    expect(reasons.join(" ")).toContain("author");
  });

  it("accepts proprietary insight plus public data in place of three sources", () => {
    expect(
      evaluatePublishable({
        ...complete,
        dataSources: ["NBS data"],
        hasProprietaryInsight: true,
      }).publishable,
    ).toBe(true);
  });

  it("rejects too few sources with no proprietary insight", () => {
    expect(
      evaluatePublishable({
        ...complete,
        dataSources: ["one"],
        hasProprietaryInsight: false,
      }).publishable,
    ).toBe(false);
  });

  it("requires a pricing table for a cost page", () => {
    expect(
      evaluatePublishable({ ...complete, intent: "cost", hasPricingTable: false })
        .publishable,
    ).toBe(false);
    expect(
      evaluatePublishable({ ...complete, intent: "cost", hasPricingTable: true })
        .publishable,
    ).toBe(true);
  });

  it("requires a comparison matrix for a comparison page", () => {
    expect(
      evaluatePublishable({
        ...complete,
        intent: "comparison",
        factCheckerSlug: "r",
        hasComparisonMatrix: false,
      }).publishable,
    ).toBe(false);
  });

  it("requires distinct local data on a location page", () => {
    expect(
      evaluatePublishable({
        ...complete,
        isLocationPage: true,
        localDataPoints: [],
      }).publishable,
    ).toBe(false);
  });

  it("rejects a thin page", () => {
    expect(
      evaluatePublishable({ ...complete, uniqueWordCount: 120 }).publishable,
    ).toBe(false);
  });

  it("lists every unmet rule at once", () => {
    const { reasons } = evaluatePublishable({
      dataSources: [],
      hasProprietaryInsight: false,
      featureMatrixRows: 0,
      intent: "cost",
      hasPricingTable: false,
      hasComparisonMatrix: false,
      isLocationPage: true,
      localDataPoints: [],
      uniqueWordCount: 0,
    });
    expect(reasons.length).toBeGreaterThanOrEqual(5);
  });
});
