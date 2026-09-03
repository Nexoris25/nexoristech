/**
 * Where things live on the site.
 *
 * The shape of a URL is a decision, and it was previously spelled out at each of the four places
 * that linked to an author. Moving authors to the site root meant finding all four; keeping the
 * shape here means the next move is one edit.
 */

/**
 * An author's profile.
 *
 * Authors sit at the root — `/chinedu-nwogu`, not `/authors/chinedu-nwogu`. A person's page is a
 * top-level thing on this site rather than an entry in a directory, and the shorter URL is the one
 * that gets shared and cited. The old path still resolves: it redirects here permanently, so links
 * already published elsewhere keep working and search engines are told where the page went.
 */
export { authorPath } from "@nexoris/seo";

/** The retired path, kept for the redirect and for tests that assert it still points somewhere. */
export { legacyAuthorPath } from "@nexoris/seo";
