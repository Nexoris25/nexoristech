/**
 * Citations point at the page the site actually serves.
 *
 * Chunks are stored with whatever URL the ingest saw, and some carry no trailing slash. The site
 * answers those with a 308 to the slashed form, so every citation Oge showed a visitor cost an extra
 * round trip, and the same page retrieved under two spellings counted as two sources.
 */
import { describe, it, expect } from "vitest";
import { OgeService } from "./oge.service.js";

/** The method is private by design; the behaviour is what matters and it is worth pinning. */
const canonical = (u: string): string =>
  (OgeService.prototype as unknown as { canonicalSourceUrl(raw: string): string }).canonicalSourceUrl(u);

describe("canonicalSourceUrl", () => {
  it("adds the trailing slash the site redirects to", () => {
    expect(canonical("https://nexoristech.com/insights/website-cost-in-nigeria")).toBe(
      "https://nexoristech.com/insights/website-cost-in-nigeria/",
    );
  });

  it("leaves an already-canonical URL alone", () => {
    expect(canonical("https://nexoristech.com/contact/")).toBe("https://nexoristech.com/contact/");
  });

  it("gives the bare origin its root path", () => {
    expect(canonical("https://nexoristech.com")).toBe("https://nexoristech.com/");
  });

  it("does not put a slash after a file", () => {
    expect(canonical("https://nexoristech.com/llms.txt")).toBe("https://nexoristech.com/llms.txt");
  });

  it("returns anything unparseable untouched rather than throwing", () => {
    expect(canonical("not a url")).toBe("not a url");
  });
});
