/**
 * What the redirect manager accepts, and what it refuses.
 *
 * The field used to be stored with nothing but a `.trim()`, which is how a rule reading
 * "//web-development/" came to sit in the table marked Active while never matching anything: no
 * browser requests a doubled leading slash. Rejecting or repairing the input at the point of saving
 * is the difference between a rule that works and a rule that only looks like it does.
 */
import { describe, it, expect } from "vitest";
import { normaliseDestination, normaliseSource, oneOf, parseRedirectForm, CASE_MODES } from "./redirect-rules.js";

const form = (fields: Record<string, string>) => (name: string): unknown => fields[name] ?? "";

describe("normaliseSource", () => {
  it("adds the leading slash a person leaves off", () => {
    expect(normaliseSource("web-development/", "Exact match").value).toBe("/web-development/");
  });

  it("collapses the doubled slash that broke the real rule", () => {
    expect(normaliseSource("//web-development/", "Exact match").value).toBe("/web-development/");
  });

  it("takes the path out of a full URL, because that is what people paste", () => {
    expect(normaliseSource("https://nexoristech.com/old-page/", "Exact match").value).toBe("/old-page/");
  });

  it("keeps a query string on the source", () => {
    expect(normaliseSource("https://nexoristech.com/p/?ref=x", "Exact match").value).toBe("/p/?ref=x");
  });

  it("refuses an empty source and the home page", () => {
    expect(normaliseSource("", "Exact match").error).toBeTruthy();
    expect(normaliseSource("/", "Exact match").error).toBeTruthy();
  });

  it("leaves a regular expression exactly as written", () => {
    const r = normaliseSource("^/blog/(.+)$", "Pattern match (RegEx)");
    expect(r.value).toBe("^/blog/(.+)$");
    expect(r.error).toBeNull();
  });

  it("refuses a regular expression that will not compile", () => {
    expect(normaliseSource("([unclosed", "Pattern match (RegEx)").error).toBeTruthy();
  });

  it("refuses an over-long pattern", () => {
    expect(normaliseSource("a".repeat(301), "Pattern match (RegEx)").error).toBeTruthy();
  });
});

describe("normaliseDestination", () => {
  it("keeps an absolute URL so a redirect can point off-site", () => {
    expect(normaliseDestination("https://example.com/x", "301").value).toBe("https://example.com/x");
  });

  it("makes a bare path absolute on this site", () => {
    expect(normaliseDestination("new-page/", "301").value).toBe("/new-page/");
  });

  it("wants no destination for a 410, because the page is gone", () => {
    const r = normaliseDestination("", "410");
    expect(r.value).toBe("");
    expect(r.error).toBeNull();
  });

  it("insists on a destination for every other type", () => {
    expect(normaliseDestination("", "301").error).toBeTruthy();
  });

  it("leaves capture-group placeholders alone", () => {
    expect(normaliseDestination("/insights/$1/", "301").value).toBe("/insights/$1/");
  });
});

describe("oneOf", () => {
  it("falls back to the first allowed value rather than trusting the post", () => {
    expect(oneOf(CASE_MODES, "Match Case")).toBe("Match Case");
    expect(oneOf(CASE_MODES, "something else")).toBe("Ignore Case");
  });
});

describe("parseRedirectForm", () => {
  it("accepts a whole form and normalises both ends", () => {
    const { input, error } = parseRedirectForm(form({
      old_url: "https://nexoristech.com/web-development/",
      new_url: "ai-ecommerce-development/",
      type: "301", pattern: "Exact match", status: "Active",
    }));
    expect(error).toBeNull();
    expect(input?.oldUrl).toBe("/web-development/");
    expect(input?.newUrl).toBe("/ai-ecommerce-development/");
  });

  it("refuses a redirect that points at itself", () => {
    const { error } = parseRedirectForm(form({ old_url: "/a/", new_url: "/a/", type: "301" }));
    expect(error).toBeTruthy();
  });

  it("refuses an unreadable expiry date", () => {
    const { error } = parseRedirectForm(form({
      old_url: "/a/", new_url: "/b/", type: "301", expiry_date: "soon",
    }));
    expect(error).toBeTruthy();
  });

  it("refuses a window that closes before it opens", () => {
    const { error } = parseRedirectForm(form({
      old_url: "/a/", new_url: "/b/", type: "301",
      start_date: "2026-10-01", expiry_date: "2026-09-01",
    }));
    expect(error).toBeTruthy();
  });

  it("accepts a 410 with no destination", () => {
    const { input, error } = parseRedirectForm(form({ old_url: "/gone/", new_url: "", type: "410" }));
    expect(error).toBeNull();
    expect(input?.newUrl).toBe("");
  });

  it("keeps every setting the form offers", () => {
    const { input } = parseRedirectForm(form({
      old_url: "/a/", new_url: "/b/", type: "307", pattern: "Pattern match (RegEx)",
      case_sensitivity: "Match Case", slash_handling: "Exact Match",
      start_date: "2026-01-01", expiry_date: "2026-12-31", status: "Inactive", notes: "why",
    }));
    // Every one of these was posted by the form and discarded before.
    expect(input).toMatchObject({
      type: "307",
      pattern: "Pattern match (RegEx)",
      caseSensitivity: "Match Case",
      slashHandling: "Exact Match",
      startDate: "2026-01-01",
      expiryDate: "2026-12-31",
      status: "Inactive",
      notes: "why",
    });
  });
});
