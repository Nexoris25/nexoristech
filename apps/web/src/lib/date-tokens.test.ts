/**
 * Date placeholders in CMS content.
 *
 * The case these exist for is the evergreen heading: "Best inventory software for Nigerian retailers
 * in [year]". It is the one thing in an article that reliably goes stale, and the alternative is
 * remembering to edit every such page each January.
 *
 * [month] and [year] already worked. [day] did not, and these pin it alongside the rest so the three
 * an editor is told about all behave the same way.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { expandDateTokens } from "./cms.js";

/** 2026-08-27 14:30 Lagos == 13:30 UTC. */
const NOW = new Date("2026-08-27T13:30:00.000Z");

function at(when: Date, run: () => void): void {
  vi.useFakeTimers();
  vi.setSystemTime(when);
  try { run(); } finally { vi.useRealTimers(); }
}

afterEach(() => { vi.useRealTimers(); });

describe("expandDateTokens", () => {
  it("replaces each token with the current value", () => {
    at(NOW, () => {
      expect(expandDateTokens("Best software in [year]")).toBe("Best software in 2026");
      expect(expandDateTokens("Updated [month]")).toBe("Updated August");
      expect(expandDateTokens("On the [day]th")).toBe("On the 27th");
    });
  });

  it("replaces all three together, and more than once each", () => {
    at(NOW, () => {
      expect(expandDateTokens("[day] [month] [year], still [year]")).toBe("27 August 2026, still 2026");
    });
  });

  it("keeps the existing pair tokens working", () => {
    at(NOW, () => {
      expect(expandDateTokens("As of [month year]")).toBe("As of August 2026");
      expect(expandDateTokens("As of [monthyear]")).toBe("As of August 2026");
      expect(expandDateTokens("Dated [day month year]")).toBe("Dated 27 August 2026");
    });
  });

  it("is case-insensitive, because an editor writing a sentence should not have to remember", () => {
    at(NOW, () => {
      expect(expandDateTokens("[Year] [MONTH] [Day]")).toBe("2026 August 27");
    });
  });

  it("works inside markup without disturbing it", () => {
    at(NOW, () => {
      expect(expandDateTokens("<h2>Guide for [year]</h2><p>As of [month].</p>"))
        .toBe("<h2>Guide for 2026</h2><p>As of August.</p>");
    });
  });

  it("leaves other bracketed text alone", () => {
    // An editor writing an aside must not have it eaten.
    at(NOW, () => {
      expect(expandDateTokens("The report [sic] covers [see below] and [year]."))
        .toBe("The report [sic] covers [see below] and 2026.");
    });
  });

  it("uses Lagos time, not UTC", () => {
    // 2027-01-01 00:30 Lagos is still 2026-12-31 23:30 UTC. The page must say 2027.
    at(new Date("2026-12-31T23:30:00.000Z"), () => {
      expect(expandDateTokens("[year]")).toBe("2027");
      expect(expandDateTokens("[month]")).toBe("January");
      expect(expandDateTokens("[day]")).toBe("1");
    });
  });

  it("returns the input untouched when there is nothing to replace", () => {
    at(NOW, () => {
      expect(expandDateTokens("No tokens here at all.")).toBe("No tokens here at all.");
      expect(expandDateTokens("")).toBe("");
    });
  });
});
