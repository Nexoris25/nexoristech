/**
 * The list-filter SQL builder.
 *
 * This composes SQL from request input, so the properties that matter are that values are always
 * bound as parameters, that placeholder numbering stays consistent with what the caller appends
 * afterwards, and that an absent filter contributes nothing at all.
 */
import { describe, it, expect } from "vitest";
import { filterClause } from "./list-filters.js";

describe("filterClause", () => {
  it("contributes nothing when no filter has a value", () => {
    expect(filterClause([{ column: "c.title", value: undefined, mode: "ilike" }])).toEqual({ sql: "", values: [] });
    expect(filterClause([{ column: "c.status", value: "", mode: "eq" }])).toEqual({ sql: "", values: [] });
    // Whitespace is not a filter.
    expect(filterClause([{ column: "c.status", value: "   ", mode: "eq" }])).toEqual({ sql: "", values: [] });
  });

  it("binds values as parameters rather than inlining them", () => {
    const { sql, values } = filterClause([{ column: "c.status", value: "published", mode: "eq" }]);
    expect(sql).toBe(" AND c.status = $1");
    expect(sql).not.toContain("published");
    expect(values).toEqual(["published"]);
  });

  it("numbers placeholders from the offset the caller gives it", () => {
    // The caller appends LIMIT/OFFSET after these, so the numbering has to continue predictably.
    const { sql } = filterClause(
      [{ column: "c.title", value: "ai", mode: "ilike" }, { column: "c.status", value: "draft", mode: "eq" }],
      3,
    );
    expect(sql).toBe(" AND c.title ILIKE $3 AND c.status = $4");
  });

  it("skips absent filters without leaving a gap in the numbering", () => {
    const { sql, values } = filterClause([
      { column: "c.title", value: undefined, mode: "ilike" },
      { column: "c.status", value: "draft", mode: "eq" },
    ]);
    expect(sql).toBe(" AND c.status = $1");
    expect(values).toEqual(["draft"]);
  });

  it("wraps a search term for ILIKE", () => {
    expect(filterClause([{ column: "c.title", value: "payments", mode: "ilike" }]).values).toEqual(["%payments%"]);
  });

  it("escapes LIKE wildcards so a literal % or _ is searched for, not matched with", () => {
    // Searching "50%" should find "50%", not every row.
    expect(filterClause([{ column: "c.title", value: "50%", mode: "ilike" }]).values).toEqual(["%50\\%%"]);
    expect(filterClause([{ column: "c.title", value: "a_b", mode: "ilike" }]).values).toEqual(["%a\\_b%"]);
  });

  it("joins several active filters with AND", () => {
    const { sql, values } = filterClause([
      { column: "c.title", value: "ai", mode: "ilike" },
      { column: "c.status", value: "published", mode: "eq" },
    ]);
    expect(sql).toBe(" AND c.title ILIKE $1 AND c.status = $2");
    expect(values).toEqual(["%ai%", "published"]);
  });
});
