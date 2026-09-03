/**
 * URL helpers for the Nexoris Technologies platform.
 *
 * The server appends a trailing slash to every page URL (Next.js trailingSlash: true). To keep
 * the SEO rules consistent, canonical, Open Graph, sitemap, and metadataBase URLs all use
 * the trailing-slash form for content pages, while the site root stays the bare origin
 * `https://nexoristech.com`, which has no path segment to slash (decision D-002). This keeps
 * og:url equal to the canonical on every page.
 */
import { SITE_ORIGIN } from "./constants.js";

/**
 * Normalise a path to its canonical form: a single leading slash, collapsed inner slashes, and
 * a trailing slash, except the root which is exactly "/". Any query string or hash is dropped,
 * since canonical URLs never carry them.
 */
export function toCanonicalPath(path: string): string {
  // Strip the origin if a full URL was passed.
  let p = path.trim();
  if (p.startsWith(SITE_ORIGIN)) {
    p = p.slice(SITE_ORIGIN.length);
  }
  // Drop query and hash.
  const queryIndex = p.search(/[?#]/);
  if (queryIndex !== -1) {
    p = p.slice(0, queryIndex);
  }
  // Ensure a single leading slash and collapse any repeated slashes.
  p = "/" + p.replace(/^\/+/, "");
  p = p.replace(/\/{2,}/g, "/");
  if (p === "/") {
    return "/";
  }
  // Ensure exactly one trailing slash.
  return p.endsWith("/") ? p : `${p}/`;
}

/**
 * Build an absolute canonical URL for a path. The root resolves to the bare origin with no
 * trailing slash; every other path resolves to the trailing-slash form.
 */
export function absoluteUrl(path: string): string {
  const canonical = toCanonicalPath(path);
  if (canonical === "/") {
    return SITE_ORIGIN;
  }
  return `${SITE_ORIGIN}${canonical}`;
}

/**
 * Resolve a value that may already be absolute. Absolute http(s) URLs (for example an
 * external profile, or media served from the VPS) are returned unchanged; everything else is
 * treated as a site path and made absolute.
 */
export function resolveUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  return absoluteUrl(value);
}

/**
 * An author's profile page.
 *
 * Authors sit at the site root — `/chinedu-nwogu`, not `/authors/chinedu-nwogu`. The schema builders
 * kept the old shape long after the pages moved, so every article's byline identified its author by
 * a URL that answers with a 308, and the Person on an article and the Person on that author's own
 * profile carried two different `@id`s. To anything reading the graph they were two people, which is
 * the opposite of what an author byline is for: one identity, cited consistently, is what lets a
 * search engine or an assistant attribute an article to a person it can look up.
 *
 * Defined here rather than in the site so the schema builders and the pages cannot disagree again.
 */
export function authorPath(slug: string): string {
  return `/${slug}`;
}

/** The retired path. Kept only for the permanent redirect that keeps published links working. */
export function legacyAuthorPath(slug: string): string {
  return `/authors/${slug}`;
}
