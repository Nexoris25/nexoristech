import { describe, expect, it } from "vitest";
import { INDUSTRIES } from "@nexoris/recommend";
import { sectorIcons } from "./SectorIcon.js";
import { serviceIcons } from "./ServiceIcon.js";
describe("navigation icon identities", () => {
  it("covers every industry and keeps all industry and service glyphs distinct", () => {
    expect(Object.keys(sectorIcons).sort()).toEqual(
      INDUSTRIES.map((i) => i.slug).sort(),
    );
    expect(Object.keys(serviceIcons)).toHaveLength(11);
    const icons = [
      ...Object.values(sectorIcons),
      ...Object.values(serviceIcons),
    ];
    expect(new Set(icons).size).toBe(31);
  });
});
