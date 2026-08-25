import { describe, expect, it } from "vitest";
import { buildMetadata, ensureBrandSuffix, validateMeta } from "./metadata.js";
import { ORGANISATION } from "./constants.js";
import { absoluteUrl } from "./url.js";

// The approved Home meta description, verbatim from the Website Copy (155 to 160 chars).
const goodDescription =
  "We design and build websites, apps, dashboards, and custom business software for companies across Nigeria and abroad. Tell us the problem, and we will solve it.";

describe("ensureBrandSuffix", () => {
  it("appends the brand when absent", () => {
    expect(ensureBrandSuffix("About us")).toBe(
      "About us | Nexoris Technologies",
    );
  });

  it("is idempotent when the brand is already present", () => {
    expect(ensureBrandSuffix("About us | Nexoris Technologies")).toBe(
      "About us | Nexoris Technologies",
    );
  });

  it("accepts the brand alone", () => {
    expect(ensureBrandSuffix("Nexoris Technologies")).toBe(
      "Nexoris Technologies",
    );
  });
});

describe("validateMeta", () => {
  it("passes a compliant title and description", () => {
    const title =
      "Software Development Company in Lagos | Nexoris Technologies";
    expect(validateMeta(title, goodDescription)).toEqual([]);
  });

  it("flags a title over 60 characters", () => {
    const longTitle =
      "A very long marketing title that simply will not fit the limit at all";
    const issues = validateMeta(longTitle, goodDescription);
    expect(issues.some((i) => i.rule === "title-max")).toBe(true);
  });

  it("flags a description over the hard maximum", () => {
    const tooLong = "x".repeat(161);
    const issues = validateMeta("About | Nexoris Technologies", tooLong);
    expect(issues.some((i) => i.rule === "description-max")).toBe(true);
  });

  it("flags a description under the soft minimum", () => {
    const issues = validateMeta("About | Nexoris Technologies", "Too short.");
    expect(issues.some((i) => i.rule === "description-min")).toBe(true);
  });
});

describe("buildMetadata", () => {
  it("builds compliant metadata for a content page", () => {
    const meta = buildMetadata({
      title: "About Nexoris Technologies",
      description: goodDescription,
      path: "/about",
    });
    expect(meta.title).toBe(
      "About Nexoris Technologies | Nexoris Technologies",
    );
    expect(meta.alternates.canonical).toBe("https://nexoristech.com/about/");
    // og:url must equal the canonical (check:seo rule).
    expect(meta.openGraph.url).toBe(meta.alternates.canonical);
    expect(meta.openGraph.locale).toBe("en_NG");
    expect(meta.twitter.card).toBe("summary_large_image");
    expect(meta.robots.index).toBe(true);
  });

  it("attributes the X card to the company account", () => {
    // twitter:card alone was already correct, but validators report the card as incomplete without
    // twitter:site, which is why it read as broken. The handle is derived from the profile in
    // sameAs, so a change there cannot leave the card pointing at a stale account.
    const meta = buildMetadata({ title: "About Nexoris Technologies", description: goodDescription, path: "/about" });
    expect(meta.twitter.site).toBe("@Nexoristech");
    expect(meta.twitter.creator).toBe(meta.twitter.site);
    expect(ORGANISATION.sameAs).toContain(`https://x.com/${meta.twitter.site.slice(1)}`);
  });

  it("uses the bare origin as the home canonical", () => {
    const meta = buildMetadata({
      title: "Software Development Company in Lagos | Nexoris Technologies",
      description: goodDescription,
      path: "/",
    });
    expect(meta.alternates.canonical).toBe("https://nexoristech.com");
    expect(meta.openGraph.images[0]?.url).toBe(
      "https://nexoristech.com/opengraph-image",
    );
  });

  it("marks a noindex page correctly", () => {
    const meta = buildMetadata({
      title: "Draft | Nexoris Technologies",
      description: goodDescription,
      path: "/draft-page",
      noindex: true,
    });
    expect(meta.robots.index).toBe(false);
    expect(meta.robots.googleBot.index).toBe(false);
  });

  it("throws when a title breaks the hard limit", () => {
    expect(() =>
      buildMetadata({
        title:
          "An overly long title that will exceed the sixty character maximum without question",
        description: goodDescription,
        path: "/x",
      }),
    ).toThrow();
  });
});

/**
 * The canonical is the page's own URL, always.
 *
 * There is no input that can point it somewhere else: buildMetadata derives it from `path` and every
 * page in the site emits its metadata through this one function. These pin that, so a future
 * "canonicalOverride" cannot be added without a test failing and someone deciding deliberately.
 */
describe("canonical URL", () => {
  const description = goodDescription;

  it("is the page's own absolute URL", () => {
    for (const path of ["/about", "/insights/some-article", "/authors/chinedu-nwogu", "/case-studies/a-study"]) {
      const meta = buildMetadata({ title: "A page", description, path });
      expect(meta.alternates.canonical, path).toBe(absoluteUrl(path));
    }
  });

  it("matches og:url, which the SEO gate also asserts", () => {
    const meta = buildMetadata({ title: "A page", description, path: "/insights/some-article" });
    expect(meta.openGraph.url).toBe(meta.alternates.canonical);
  });

  it("stays the page URL even when the page is noindexed", () => {
    // A noindexed page still declares where it lives; the two are unrelated.
    const meta = buildMetadata({ title: "A page", description, path: "/draft", noindex: true });
    expect(meta.alternates.canonical).toBe(absoluteUrl("/draft"));
    expect(meta.robots.index).toBe(false);
  });

  it("cannot be overridden by an unexpected input", () => {
    const meta = buildMetadata(
      { title: "A page", description, path: "/about", canonical: "https://example.test/elsewhere" } as never,
    );
    expect(meta.alternates.canonical).toBe(absoluteUrl("/about"));
  });
});
