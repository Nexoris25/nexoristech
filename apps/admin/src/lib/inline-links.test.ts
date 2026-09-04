/**
 * Inline internal linking.
 *
 * These functions edit published copy in place, so the refusals matter as much as the successes: a bad
 * apply corrupts an article's markup, and a link in the wrong place is worse than no link.
 */
import { describe, it, expect } from "vitest";
import { findAnchor, alreadyLinks, applyInlineLink } from "./inline-links.js";
// Imported at module scope, not inside a test. Loading this pulls in the database client, which took
// long enough under the full parallel run to trip vitest's five-second limit and fail a test that had
// nothing wrong with it.
import { editorialFallback } from "./oge-content.js";

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

describe("internal link suggestions", () => {
  it("suggests a phrase that is actually in the article", async () => {
    const body =
      "<p>Most teams come to us for custom software development after a spreadsheet stops coping.</p>" +
      "<p>We also work on healthcare technology for clinics in Lagos.</p>";
    const links = editorialFallback({ kind: "internal-links", title: "What software costs", body }) as
      { anchor: string; target: string }[];
    // Every suggestion has to be placeable, which means its anchor has to exist in the body.
    const placeable = links.filter((l) => body.toLowerCase().includes(l.anchor.toLowerCase()));
    expect(placeable.length).toBeGreaterThan(0);
  });

  it("targets a path, never the production origin", async () => {
    const links = editorialFallback({
      kind: "internal-links",
      title: "Custom software",
      body: "<p>We build custom software for logistics teams across Nigeria, from fleet tracking to route planning and delivery reporting.</p>",
    }) as { anchor: string; target: string }[];
    expect(links.length).toBeGreaterThan(0);
    for (const l of links) {
      expect(l.target.startsWith("/")).toBe(true);
      expect(l.target).not.toContain("nexoristech.com");
    }
  });
});

/**
 * A link never wraps part of a word.
 *
 * Matching was a plain substring test, so an anchor of "cost" linked the first four letters of
 * "costs" and left the s sitting outside the link. The reader saw a word with its ending sheared
 * off, and the markup carried an anchor around a fragment.
 */
describe("word boundaries", () => {
  const body = "<p>We publish our costs openly, and our automations run overnight.</p>";

  it("does not link a prefix of a longer word", () => {
    expect(applyInlineLink(body, "cost", "/pricing").applied).toBe(false);
    expect(findAnchor(body, "cost")).toBeNull();
  });

  it("does not link a stem inside a plural", () => {
    expect(applyInlineLink(body, "automation", "/business-process-automation").applied).toBe(false);
  });

  it("still links the whole word when the copy uses it", () => {
    const out = applyInlineLink(body, "costs", "/pricing");
    expect(out.applied).toBe(true);
    expect(out.html).toContain('<a href="/pricing">costs</a>');
    // The letters either side survive untouched.
    expect(out.html).toContain("our <a");
    expect(out.html).toContain("</a> openly");
  });

  it("treats a hyphen as part of the word, so a compound is not split", () => {
    const html = "<p>We build e-commerce storefronts.</p>";
    expect(applyInlineLink(html, "commerce", "/ai-ecommerce-development").applied).toBe(false);
    expect(applyInlineLink(html, "e-commerce", "/ai-ecommerce-development").applied).toBe(true);
  });

  it("matches a multi-word phrase across the whitespace a paste leaves behind", () => {
    const html = "<p>Our business  process   automation work.</p>";
    const out = applyInlineLink(html, "business process automation", "/business-process-automation");
    expect(out.applied).toBe(true);
    expect(out.html).toContain("business  process   automation</a>");
  });
});

/**
 * What Oge offers to link to, and what it calls the link.
 *
 * Two faults sat here. The Insights editor passed its own candidate list, and that list replaced the
 * marketing site's pages rather than adding to them, so an article about automation could never be
 * linked to the automation service page it is actually about. And the top five candidates were
 * returned whatever they scored, so a page with nothing in common arrived with the rationale "A
 * strong related Nexoris Technologies page" — a sentence true of every page on the site.
 */
describe("what Oge offers to link", () => {
  const body =
    "<p>We build business process automation for factories, and healthcare software for clinics.</p>" +
    "<p>Our automation work starts with a process audit.</p>";

  const suggest = (pages?: { title: string; url: string }[]) => {
    return editorialFallback({
      kind: "internal-links",
      title: "Automation in Nigerian factories",
      body,
      ...(pages ? { pages } : {}),
    }) as { anchor: string; target: string; rationale: string }[];
  };

  it("offers the service and industry pages even when the editor passes its own list", async () => {
    // The editor always passes something, which is why these were never reachable.
    const links = await suggest([{ title: "An unrelated article", url: "/insights/unrelated" }]);
    const targets = links.map((l) => l.target);
    expect(targets).toContain("/business-process-automation");
  });

  it("offers nothing that the article does not actually discuss", async () => {
    const links = await suggest([{ title: "Deep Sea Fishing Quotas", url: "/insights/fishing" }]);
    expect(links.map((l) => l.target)).not.toContain("/insights/fishing");
  });

  it("gives every suggestion a reason drawn from the article", async () => {
    for (const l of await suggest()) {
      expect(l.rationale).toMatch(/Your article mentions /);
      expect(l.rationale).not.toMatch(/A strong related/);
    }
  });

  it("only suggests anchors that can actually be placed", async () => {
    for (const l of await suggest()) {
      expect(findAnchor(body, l.anchor), `anchor "${l.anchor}" is not in the copy`).not.toBeNull();
    }
  });

  it("prefers a phrase over a lone word", async () => {
    const links = await suggest();
    const automation = links.find((l) => l.target === "/business-process-automation");
    expect(automation?.anchor.split(/\s+/).length).toBeGreaterThan(1);
  });
});

/**
 * An anchor has to read as the name of something.
 *
 * The picker used to take the first run of words from the target's title that appeared in the copy,
 * longest size first, and length is not quality: from "Lagos Cybersecurity Guidelines 2026: What
 * Every Nigerian Business Must Do Now" it returned "Must Do", because those two words happened to sit
 * together in the article. "dashboard" on its own was the same fault from the other end — a real word
 * that could lead anywhere on the site.
 */
describe("anchor phrases read as names", () => {
  const suggest = (title: string, url: string, body: string) =>
    (editorialFallback({
      kind: "internal-links",
      title: "An article",
      body,
      pages: [{ title, url }],
    }) as { anchor: string; target: string }[]).find((l) => l.target === url);

  it("does not hang a link on a sentence fragment", () => {
    const found = suggest(
      "Lagos Cybersecurity Guidelines 2026: What Every Nigerian Business Must Do Now",
      "/insights/lagos-cybersecurity",
      "<p>Every Nigerian business must do a great deal more about security this year, and the Lagos Cybersecurity Guidelines set out exactly what that means in practice.</p>",
    );
    expect(found?.anchor).not.toBe("Must Do");
    expect(found?.anchor?.toLowerCase()).not.toMatch(/^(must|do|what|every|how|now|and|the|of|to)\b/);
    expect(found?.anchor?.toLowerCase()).not.toMatch(/\b(must|do|what|every|and|the|of|to|now)$/);
  });

  it("prefers the phrase that names the subject", () => {
    const found = suggest(
      "Lagos Cybersecurity Guidelines 2026: What Every Nigerian Business Must Do Now",
      "/insights/lagos-cybersecurity",
      "<p>The Lagos Cybersecurity Guidelines apply to every Nigerian business that handles customer records, and compliance is now being checked rather than assumed.</p>",
    );
    expect(found?.anchor).toBe("Lagos Cybersecurity Guidelines");
  });

  it("keeps a proper name over a generic word beside it", () => {
    const found = suggest(
      "GovTech Platforms",
      "/govtech-platforms",
      "<p>We build GovTech Platforms for federal and state agencies, alongside the revenue and case management systems those agencies already run.</p>",
    );
    expect(found?.anchor).toBe("GovTech Platforms");
  });

  it("offers nothing rather than a bare generic word", () => {
    // "dashboard" is a real word and a useless anchor: it could lead anywhere on this site.
    const found = suggest(
      "Business Dashboards and Analytics",
      "/data-dashboards-predictive-analytics",
      "<p>Every team we speak to wants a dashboard of some kind, and we are asked for one on almost every project we scope.</p>",
    );
    expect(found).toBeUndefined();
  });

  it("still finds a real phrase when the copy uses one", () => {
    const found = suggest(
      "Business Process Automation Services",
      "/business-process-automation",
      "<p>Our business process automation work always starts with a process audit, because automating a broken process only makes it fail faster.</p>",
    );
    expect(found?.anchor?.toLowerCase()).toBe("business process automation");
  });
});

/**
 * The rest of what a usable set of suggestions has to be.
 *
 * Each of these was a real fault in the output before it was fixed: a price caught in a two-word
 * window, the same phrase offered for two different destinations, and an industry page matched to an
 * article on a completely different subject because both mention Nigeria.
 */
describe("a usable set of suggestions", () => {
  const run = (title: string, body: string, pages?: { title: string; url: string }[]) =>
    editorialFallback({ kind: "internal-links", title, body, ...(pages ? { pages } : {}) }) as
      { anchor: string; target: string }[];

  const article =
    "<p>Nigerian hospitals pay ₦766 million a year for software they barely use, and the 2026 budget " +
    "does nothing to change that.</p>" +
    "<p>A hospital management system should cut that cost, not add to it, and the clinic teams we work " +
    "with care far more about uptime than about features.</p>";

  it("never puts a figure or a year in link text", () => {
    for (const l of run("Hospital costs", article)) {
      expect(l.anchor, `anchor "${l.anchor}"`).not.toMatch(/[\d₦$€£%]/);
    }
  });

  it("never offers the same phrase for two different pages", () => {
    const links = run("Hospital costs", article);
    const anchors = links.map((l) => l.anchor.toLowerCase());
    expect(anchors.length).toBe(new Set(anchors).size);
  });

  it("does not match an industry page on the country alone", () => {
    // Both mention Nigeria and nothing else in common; that is not a reason to link them.
    const links = run(
      "Cybersecurity rules",
      "<p>Nigerian businesses now face new cybersecurity rules that change how customer records are " +
        "stored, audited and reported to the regulator each year.</p>",
      [{ title: "School Management Software in Nigeria", url: "/education-software" }],
    );
    expect(links.map((l) => l.target)).not.toContain("/education-software");
  });

  it("will link the company name to the home page when the article names it", () => {
    const links = run(
      "How we work",
      "<p>Nexoris Technologies builds hospital software for clinics across the country, and the team " +
        "stays on after launch to keep it running.</p>",
    );
    const home = links.find((l) => l.target === "/");
    expect(home?.anchor).toBe("Nexoris Technologies");
  });
});
