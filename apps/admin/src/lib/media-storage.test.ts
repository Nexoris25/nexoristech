/**
 * Where media is stored, and what may be read out of it.
 *
 * Two things are pinned here. The first is that MEDIA_STORAGE_PATH decides the directory, because
 * the alternative — media inside the application folder — is what destroyed every uploaded file on
 * the first VPS deployment: the deploy replaced the directory, the cms_media rows survived, and the
 * library went on describing files that no longer existed.
 *
 * The second is the file-name guard. It mattered less when the directory was under `public`, where
 * everything was already published. Now that it is somewhere else on the server, a name that escaped
 * it would be reading a path nobody meant to expose, so the accepted shape is stated and tested
 * rather than assumed.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { join } from "node:path";
import { mediaDir, mediaIsExternal, mediaFilePath, mediaUrlFor, fileNameFromMediaUrl } from "./media-storage.js";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("mediaDir", () => {
  it("uses MEDIA_STORAGE_PATH when it is set", () => {
    vi.stubEnv("MEDIA_STORAGE_PATH", "/media/nexoris");
    expect(mediaDir()).toBe("/media/nexoris");
    expect(mediaIsExternal()).toBe(true);
  });

  it("drops a trailing separator, so joins do not double it", () => {
    vi.stubEnv("MEDIA_STORAGE_PATH", "/media/nexoris/");
    expect(mediaDir()).toBe("/media/nexoris");
  });

  it("falls back to the directory inside the app when nothing is configured", () => {
    vi.stubEnv("MEDIA_STORAGE_PATH", "");
    expect(mediaDir()).toMatch(/uploads$/);
    expect(mediaIsExternal()).toBe(false);
  });
});

describe("mediaFilePath", () => {
  it("resolves a stored file inside the configured directory", () => {
    vi.stubEnv("MEDIA_STORAGE_PATH", "/media/nexoris");
    expect(mediaFilePath("9cbc2d40-5cb0-46e8-be23-f42706ae1c9e.webp"))
      .toBe(join("/media/nexoris", "9cbc2d40-5cb0-46e8-be23-f42706ae1c9e.webp"));
  });

  it.each([
    "../package.json",
    "../../etc/passwd",
    "sub/dir.webp",
    "..",
    ".hidden",
    "",
  ])("refuses %o", (name) => {
    vi.stubEnv("MEDIA_STORAGE_PATH", "/media/nexoris");
    expect(mediaFilePath(name)).toBeNull();
  });
});

describe("public URLs", () => {
  /*
   * The address is deliberately unchanged by any of this. Every cms_media row, every featured_image
   * column and every published article already holds `/uploads/…`, so moving the directory must not
   * mean rewriting stored data.
   */
  it("addresses a stored file as /uploads/<name> wherever the directory is", () => {
    vi.stubEnv("MEDIA_STORAGE_PATH", "/media/nexoris");
    expect(mediaUrlFor("abc.webp")).toBe("/uploads/abc.webp");
  });

  it("reads the file name back out of one of our URLs", () => {
    expect(fileNameFromMediaUrl("/uploads/abc.webp")).toBe("abc.webp");
  });

  it.each(["/other/abc.webp", "https://example.com/uploads/abc.webp", "/uploads/", "/uploads/a/b.webp"])(
    "returns null for %o",
    (url) => {
      expect(fileNameFromMediaUrl(url)).toBeNull();
    },
  );
});
