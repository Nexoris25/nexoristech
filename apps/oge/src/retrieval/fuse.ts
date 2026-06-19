/**
 * Reciprocal rank fusion for hybrid retrieval (PRD 10.4). Vector search and keyword search each
 * return a ranked list; this merges them into one ranking without needing the two scores to be on
 * the same scale. An item's fused score is the sum over the lists it appears in of 1/(k + rank),
 * so an item ranked highly by either retriever rises, and one ranked by both rises further. This
 * is pure and deterministic, so it is unit tested directly.
 */

/** The conventional RRF constant; larger values flatten the contribution of top ranks. */
export const DEFAULT_RRF_K = 60;

export interface FusedResult<T> {
  readonly item: T;
  readonly score: number;
}

/**
 * Fuse several ranked lists into one. `keyOf` identifies the same underlying item across lists
 * (so a chunk found by both retrievers is merged, not duplicated). The first-seen item for a key
 * is kept. Results are sorted by fused score, highest first.
 */
export function reciprocalRankFusion<T>(
  lists: readonly (readonly T[])[],
  keyOf: (item: T) => string,
  k: number = DEFAULT_RRF_K,
): FusedResult<T>[] {
  const scores = new Map<string, number>();
  const firstSeen = new Map<string, T>();

  for (const list of lists) {
    list.forEach((item, index) => {
      const key = keyOf(item);
      scores.set(key, (scores.get(key) ?? 0) + 1 / (k + index + 1));
      if (!firstSeen.has(key)) firstSeen.set(key, item);
    });
  }

  return [...scores.entries()]
    .map(([key, score]) => ({ item: firstSeen.get(key) as T, score }))
    .sort((a, b) => b.score - a.score);
}
