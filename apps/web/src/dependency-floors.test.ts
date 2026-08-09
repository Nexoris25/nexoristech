/**
 * Security floors for transitive dependencies we do not control directly.
 *
 * Two packages reach this repo only through a parent that pins them behind a known advisory:
 *
 *   sharp  — next declares `^0.34.5`, but 0.34.x inherits the libvips CVEs (CVE-2026-33327,
 *            -33328, -35590, -35591), fixed in sharp 0.35.0. sharp is what the Next image
 *            optimizer shells out to for every /_next/image request, so it runs in production.
 *   multer — @nestjs/platform-express pins exactly 2.0.2, which carries several denial-of-service
 *            advisories. Fixed in 2.2.0.
 *
 * Both are lifted by pnpm.overrides in the root package.json, which deliberately breaks the
 * parents' declared ranges. That is easy to undo by accident — a Next upgrade tempts you to drop
 * the sharp override as "no longer needed", and it would silently fall back to whatever next asks
 * for. This test fails if either override disappears or is weakened below the patched version.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

interface RootManifest {
  pnpm?: { overrides?: Record<string, string> };
}

const root = resolve(import.meta.dirname, "../../..");
const overrides = (
  JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as RootManifest
).pnpm?.overrides ?? {};

/** Lowest version that carries the fix, as major/minor/patch. */
const FLOORS: Record<string, [number, number, number]> = {
  sharp: [0, 35, 0],
  multer: [2, 2, 0],
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
      expect(range, `pnpm.overrides.${name} is missing from the root package.json`).toBeDefined();
      expect(
        atLeast(lowerBound(range as string), floor),
        `${name} override "${range}" is below the patched ${floor.join(".")}`,
      ).toBe(true);
    });
  }
});
