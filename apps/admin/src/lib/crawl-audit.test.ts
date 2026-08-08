/**
 * The link parsing and path rules behind Crawl Health. These decide whether a page is reported as broken
 * or as fine, so they are worth pinning: a false "broken link" sends an editor chasing nothing, and a
 * missed one leaves a dead link on the site.
 */
import { describe, it, expect } from "vitest";
import { internalLinks, normalisePath, pathFor } from "./crawl-audit.js";

const ORIGIN = "https://nexoristech.com";

describe("normalisePath", () => {
  it("drops the query and the hash", () => {
    expect(normalisePath("/insights/a?utm=x#top")).toBe("/insights/a");
  });

  it("drops a trailing slash but keeps the root", () => {
    expect(normalisePath("/about/")).toBe("/about");
    expect(normalisePath("/")).toBe("/");
  });
});

describe("internalLinks", () => {
  it("takes root-relative links", () => {
    expect(internalLinks('<a href="/about">About</a>', ORIGIN)).toEqual(["/about"]);
  });

  it("takes absolute links on our own origin, as the path", () => {
    expect(internalLinks(`<a href="${ORIGIN}/contact">Talk</a>`, ORIGIN)).toEqual(["/contact"]);
  });

  it("maps the bare origin to the root", () => {
    expect(internalLinks(`<a href="${ORIGIN}">Home</a>`, ORIGIN)).toEqual(["/"]);
  });

  it("ignores other sites, mail, telephone and in-page anchors", () => {
    const html = `
      <a href="https://google.com/x">out</a>
      <a href="mailto:a@b.com">mail</a>
      <a href="tel:+2348000000000">call</a>
      <a href="#section">jump</a>`;
    expect(internalLinks(html, ORIGIN)).toEqual([]);
  });

  it("counts one path once, however it is spelled", () => {
    const html = '<a href="/about">a</a><a href="/about/">b</a><a href="/about?x=1">c</a>';
    expect(internalLinks(html, ORIGIN)).toEqual(["/about"]);
  });

  it("handles single quotes and loose spacing in the attribute", () => {
    expect(internalLinks("<a href = '/careers' >Jobs</a>", ORIGIN)).toEqual(["/careers"]);
  });

  it("finds nothing in a body with no links", () => {
    expect(internalLinks("<p>Plain copy with no links.</p>", ORIGIN)).toEqual([]);
  });
});

describe("pathFor", () => {
  it("uses the route each kind is actually served at", () => {
    expect(pathFor("insight", "a")).toBe("/insights/a");
    expect(pathFor("case_study", "b")).toBe("/case-studies/b");
    expect(pathFor("job", "c")).toBe("/careers/c");
    expect(pathFor("generated_page", "d")).toBe("/d");
    expect(pathFor("legal_page", "privacy-policy")).toBe("/privacy-policy");
  });

  it("returns nothing for a page with no slug, which has no address to link to", () => {
    expect(pathFor("insight", null)).toBeNull();
  });
});
