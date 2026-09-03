/**
 * Absolute URL for a media file.
 *
 * `absoluteUrl` prefixes the site origin unconditionally, which is right for a page path and wrong
 * for media: uploads are served from their own origin, so a cover image already arrives absolute and
 * prefixing it again produced `https://nexoristech.com/https:/media.nexoristech.com/uploads/...` — a
 * URL that fetches nothing. Every social preview for every article carried it, in production as well
 * as locally, because the media base is set in both.
 *
 * `resolveUrl` exists for exactly this and passes an http(s) URL through untouched. The trailing
 * slash still goes: it is added for pages, and a file does not want one.
 *
 * This lived inside the insights route, so the author profile — which needs the same treatment for
 * the same reason — had no way to reach it.
 */
import { resolveUrl } from "@nexoris/seo";

export function mediaAbsolute(url: string): string {
  return resolveUrl(url).replace(/\/+$/, "");
}
