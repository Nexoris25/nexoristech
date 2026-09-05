import { describe, it, expect } from "vitest";
import { caseStudiesForIndustry } from "./case-study-industry.js";
const study = (industry: string) => ({ title: industry, slug: industry.toLowerCase(), industry, metrics: [] });
describe("CMS industry case-study relationships", () => {
  it("matches canonical labels and the short label supported by the CMS editor", () => {
    const rows = [study("Fintech"), study("Financial Services and Fintech"), study("Insurance")];
    expect(caseStudiesForIndustry(rows, "fintech-software")).toEqual(rows.slice(0,2));
  });
  it("does not treat a substring or an unrelated sector as proof", () => {
    expect(caseStudiesForIndustry([study("Not Fintech"), study("Insurance")], "fintech-software")).toEqual([]);
    expect(caseStudiesForIndustry([study("Fintech")], "unknown")).toEqual([]);
  });
  it("preserves publication order and limits without inventing empty cards", () => {
    const rows = [study("Education and EdTech"), study("Education")];
    expect(caseStudiesForIndustry(rows, "education-software", 1)).toEqual([rows[0]]);
    expect(caseStudiesForIndustry([], "education-software")).toEqual([]);
  });
});
