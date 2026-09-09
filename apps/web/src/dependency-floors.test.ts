/**
 * Security floors for transitive dependencies we do not control directly.
 *
 * These packages reach the repo only through a parent that pins them behind a known advisory, and
 * cannot be fixed by upgrading that parent. Each is lifted by an entry under `overrides:` in
 * pnpm-workspace.yaml, which deliberately breaks the parent's declared range.
 *
 * They lived in the root package.json's `pnpm` field until the upgrade to pnpm 12, which stopped
 * reading that field — it warns and carries on, so the pins would have vanished from the install
 * with nothing failing. This test is what caught the move, which is the entire reason it exists.
 *
 * The two that run in production are worth naming:
 *
 *   sharp  — next declares `^0.34.5`, but 0.34.x inherits the libvips CVEs (CVE-2026-33327,
 *            -33328, -35590, -35591), fixed in 0.35.0. sharp is what the Next image optimizer
 *            calls for every /_next/image request.
 *   multer — @nestjs/platform-express pinned it exactly, and versions below 2.2.0 carry five
 *            denial-of-service advisories.
 *
 * The rest are build- or development-time, but a vulnerable build tool still reads this repo's
 * source, so they are held to the same floors.
 *
 * Overrides are easy to undo by accident — a Next upgrade tempts you to drop the sharp override as
 * "no longer needed", and it would silently fall back to whatever next asks for. This test fails if
 * any override disappears or is weakened below its patched version. Version-scoped keys such as
 * `js-yaml@3` are checked under their own name, because the 3.x and 4.x lines were patched
 * separately and forcing one onto the other would be a breaking change rather than a fix.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../../..");

/**
 * The `overrides:` block of pnpm-workspace.yaml, as a plain map.
 *
 * Read with a small parser rather than a YAML dependency: the block is a flat map of string to
 * string, and this test's job is to notice an entry being deleted or weakened, which does not need
 * a general parser. Keys and values may be quoted — `"@types/react"` must be, and version ranges
 * beginning with `^` must be — so quotes are stripped from both.
 */
function readOverrides(): Record<string, string> {
  const yaml = readFileSync(resolve(root, "pnpm-workspace.yaml"), "utf8");
  const out: Record<string, string> = {};
  let inBlock = false;
  for (const line of yaml.split(/\r?\n/)) {
    if (/^overrides:\s*$/.test(line)) {
      inBlock = true;
      continue;
    }
    if (!inBlock) continue;
    // The block ends at the next line that starts in column zero and is not a comment.
    if (/^\S/.test(line)) break;
    const m = /^\s+(?:"([^"]+)"|'([^']+)'|([^\s:#]+))\s*:\s*(?:"([^"]*)"|'([^']*)'|(\S+))\s*$/.exec(line);
    if (!m) continue;
    const key = m[1] ?? m[2] ?? m[3];
    const value = m[4] ?? m[5] ?? m[6];
    if (key !== undefined && value !== undefined) out[key] = value;
  }
  return out;
}

const overrides = readOverrides();

/** Lowest version that carries the fix, as major/minor/patch. */
const FLOORS: Record<string, [number, number, number]> = {
  // Production runtime.
  sharp: [0, 35, 0],
  multer: [2, 2, 0],
  // Build and development toolchains.
  postcss: [8, 5, 23],
  nanoid: [3, 3, 17],
  esbuild: [0, 25, 0],
  vite: [6, 4, 3],
  qs: [6, 15, 2],
  "body-parser": [1, 20, 6],
  tmp: [0, 2, 6],
  cookie: [0, 7, 0],
  "ip-address": [10, 3, 1],
  uuid: [11, 1, 1],
  playwright: [1, 55, 1],
  "@playwright/test": [1, 55, 1],
  "@eslint/plugin-kit": [0, 3, 4],
  // Patched separately per major line.
  "brace-expansion@1": [1, 1, 18],
  "brace-expansion@2": [2, 1, 4],
  "js-yaml@3": [3, 15, 1],
  "js-yaml@4": [4, 3, 1],
  "path-to-regexp@0.1": [0, 1, 13],
};

/** Parse the numeric floor out of a range like "^0.35.3". */
function lowerBound(range: string): [number, number, number] {
  const parts = range.replace(/^[^\d]*/, "").split(".").map(Number);
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

const atLeast = (got: [number, number, number], want: [number, number, number]): boolean => {
  for (let i = 0; i < 3; i++) {
    if ((got[i] ?? 0) !== (want[i] ?? 0)) return (got[i] ?? 0) > (want[i] ?? 0);
  }
  return true;
};

describe("pnpm overrides keep patched versions of pinned transitive dependencies", () => {
  for (const [name, floor] of Object.entries(FLOORS)) {
    it(`pins ${name} at or above ${floor.join(".")}`, () => {
      const range = overrides[name];
      expect(range, `overrides.${name} is missing from pnpm-workspace.yaml`).toBeDefined();
      expect(
        atLeast(lowerBound(range as string), floor),
        `${name} override "${range}" is below the patched ${floor.join(".")}`,
      ).toBe(true);
    });
  }
});
