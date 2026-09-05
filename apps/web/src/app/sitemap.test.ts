import { it, expect, vi } from "vitest";
vi.mock("../lib/cms.js", () => ({
  getAuthorSlugs: async () => ["sample-author", "about"],
  getDiscoveryEntries: async () => [{path:"/insights/a-guide", title:"A guide", kind:"insight", updatedAt:"2026-09-01T10:00:00.000Z"}],
}));
import sitemap from "./sitemap.js";
it("includes Oge, published CMS routes and author profiles exactly once with real modification dates", async () => {
  const entries = await sitemap();
  const urls = entries.map(e => e.url);
  expect(urls).toContain("https://nexoristech.com/oge/");
  expect(urls).toContain("https://nexoristech.com/sample-author/");
  expect(new Set(urls).size).toBe(urls.length);
  expect(entries.find(e=>e.url.endsWith("/insights/a-guide/"))?.lastModified).toBe("2026-09-01T10:00:00.000Z");
  expect(urls.some(u => u.includes("/404") || u.includes("/api/") || /case-studies\/.+/.test(u))).toBe(false);
});
