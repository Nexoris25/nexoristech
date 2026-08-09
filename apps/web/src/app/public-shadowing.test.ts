/**
 * A file in public/ is served ahead of an app route of the same path, silently and with no build
 * warning. Several of this site's machine-readable endpoints are routes precisely so they stay
 * current: llms.txt builds its Insights section from published CMS content, and the sitemap is
 * generated from the CMS slugs at request time. Dropping a static file of the same name into
 * public/ would freeze each of them at whatever was true when the file was written, which is
 * exactly the failure that `scripts/gen-static-seo.ts` used to cause for llms.txt.
 *
 * This test fails if any route under src/app is shadowed by a public/ file of the same name.
 */
import { describe, it, expect } from "vitest";
import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const appDir = resolve(import.meta.dirname);
const publicDir = resolve(import.meta.dirname, "../../public");

/** Route directories whose name is a literal file path, e.g. `llms.txt/route.ts`. */
function fileNamedRoutes(): string[] {
  return readdirSync(appDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.includes("."))
    .filter((e) => existsSync(resolve(appDir, e.name, "route.ts")))
    .map((e) => e.name);
}

describe("public/ does not shadow an app route", () => {
  it("finds the file-named routes it is meant to protect", () => {
    // Guards the test itself: if the discovery stops finding anything, it would pass vacuously.
    expect(fileNamedRoutes()).toContain("llms.txt");
  });

  it("has no public/ file matching a route path", () => {
    for (const name of fileNamedRoutes()) {
      expect(existsSync(resolve(publicDir, name)), `public/${name} shadows the /${name} route`).toBe(false);
    }
  });
});
