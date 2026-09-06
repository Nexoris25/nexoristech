import { describe, expect, it } from "vitest";
import { INDUSTRIES } from "@nexoris/recommend";
import { industryWorkflows } from "./industry-workflows.js";

describe("industry workflow coverage", () => {
  it("provides a distinct, complete comparison for every routed industry", () => {
    expect(Object.keys(industryWorkflows).sort()).toEqual(
      INDUSTRIES.map((i) => i.slug).sort(),
    );
    expect(
      new Set(Object.values(industryWorkflows).map((w) => w.title)).size,
    ).toBe(INDUSTRIES.length);
    for (const workflow of Object.values(industryWorkflows)) {
      expect(workflow.steps).toHaveLength(3);
      expect(workflow.record.trim()).not.toBe("");
      for (const step of workflow.steps) {
        expect(step.label.trim()).not.toBe("");
        expect(step.before.trim()).not.toBe("");
        expect(step.after.trim()).not.toBe("");
        expect(step.before).not.toBe(step.after);
      }
    }
  });
});
