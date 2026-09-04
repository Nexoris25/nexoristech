/**
 * What gets recommended at the end of an article.
 *
 * The page simply ended: the most engaged reader the site has reached the bottom and was offered
 * nothing. These rules decide what to offer, and the one that matters most is the refusal — three
 * weak suggestions are worse than one good one, and worse than none.
 */
import { describe, it, expect } from "vitest";
import { pickRelated, scoreRelated, MIN_RELEVANCE } from "./related.js";
import type { InsightCard } from "./cms.js";

const card = (over: Partial<InsightCard> & { slug: string; title: string }): InsightCard => ({
  excerpt: "",
  ...over,
});

const article = {
  slug: "hospital-management-system-nigeria",
  title: "Hospital Management System in Nigeria",
  excerpt: "Electronic records, billing and compliance for Nigerian clinics.",
  category: "Healthcare",
  author: "Chinedu Nwogu",
};

describe("scoreRelated", () => {
  it("never recommends the article to itself", () => {
    expect(scoreRelated(article, { ...article })).toBe(0);
  });

  it("rates a piece in the same category above an unrelated one", () => {
    const sameCat = scoreRelated(article, { slug: "a", title: "Choosing clinic software", category: "Healthcare" });
    const other = scoreRelated(article, { slug: "b", title: "Choosing clinic software", category: "Fintech" });
    expect(sameCat).toBeGreaterThan(other);
  });

  it("counts a word shared between titles for more than one shared only in a summary", () => {
    const inTitle = scoreRelated(article, { slug: "a", title: "Hospital billing systems" });
    const inExcerpt = scoreRelated(article, { slug: "b", title: "A different subject", excerpt: "Hospital billing systems" });
    expect(inTitle).toBeGreaterThan(inExcerpt);
  });

  it("ignores words that say nothing about the subject", () => {
    // Every article on this site could match on these; matching on them is not relevance.
    expect(scoreRelated(article, { slug: "a", title: "The best software for your business in Nigeria" }))
      .toBeLessThan(MIN_RELEVANCE);
  });
});

describe("pickRelated", () => {
  const candidates = [
    card({ slug: "hospital-management-system-nigeria", title: "Hospital Management System in Nigeria", category: "Healthcare" }),
    card({ slug: "clinic-billing", title: "Hospital billing and claims", category: "Healthcare", publishedAt: "2026-01-01T00:00:00.000Z" }),
    card({ slug: "records", title: "Electronic medical records explained", category: "Healthcare", publishedAt: "2026-02-01T00:00:00.000Z" }),
    card({ slug: "ndpa", title: "Hospital data and NDPA compliance", category: "Healthcare", publishedAt: "2026-03-01T00:00:00.000Z" }),
    card({ slug: "restaurant", title: "Restaurant POS systems", category: "Hospitality", publishedAt: "2026-09-01T00:00:00.000Z" }),
  ];

  it("never returns more than three", () => {
    expect(pickRelated(article, candidates, 3).length).toBeLessThanOrEqual(3);
  });

  it("leaves the article itself out", () => {
    expect(pickRelated(article, candidates, 3).map((c) => c.slug)).not.toContain(article.slug);
  });

  it("drops what is not related rather than padding the row out", () => {
    const thin = [
      card({ slug: "restaurant", title: "Restaurant POS systems", category: "Hospitality" }),
      card({ slug: "fleet", title: "Fleet tracking for haulage", category: "Logistics" }),
    ];
    expect(pickRelated(article, thin, 3)).toEqual([]);
  });

  it("puts the most relevant first", () => {
    const picked = pickRelated(article, candidates, 3);
    expect(picked[0]?.slug).toBe("ndpa");
  });

  it("uses recency only to break a tie, never to promote something unrelated", () => {
    // The restaurant piece is the newest by months and shares nothing; it must not appear.
    expect(pickRelated(article, candidates, 3).map((c) => c.slug)).not.toContain("restaurant");
  });

  it("returns nothing at all when there is nothing to recommend", () => {
    expect(pickRelated(article, [], 3)).toEqual([]);
  });
});

/**
 * A shared byline is not a subject.
 *
 * Almost everything on this site is written by one person, so "same author" is true of nearly every
 * pair. Counted as relevance it became a floor under everything: an article about hospital software
 * recommended one about website pricing, because the same person wrote both and one incidental word
 * appeared in each summary.
 */
describe("relatedness needs a shared subject", () => {
  it("does not relate two pieces that share only their author", () => {
    expect(
      scoreRelated(article, {
        slug: "pricing",
        title: "How much a website costs",
        category: "Software and Digital Products",
        author: "Chinedu Nwogu",
      }),
    ).toBe(0);
  });

  it("relates two pieces filed under the same category", () => {
    expect(
      scoreRelated(article, { slug: "cyber", title: "Lagos cybersecurity guidelines", category: "Healthcare" }),
    ).toBeGreaterThanOrEqual(MIN_RELEVANCE);
  });

  it("relates two pieces whose titles share a real word, across categories", () => {
    expect(
      scoreRelated(article, { slug: "beds", title: "Hospital bed management", category: "Operations" }),
    ).toBeGreaterThanOrEqual(MIN_RELEVANCE);
  });

  it("shows nothing rather than three unrelated pieces", () => {
    const unrelated = [
      card({ slug: "pricing", title: "How much a website costs", category: "Software", author: "Chinedu Nwogu" }),
      card({ slug: "ai-roi", title: "AI personalization ROI for B2B content", category: "AI", author: "Chinedu Nwogu" }),
      card({ slug: "companies", title: "Best development companies ranked", category: "Software", author: "Chinedu Nwogu" }),
    ];
    expect(pickRelated(article, unrelated, 3)).toEqual([]);
  });
});
