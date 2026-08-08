/**
 * Inline internal linking.
 *
 * These functions edit published copy in place, so the refusals matter as much as the successes: a bad
 * apply corrupts an article's markup, and a link in the wrong place is worse than no link.
 */
import { describe, it, expect } from "vitest";
import { findAnchor, alreadyLinks, applyInlineLink } from "./inline-links.js";

const BODY = [
  "<h2>Choosing a system</h2>",
  "<p>Nigerian clinics need a hospital management system that handles NHIS claims.</p>",
  "<p>Budget matters, and so does the cost of a website when you compare vendors.</p>",
].join("");

describe("findAnchor", () => {
  it("finds the phrase and says which paragraph holds it", () => {
    const m = findAnchor(BODY, "hospital management system");
    expect(m?.paragraphNumber).toBe(1);
    expect(m?.match).toBe("hospital management system");
  });

  it("splits the paragraph either side of the phrase so it can be shown marked", () => {
    const m = findAnchor(BODY, "hospital management system");
    expect(m?.before).toBe("Nigerian clinics need a ");
    expect(m?.after).toBe(" that handles NHIS claims.");
  });

  it("counts to the right paragraph for a later match", () => {
    expect(findAnchor(BODY, "cost of a website")?.paragraphNumber).toBe(2);
  });

  it("matches whatever the case, and returns the copy's own wording", () => {
    expect(findAnchor(BODY, "Hospital Management System")?.match).toBe("hospital management system");
  });

  it("tolerates the extra whitespace a paste leaves between words", () => {
    expect(findAnchor("<p>a hospital   management  system here</p>", "hospital management system")?.match)
      .toBe("hospital   management  system");
  });

  it("ignores a phrase that only appears in a heading", () => {
    expect(findAnchor("<h2>Choosing a system</h2><p>Nothing here.</p>", "Choosing a system")).toBeNull();
  });

  it("ignores a phrase already inside a link", () => {
    expect(findAnchor('<p>See our <a href="/x">pricing page</a> for more.</p>', "pricing page")).toBeNull();
  });

  it("finds a phrase in a list item, which is ordinary running text", () => {
    expect(findAnchor("<ul><li>Our cloud services team helps.</li></ul>", "cloud services")?.match).toBe("cloud services");
  });

  it("returns nothing when the phrase is not in the copy at all", () => {
    expect(findAnchor(BODY, "quantum computing")).toBeNull();
  });

  it("returns nothing for an empty phrase rather than matching everywhere", () => {
    expect(findAnchor(BODY, "   ")).toBeNull();
  });
});

describe("alreadyLinks", () => {
  it("sees an existing link to the target", () => {
    expect(alreadyLinks('<p><a href="/insights/a">x</a></p>', "/insights/a")).toBe(true);
  });

  it("does not confuse a different target", () => {
    expect(alreadyLinks('<p><a href="/insights/a">x</a></p>', "/insights/b")).toBe(false);
  });
});

describe("applyInlineLink", () => {
  it("wraps the phrase where it sits, leaving the rest of the paragraph alone", () => {
    const r = applyInlineLink(BODY, "hospital management system", "/hospital-management-system");
    expect(r.applied).toBe(true);
    expect(r.html).toContain('need a <a href="/hospital-management-system">hospital management system</a> that handles');
  });

  it("links the first occurrence only, so a page is not stuffed with the same link", () => {
    const body = "<p>A cloud services team.</p><p>Another cloud services mention.</p>";
    const r = applyInlineLink(body, "cloud services", "/cloud");
    expect(r.html.match(/<a /g)).toHaveLength(1);
    expect(r.html).toContain('<p>A <a href="/cloud">cloud services</a> team.</p>');
  });

  it("refuses a second link to a target the page already links to", () => {
    const body = '<p>See <a href="/cloud">cloud</a>.</p><p>More cloud services here.</p>';
    const r = applyInlineLink(body, "cloud services", "/cloud");
    expect(r.applied).toBe(false);
    expect(r.reason).toBe("already-linked");
    expect(r.html).toBe(body);
  });

  it("refuses when the phrase is not in the copy, and changes nothing", () => {
    const r = applyInlineLink(BODY, "not present anywhere", "/x");
    expect(r.applied).toBe(false);
    expect(r.reason).toBe("not-found");
    expect(r.html).toBe(BODY);
  });

  it("does not put a link inside a heading", () => {
    const r = applyInlineLink("<h2>Cloud services</h2><p>Body.</p>", "Cloud services", "/cloud");
    expect(r.applied).toBe(false);
  });

  it("does not nest a link inside an existing one", () => {
    const body = '<p>Our <a href="/a">cloud services</a> team.</p>';
    const r = applyInlineLink(body, "cloud services", "/b");
    expect(r.applied).toBe(false);
    expect(r.html).toBe(body);
  });

  it("keeps the attributes on the block it edits", () => {
    const r = applyInlineLink('<p class="lead">Our cloud services team.</p>', "cloud services", "/cloud");
    expect(r.html).toBe('<p class="lead">Our <a href="/cloud">cloud services</a> team.</p>');
  });

  it("leaves markup alone when the phrase straddles a tag", () => {
    const body = "<p>Our <strong>cloud</strong> services team.</p>";
    const r = applyInlineLink(body, "cloud services", "/cloud");
    expect(r.applied).toBe(false);
    expect(r.html).toBe(body);
  });

  it("links inside a list item", () => {
    const r = applyInlineLink("<ul><li>Ask about cloud services today.</li></ul>", "cloud services", "/cloud");
    expect(r.html).toBe('<ul><li>Ask about <a href="/cloud">cloud services</a> today.</li></ul>');
  });
});
