/**
 * JSON-LD helpers for the Nexoris Technologies platform.
 *
 * Builders are pure functions. The cardinal rule (PRD 9.2): omit any field whose real data
 * does not exist, so the site never emits fabricated structured data. `prune` enforces that by
 * removing undefined, null, and empty-array values from a node before it is emitted.
 */

/** A JSON-LD value. */
export type JsonLdValue =
  | string
  | number
  | boolean
  | JsonLdNode
  | JsonLdValue[]
  | undefined
  | null;

/** A JSON-LD node: an object with string keys. */
export interface JsonLdNode {
  [key: string]: JsonLdValue;
}

/**
 * Recursively remove undefined, null, and empty-array values so no empty or fabricated field
 * is emitted. Objects that become empty after pruning are removed from their parent.
 */
export function prune<T extends JsonLdValue>(value: T): T {
  if (Array.isArray(value)) {
    const cleaned = value
      .map((item) => prune(item))
      .filter((item) => item !== undefined && item !== null);
    return cleaned as unknown as T;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as JsonLdNode);
    const result: JsonLdNode = {};
    for (const [key, raw] of entries) {
      const cleaned = prune(raw);
      if (cleaned === undefined || cleaned === null) {
        continue;
      }
      if (Array.isArray(cleaned) && cleaned.length === 0) {
        continue;
      }
      if (
        typeof cleaned === "object" &&
        !Array.isArray(cleaned) &&
        Object.keys(cleaned).length === 0
      ) {
        continue;
      }
      result[key] = cleaned;
    }
    return result as unknown as T;
  }
  return value;
}

/** Wrap a set of nodes into a single JSON-LD @graph document, pruning each node. */
export function buildGraph(nodes: JsonLdNode[]): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@graph": nodes
      .map((node) => prune(node))
      .filter((node) => Object.keys(node).length > 0),
  };
}

/** Serialise a JSON-LD document for embedding in a script tag. */
export function serializeJsonLd(doc: JsonLdNode): string {
  // Escape the closing-script sequence so the JSON cannot break out of the script tag.
  return JSON.stringify(doc).replace(/</g, "\\u003c");
}
