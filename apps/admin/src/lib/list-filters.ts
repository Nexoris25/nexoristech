/**
 * Server-side filtering for CMS list screens.
 *
 * This lives apart from the ListFilters component on purpose. That component is `"use client"`, and
 * everything exported from a client module is a client export — calling this from a server component
 * fails at runtime with "attempted to call filterClause() from the server". The SQL builder belongs to
 * the server; only the control belongs to the browser.
 */

export type FilterMode = "eq" | "ilike";

export interface ListFilter {
  /** Fully-qualified column, e.g. "c.title". Never taken from user input. */
  column: string;
  value: string | undefined;
  mode: FilterMode;
}

/**
 * Build the WHERE fragment and parameters for a filtered list.
 *
 * Returns SQL with positional placeholders starting at `startAt`, so the caller can append its own
 * LIMIT/OFFSET afterwards. Values are always bound as parameters — the column name is the only part
 * that reaches the statement directly, and it comes from the call site rather than the request.
 */
export function filterClause(
  filters: ListFilter[],
  startAt = 1,
): { sql: string; values: string[] } {
  const parts: string[] = [];
  const values: string[] = [];
  let i = startAt;

  for (const f of filters) {
    const v = (f.value ?? "").trim();
    if (!v) continue;
    if (f.mode === "ilike") {
      parts.push(`${f.column} ILIKE $${i}`);
      // Escape the LIKE wildcards so a search for "50%" looks for "50%" rather than matching anything.
      values.push(`%${v.replace(/[\\%_]/g, (c) => `\\${c}`)}%`);
    } else {
      parts.push(`${f.column} = $${i}`);
      values.push(v);
    }
    i += 1;
  }

  return { sql: parts.length ? ` AND ${parts.join(" AND ")}` : "", values };
}
