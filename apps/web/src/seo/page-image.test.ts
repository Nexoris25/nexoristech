/**
 * The share card for a page is the page's own photograph.
 *
 * The images live in the view components and the metadata is built before any of them render, so
 * `pageImage` bridges the two with a hand-maintained map. A map like that rots silently: an image
 * gets renamed in a view, the card keeps pointing at the old path, and nothing complains until
 * somebody shares the page and gets a blank rectangle. So every path it can return is checked
 * against the files actually on disk.
 */
import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { pageImage, metadataForPage } from "./page-seo.js";
import { allHardcodedPages as pages } from "../content/index.js";

const PUBLIC_DIR = join(process.cwd(), "public");

describe("pageImage", () => {
  const withImages = pages.map((p) => [p.meta.slug, pageImage(p)] as const).filter(([, i]) => i);

  it("finds an image for the pages that show one", () => {
    const slugs = withImages.map(([s]) => s);
    expect(slugs).toContain("/");
    expect(slugs).toContain("/about");
    // Every ported service page opens with its hero photograph.
    expect(slugs).toContain("/ai-ecommerce-development");
  });

  for (const [slug, image] of withImages) {
    it(`points ${slug} at a file that exists`, () => {
      expect(existsSync(join(PUBLIC_DIR, image!.src))).toBe(true);
    });

    it(`gives ${slug} alt text`, () => {
      expect(image!.alt.trim().length).toBeGreaterThan(0);
    });
  }
});

describe("metadataForPage", () => {
  it("uses the page's own image as the card when it has one", () => {
    const home = pages.find((p) => p.meta.slug === "/")!;
    const image = metadataForPage(home).openGraph?.images?.[0] as { url: string } | undefined;
    expect(image?.url).toContain("/home-hero.webp");
  });

  it("falls back to the branded card for a page with no photograph", () => {
    // The legal and contact pages are type from top to bottom; borrowing an unrelated photograph
    // would misrepresent them, so the generated card is the right answer.
    const contact = pages.find((p) => p.meta.slug === "/contact");
    if (!contact) return;
    const image = metadataForPage(contact).openGraph?.images?.[0] as { url: string } | undefined;
    expect(image?.url).toContain("/api/og/");
  });
});
