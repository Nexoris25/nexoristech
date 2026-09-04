/**
 * Which articles to recommend at the end of one.
 *
 * A reader who finishes a piece is the most engaged audience the site ever has, and the page simply
 * ended: no next step, nothing to carry them on. Three suggestions, ranked, is the whole feature.
 *
 * Ranked on what the content actually says rather than by asking a model at render time. These pages
 * are statically generated and revalidated on a timer, so one render serves many readers: a live call
 * would cost a request per rebuild, add latency to the build, and return something different each
 * time for the same article, which makes a recommendation impossible to reason about or test.
 *
 * The signals are the ones an editor would use:
 *
 *   * The same category. Two pieces filed under the same subject are about the same subject.
 *   * Words in common, weighted so a term in a title counts for more than one in a summary — a title
 *     states what a piece is about, a summary mentions things in passing.
 *   * The same author, as a tie-break and nothing more. Most of this site is written by one person,
 *     so a shared byline is true of nearly every pair and is evidence of nothing.
 *   * Recency, as the tie-break only. It decides between two equally relevant pieces and can never
 *     promote an unrelated new one over a related older one.
 *
 * An article with nothing in common is not recommended. Three weak suggestions are worse than one
 * good one, and worse than none.
 */
import type { InsightCard } from "./cms.js";

/** Words too common to say anything about what a piece is about. */
const STOP = new Set([
  "the", "and", "for", "with", "that", "this", "from", "your", "you", "our", "are", "was", "were",
  "how", "what", "why", "when", "which", "who", "will", "can", "does", "did", "has", "have", "had",
  "not", "but", "all", "any", "its", "it", "in", "on", "of", "to", "a", "an", "is", "be", "by", "or",
  "at", "as", "we", "us", "do", "if", "so", "than", "then", "them", "they", "their", "there", "here",
  "about", "into", "over", "more", "most", "some", "such", "only", "own", "same", "also", "just",
  "guide", "best", "top", "new", "using", "use", "used", "need", "needs", "way", "ways", "things",
  "nexoris", "technologies", "nigeria", "nigerian", "business", "businesses", "software", "company",
]);

/** The meaningful words in a piece of text, deduplicated. */
function terms(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/[\s-]+/)
      /*
       * A year is not a subject.
       *
       * Titles here carry a [year] token that expands on render, so nearly every article contains
       * "2026". Counted as a shared term it related everything to everything: a hospital software
       * guide was recommending a B2B personalisation piece because both mentioned the year.
       */
      .filter((w) => w.length > 3 && !STOP.has(w) && !/^\d+$/.test(w)),
  );
}

/** How many terms two sets share. */
function overlap(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const t of a) if (b.has(t)) n += 1;
  return n;
}

export interface RelatedSource {
  slug: string;
  title: string;
  excerpt?: string;
  category?: string;
  author?: string;
}

/**
 * The weights, named so the ranking can be read rather than decoded.
 *
 * A shared byline is worth almost nothing on purpose. Most of this site is written by one person, so
 * "same author" is true of nearly every pair and says nothing about whether two pieces belong
 * together. Left any higher it became a floor under everything: an article about hospital software
 * was recommending one about website pricing purely because the same person wrote both.
 */
const WEIGHT = {
  sameCategory: 6,
  sameAuthor: 1,
  titleTerm: 3,
  excerptTerm: 1,
} as const;

/** Below this an article is not related enough to recommend at all. */
export const MIN_RELEVANCE = 3;

export function scoreRelated(article: RelatedSource, candidate: RelatedSource): number {
  if (candidate.slug === article.slug) return 0;

  const titleTerms = terms(article.title);
  const bodyTerms = terms(`${article.title} ${article.excerpt ?? ""}`);
  const candTitle = terms(candidate.title);
  const candAll = terms(`${candidate.title} ${candidate.excerpt ?? ""}`);

  const sameCategory = Boolean(article.category && candidate.category && article.category === candidate.category);
  const sharedTitleTerms = overlap(titleTerms, candTitle);

  /*
   * Two pieces have to share a subject, not a byline.
   *
   * Either an editor filed them under the same category, or their titles have a real word in common.
   * Without this rule the incidental signals added up on their own and the section filled with three
   * unrelated articles, which is exactly what it exists to avoid.
   */
  if (!sameCategory && sharedTitleTerms === 0) return 0;

  let score = 0;
  if (sameCategory) score += WEIGHT.sameCategory;
  if (article.author && candidate.author && article.author === candidate.author) {
    score += WEIGHT.sameAuthor;
  }
  // A term shared between the two titles is the strongest textual signal there is.
  score += sharedTitleTerms * WEIGHT.titleTerm;
  // Then anything else the two pieces have in common, counted once and worth less.
  score += Math.max(0, overlap(bodyTerms, candAll) - sharedTitleTerms) * WEIGHT.excerptTerm;
  return score;
}

/**
 * The most relevant articles to read next, best first, never more than `limit`.
 *
 * Recency breaks a tie and nothing more, so a related older piece always outranks an unrelated new
 * one. Anything below the floor is dropped rather than padded in to reach three.
 */
export function pickRelated(article: RelatedSource, candidates: InsightCard[], limit = 3): InsightCard[] {
  return candidates
    .map((c) => ({
      card: c,
      score: scoreRelated(article, {
        slug: c.slug,
        title: c.title,
        ...(c.excerpt ? { excerpt: c.excerpt } : {}),
        ...(c.category ? { category: c.category } : {}),
        ...(c.author ? { author: c.author } : {}),
      }),
      at: c.publishedAt ? Date.parse(c.publishedAt) : 0,
    }))
    .filter((x) => x.score >= MIN_RELEVANCE)
    .sort((a, b) => b.score - a.score || b.at - a.at)
    .slice(0, limit)
    .map((x) => x.card);
}
