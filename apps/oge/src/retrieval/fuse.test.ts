import { describe, it, expect } from "vitest";
import { reciprocalRankFusion, DEFAULT_RRF_K } from "./fuse.js";

interface Doc {
  id: string;
}

const id = (d: Doc): string => d.id;

describe("reciprocalRankFusion", () => {
  it("merges an item found by both lists and ranks it above singletons", () => {
    const vector: Doc[] = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const keyword: Doc[] = [{ id: "b" }, { id: "d" }];

    const fused = reciprocalRankFusion([vector, keyword], id);
    // b appears in both lists, so it should win.
    expect(fused[0]?.item.id).toBe("b");
    // No duplicates: four distinct ids across the two lists.
    expect(fused.map((f) => f.item.id).sort()).toEqual(["a", "b", "c", "d"]);
  });

  it("scores by reciprocal rank with the documented constant", () => {
    const list: Doc[] = [{ id: "x" }, { id: "y" }];
    const fused = reciprocalRankFusion([list], id);
    expect(fused[0]?.score).toBeCloseTo(1 / (DEFAULT_RRF_K + 1), 10);
    expect(fused[1]?.score).toBeCloseTo(1 / (DEFAULT_RRF_K + 2), 10);
  });

  it("keeps the first-seen item for a key and orders by fused score", () => {
    const a1 = { id: "a", from: "vector" };
    const a2 = { id: "a", from: "keyword" };
    const fused = reciprocalRankFusion(
      [
        [a1, { id: "b", from: "vector" }],
        [a2],
      ],
      (d) => d.id,
    );
    const a = fused.find((f) => f.item.id === "a");
    expect(a?.item.from).toBe("vector"); // first seen wins
    expect(fused[0]?.item.id).toBe("a"); // a was in both, so it leads
  });

  it("returns an empty ranking for no input", () => {
    expect(reciprocalRankFusion<Doc>([], id)).toEqual([]);
  });
});
