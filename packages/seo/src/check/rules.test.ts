import { describe, expect, it } from "vitest";
import { validateManifest, validatePage } from "./rules.js";
import type { SeoManifestEntry } from "./rules.js";

/** A fully compliant service-page manifest entry, used as the base for each test. */
function validEntry(
  overrides: Partial<SeoManifestEntry> = {},
): SeoManifestEntry {
  return {
    path: "/ai-product-development",
    routeClass: "service",
    noindex: false,
    title: "AI Product Development | Nexoris Technologies",
    description:
      "We design and build websites, apps, dashboards, and custom business software for companies across Nigeria and abroad. Tell us the problem, and we will help.",
    canonical: "https://nexoristech.com/ai-product-development/",
    og: {
      title: "AI Product Development | Nexoris Technologies",
      description: "Custom software built around your business.",
      url: "https://nexoristech.com/ai-product-development/",
      image: "https://nexoristech.com/ai-product-development/opengraph-image",
      type: "website",
      locale: "en_NG",
    },
    h1Count: 1,
    htmlLang: "en-NG",
    inSitemap: true,
    jsonLdParseable: true,
    schemaTypes: [
      "Organization",
      "ProfessionalService",
      "WebSite",
      "Person",
      "WebPage",
      "BreadcrumbList",
      "Service",
    ],
    schemaInLanguage: "en-NG",
    addressCountry: "NG",
    hasFaqSection: false,
    ...overrides,
  };
}

describe("validatePage", () => {
  it("passes a fully compliant page", () => {
    expect(validatePage(validEntry())).toEqual([]);
  });

  it("flags a wrong canonical", () => {
    const issues = validatePage(
      validEntry({
        canonical: "https://nexoristech.com/ai-product-development",
      }),
    );
    expect(issues.some((i) => i.rule === "canonical-correct")).toBe(true);
  });

  it("flags a title over 60 characters", () => {
    const issues = validatePage(
      validEntry({
        title:
          "A truly enormous meta title that comfortably exceeds sixty characters here",
      }),
    );
    expect(issues.some((i) => i.rule === "title-max")).toBe(true);
  });

  it("flags more than one H1", () => {
    expect(
      validatePage(validEntry({ h1Count: 2 })).some(
        (i) => i.rule === "single-h1",
      ),
    ).toBe(true);
  });

  it("flags noindex disagreeing with sitemap inclusion", () => {
    const issues = validatePage(validEntry({ noindex: true, inSitemap: true }));
    expect(issues.some((i) => i.rule === "noindex-sitemap-agree")).toBe(true);
  });

  it("passes a noindex page that is correctly out of the sitemap", () => {
    expect(
      validatePage(validEntry({ noindex: true, inSitemap: false })),
    ).toEqual([]);
  });

  it("flags missing Open Graph tags", () => {
    const issues = validatePage(validEntry({ og: { title: "x" } }));
    expect(issues.some((i) => i.rule === "og-complete")).toBe(true);
  });

  it("flags og:url not equal to the canonical", () => {
    const issues = validatePage(
      validEntry({
        og: { ...validEntry().og, url: "https://nexoristech.com/other/" },
      }),
    );
    expect(issues.some((i) => i.rule === "og-url-canonical")).toBe(true);
  });

  it("flags a missing required site node", () => {
    const issues = validatePage(
      validEntry({
        schemaTypes: [
          "WebSite",
          "Person",
          "WebPage",
          "BreadcrumbList",
          "Service",
        ],
      }),
    );
    expect(issues.some((i) => i.rule === "schema-site-node")).toBe(true);
  });

  it("flags a missing route-class node", () => {
    const issues = validatePage(
      validEntry({
        schemaTypes: [
          "Organization",
          "ProfessionalService",
          "WebSite",
          "Person",
          "WebPage",
          "BreadcrumbList",
        ],
      }),
    );
    expect(issues.some((i) => i.rule === "schema-route-node")).toBe(true);
  });

  it("accepts BlogPosting in place of Article for insights", () => {
    const issues = validatePage(
      validEntry({
        path: "/insights/reduce-no-shows",
        routeClass: "insight",
        canonical: "https://nexoristech.com/insights/reduce-no-shows/",
        og: {
          ...validEntry().og,
          url: "https://nexoristech.com/insights/reduce-no-shows/",
        },
        schemaTypes: [
          "Organization",
          "ProfessionalService",
          "WebSite",
          "Person",
          "WebPage",
          "BreadcrumbList",
          "BlogPosting",
        ],
      }),
    );
    expect(issues.filter((i) => i.rule === "schema-route-node")).toEqual([]);
  });

  it("requires a BreadcrumbList on non-home pages", () => {
    const issues = validatePage(
      validEntry({
        schemaTypes: [
          "Organization",
          "ProfessionalService",
          "WebSite",
          "Person",
          "WebPage",
          "Service",
        ],
      }),
    );
    expect(issues.some((i) => i.rule === "breadcrumb")).toBe(true);
  });

  it("flags FAQPage emitted with no FAQ section", () => {
    const issues = validatePage(
      validEntry({
        hasFaqSection: false,
        schemaTypes: [...validEntry().schemaTypes, "FAQPage"],
      }),
    );
    expect(issues.some((i) => i.rule === "faq-schema-absent")).toBe(true);
  });

  it("flags an FAQ section with no FAQPage schema", () => {
    const issues = validatePage(validEntry({ hasFaqSection: true }));
    expect(issues.some((i) => i.rule === "faq-schema-present")).toBe(true);
  });

  it("flags a wrong html lang", () => {
    expect(
      validatePage(validEntry({ htmlLang: "en" })).some(
        (i) => i.rule === "html-lang",
      ),
    ).toBe(true);
  });

  it("allows the home page without a breadcrumb", () => {
    const home = validEntry({
      path: "/",
      routeClass: "home",
      canonical: "https://nexoristech.com",
      title: "Software Development Company in Lagos | Nexoris Technologies",
      og: {
        title: "Software Development Company in Lagos | Nexoris Technologies",
        description: "Custom software for Nigeria and beyond.",
        url: "https://nexoristech.com",
        image: "https://nexoristech.com/opengraph-image",
        type: "website",
        locale: "en_NG",
      },
      schemaTypes: [
        "Organization",
        "ProfessionalService",
        "WebSite",
        "Person",
        "WebPage",
      ],
    });
    expect(validatePage(home)).toEqual([]);
  });
});

describe("validateManifest", () => {
  it("flags duplicate canonicals", () => {
    const a = validEntry();
    const b = validEntry({ path: "/duplicate" });
    b.canonical = a.canonical;
    const issues = validateManifest([a, b]);
    expect(issues.some((i) => i.rule === "duplicate-slug")).toBe(true);
  });

  it("passes a clean two-page manifest", () => {
    const a = validEntry();
    const b = validEntry({
      path: "/business-process-automation",
      canonical: "https://nexoristech.com/business-process-automation/",
      og: {
        ...validEntry().og,
        url: "https://nexoristech.com/business-process-automation/",
      },
    });
    expect(validateManifest([a, b])).toEqual([]);
  });
});

/**
 * Errors block, warnings do not.
 *
 * The distinction earns its place now the gate covers CMS pages as well as hardcoded ones. A
 * canonical pointing at the wrong URL is a defect in the code and should stop a deploy. A meta
 * description a few characters under the target is an editor's copy: worth telling them, not worth
 * blocking on. Without this, adding content routes to the manifest would have made every short
 * description a failed build.
 */
describe("issue severity", () => {
  it("treats the description target as a warning", () => {
    const issues = validatePage(validEntry({ description: "Far too short to reach the target." }));
    const min = issues.find((i) => i.rule === "description-min");
    expect(min?.severity).toBe("warning");
  });

  it("treats the description limit as an error", () => {
    const issues = validatePage(validEntry({ description: "x".repeat(200) }));
    expect(issues.find((i) => i.rule === "description-max")?.severity).toBe("error");
  });

  it("treats a wrong canonical as an error", () => {
    const issues = validatePage(validEntry({ canonical: "https://nexoristech.com/somewhere-else/" }));
    expect(issues.find((i) => i.rule === "canonical-correct")?.severity).toBe("error");
  });

  it("gives every issue a severity", () => {
    const issues = validatePage(validEntry({ canonical: "", h1Count: 3, description: "short.", schemaTypes: [] }));
    expect(issues.length).toBeGreaterThan(3);
    for (const issue of issues) expect(["error", "warning"], issue.rule).toContain(issue.severity);
  });

  it("keeps a short description off the blocking list on its own", () => {
    // The exact case the CMS pages hit: nothing wrong but the length.
    const issues = validatePage(validEntry({ description: "A complete but short description." }));
    expect(issues.every((i) => i.severity === "warning")).toBe(true);
  });
});
