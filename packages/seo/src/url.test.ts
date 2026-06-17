import { describe, expect, it } from "vitest";
import { absoluteUrl, resolveUrl, toCanonicalPath } from "./url.js";

describe("toCanonicalPath", () => {
  it("keeps the root as a single slash", () => {
    expect(toCanonicalPath("/")).toBe("/");
    expect(toCanonicalPath("")).toBe("/");
  });

  it("appends a trailing slash to content paths", () => {
    expect(toCanonicalPath("/about")).toBe("/about/");
    expect(toCanonicalPath("/ai-product-development")).toBe(
      "/ai-product-development/",
    );
  });

  it("is idempotent on already-canonical paths", () => {
    expect(toCanonicalPath("/about/")).toBe("/about/");
  });

  it("adds a missing leading slash and collapses repeats", () => {
    expect(toCanonicalPath("about")).toBe("/about/");
    expect(toCanonicalPath("//insights//how-to//")).toBe("/insights/how-to/");
  });

  it("drops query strings and hashes", () => {
    expect(toCanonicalPath("/insights?q=clinic")).toBe("/insights/");
    expect(toCanonicalPath("/about#team")).toBe("/about/");
  });

  it("strips the origin if a full URL is passed", () => {
    expect(toCanonicalPath("https://nexoristech.com/contact")).toBe(
      "/contact/",
    );
  });
});

describe("absoluteUrl", () => {
  it("returns the bare origin for the root", () => {
    expect(absoluteUrl("/")).toBe("https://nexoristech.com");
  });

  it("returns the trailing-slash form for content paths", () => {
    expect(absoluteUrl("/about")).toBe("https://nexoristech.com/about/");
    expect(absoluteUrl("/case-studies/covyvo")).toBe(
      "https://nexoristech.com/case-studies/covyvo/",
    );
  });
});

describe("resolveUrl", () => {
  it("returns absolute http urls unchanged", () => {
    expect(
      resolveUrl("https://www.linkedin.com/company/nexoris-technologies"),
    ).toBe("https://www.linkedin.com/company/nexoris-technologies");
  });

  it("makes site paths absolute", () => {
    expect(resolveUrl("/contact")).toBe("https://nexoristech.com/contact/");
  });
});
