import { describe, expect, it } from "vitest";
import { buildSitemapIndex, buildUrlset, sitemapGroupPath } from "./sitemap.js";
import { buildRobotsTxt } from "./robots.js";
import { buildLlmsTxt } from "./llms.js";

describe("buildUrlset", () => {
  it("emits absolute trailing-slash locs", () => {
    const xml = buildUrlset([{ path: "/about", lastmod: "2026-06-17" }]);
    expect(xml).toContain("<loc>https://nexoristech.com/about/</loc>");
    expect(xml).toContain("<lastmod>2026-06-17</lastmod>");
  });

  it("omits lastmod when absent", () => {
    const xml = buildUrlset([{ path: "/contact" }]);
    expect(xml).toContain("<loc>https://nexoristech.com/contact/</loc>");
    expect(xml).not.toContain("<lastmod>");
  });

  it("escapes ampersands in urls", () => {
    const xml = buildUrlset([{ path: "/insights/a&b" }]);
    expect(xml).toContain("&amp;");
  });
});

describe("buildSitemapIndex", () => {
  it("references each group at its path", () => {
    const xml = buildSitemapIndex([
      { group: "services" },
      { group: "industries" },
    ]);
    expect(xml).toContain("https://nexoristech.com/sitemap-services.xml");
    expect(xml).toContain("https://nexoristech.com/sitemap-industries.xml");
  });
});

describe("sitemapGroupPath", () => {
  it("names the file per group", () => {
    expect(sitemapGroupPath("programmatic")).toBe("/sitemap-programmatic.xml");
  });
});

describe("buildRobotsTxt", () => {
  it("allows all and advertises the sitemap", () => {
    const txt = buildRobotsTxt();
    expect(txt).toContain("User-agent: *");
    expect(txt).toContain("Allow: /");
    expect(txt).toContain("Sitemap: https://nexoristech.com/sitemap.xml");
  });
});

describe("buildLlmsTxt", () => {
  it("lists services, industries, and the contact path", () => {
    const txt = buildLlmsTxt({
      summary: "Nexoris Technologies designs and builds custom software.",
      services: [
        {
          name: "AI Product Development",
          path: "/ai-product-development",
          summary: "Custom software.",
        },
      ],
      industries: [{ name: "Fintech", path: "/fintech-software" }],
    });
    expect(txt).toContain("# Nexoris Technologies");
    expect(txt).toContain("https://nexoristech.com/ai-product-development/");
    expect(txt).toContain("https://nexoristech.com/fintech-software/");
    expect(txt).toContain("business@nexoristech.com");
    expect(txt).toContain("+2349138133224");
  });
});
