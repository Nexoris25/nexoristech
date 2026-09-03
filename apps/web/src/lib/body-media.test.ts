/**
 * Images placed in the rich text editor resolve against the media host.
 *
 * Every image on a page except the ones inside the body already went through mediaUrl: the cover,
 * the author's headshot, the case-study gallery. An image an editor places in the body is written
 * as `src="/uploads/….webp"` and the body was rendered untouched, so the browser resolved that path
 * against the website's own origin — where nothing is served — and every picture inside an article
 * was broken. The cover on the same article loaded, which is what made the upload look successful.
 */
import { describe, it, expect } from "vitest";
import { resolveBodyMedia } from "./cms.js";

const BASE = "https://media.nexoristech.com";

describe("resolveBodyMedia", () => {
  it("prefixes an upload path with the media base", () => {
    expect(resolveBodyMedia('<p><img src="/uploads/a.webp" alt="A chart"></p>', BASE)).toBe(
      '<p><img src="https://media.nexoristech.com/uploads/a.webp" alt="A chart"></p>',
    );
  });

  it("leaves an absolute URL alone", () => {
    const html = '<img src="https://example.com/a.png" alt="">';
    expect(resolveBodyMedia(html, BASE)).toBe(html);
  });

  it("leaves a data URI alone", () => {
    const html = '<img src="data:image/gif;base64,R0lGOD" alt="">';
    expect(resolveBodyMedia(html, BASE)).toBe(html);
  });

  it("rewrites every image in the body, not only the first", () => {
    const out = resolveBodyMedia('<img src="/uploads/a.webp"><p>x</p><img src="/uploads/b.webp">', BASE);
    expect(out.match(/media\.nexoristech\.com/g)).toHaveLength(2);
  });

  it("keeps the attributes around the source, including alt text", () => {
    const out = resolveBodyMedia('<img loading="lazy" src="/uploads/a.webp" alt="A bar chart" width="800">', BASE);
    expect(out).toContain('alt="A bar chart"');
    expect(out).toContain('width="800"');
    expect(out).toContain('loading="lazy"');
  });

  it("rewrites each candidate in a srcset and keeps its descriptor", () => {
    const out = resolveBodyMedia('<img srcset="/uploads/a.webp 1x, /uploads/b.webp 2x" src="/uploads/a.webp">', BASE);
    expect(out).toContain("https://media.nexoristech.com/uploads/a.webp 1x");
    expect(out).toContain("https://media.nexoristech.com/uploads/b.webp 2x");
  });

  it("changes nothing when no media base is configured", () => {
    // Local development serves uploads from the same origin, so the stored path is already correct.
    const html = '<img src="/uploads/a.webp">';
    expect(resolveBodyMedia(html, "")).toBe(html);
  });

  it("does not touch anything that is not an image", () => {
    const html = '<a href="/uploads/brief.pdf">The brief</a>';
    expect(resolveBodyMedia(html, BASE)).toBe(html);
  });
});

