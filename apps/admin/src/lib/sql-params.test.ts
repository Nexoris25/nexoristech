/**
 * Every SQL statement must use a complete run of parameters, $1 through $max.
 *
 * The insight update read `schema_type=$23 ... WHERE id=$24` while supplying 23 values, and never
 * referenced $22 at all. Postgres cannot infer a type for a parameter nothing uses, so the query
 * failed with "could not determine data type of parameter $22" on every single update. The route
 * handler threw, answered 500 with no body, and the editor saw a blank screen. Nothing in the type
 * system or the test suite could see it, because the SQL is a string.
 *
 * A gap in the sequence is the signature of exactly that mistake: a placeholder edited without the
 * rest being renumbered, which silently shifts a column into the wrong slot or leaves the WHERE
 * clause bound to nothing. This walks the source and fails on any gap.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

/** The app's src directory: this file lives in src/lib. */
const SRC = resolve(import.meta.dirname, "..");

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(p, out);
    else if (/\.tsx?$/.test(entry.name) && !/\.test\./.test(entry.name)) out.push(p);
  }
  return out;
}

interface Gap { file: string; line: number; max: number; missing: number[]; preview: string }

function gapsIn(file: string): Gap[] {
  const src = readFileSync(file, "utf8");
  const found: Gap[] = [];
  // SQL in this codebase always lives in a template literal.
  for (const m of src.matchAll(/`([^`]*)`/g)) {
    const sql = m[1] ?? "";
    if (!/\$\d/.test(sql)) continue;
    if (!/\b(SELECT|INSERT|UPDATE|DELETE)\b/i.test(sql)) continue;

    const used = new Set([...sql.matchAll(/\$(\d+)/g)].map((x) => Number(x[1])));
    const max = Math.max(...used);
    const missing: number[] = [];
    for (let i = 1; i <= max; i++) if (!used.has(i)) missing.push(i);
    if (missing.length === 0) continue;

    found.push({
      file: file.slice(SRC.length + 1).split("\\").join("/"),
      line: src.slice(0, m.index).split("\n").length,
      max,
      missing,
      preview: sql.replace(/\s+/g, " ").trim().slice(0, 80),
    });
  }
  return found;
}

describe("SQL parameter numbering", () => {
  const files = sourceFiles(SRC);

  it("finds statements to check, so it cannot pass vacuously", () => {
    const withSql = files.filter((f) => /\$\d/.test(readFileSync(f, "utf8")));
    expect(withSql.length).toBeGreaterThan(10);
  });

  it("has no gaps in any parameter sequence", () => {
    const gaps = files.flatMap(gapsIn);
    const report = gaps
      .map((g) => `${g.file}:${g.line} uses up to $${g.max} but never $${g.missing.join(", $")}\n    ${g.preview}`)
      .join("\n");
    expect(gaps, `\n${report}\n`).toEqual([]);
  });

  it("would catch the numbering that caused the blank screen", () => {
    // The shape of the original bug, so the detector itself is proven to work.
    const broken = "UPDATE t SET a=$1, b=$20, c=$23 WHERE id=$24";
    const used = new Set([...broken.matchAll(/\$(\d+)/g)].map((x) => Number(x[1])));
    const missing = [...Array(Math.max(...used)).keys()].map((i) => i + 1).filter((n) => !used.has(n));
    expect(missing).toContain(22);
  });
});
