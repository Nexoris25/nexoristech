/**
 * What happens the moment content is published or updated (PRD 9.1, 9.8).
 *
 * Three things, in order of how much they actually help:
 *  1. Revalidate the website's ISR routes, so the page itself, /insights, the sitemap and llms.txt all
 *     reflect the change immediately rather than waiting for the next timed rebuild. Google discovers
 *     new URLs through the sitemap it already crawls, so getting the sitemap fresh is the real work.
 *  2. Submit the URL to IndexNow, which Bing, Yandex, Naver and Seznam act on. Google does not
 *     participate in IndexNow, so this is genuinely useful but not a Google mechanism.
 *  3. For job postings only, call Google's Indexing API. Google restricts that API to JobPosting and
 *     BroadcastEvent; sending it blog posts is not supported and is ignored, so we do not pretend
 *     otherwise. (The old sitemap ping endpoints were retired by both Google and Bing.)
 *
 * Every step is best effort and never blocks a save.
 */
import { googleAccessToken } from "./google/auth.js";
import { SITE_ORIGIN } from "./site-pages.js";

const WEB_ORIGIN = process.env.WEB_ORIGIN ?? SITE_ORIGIN;

/** Ask the website to rebuild the routes a publish affects. */
async function revalidateWeb(paths: string[]): Promise<boolean> {
  const secret = process.env.REVALIDATION_SECRET;
  if (!secret) return false;
  try {
    const res = await fetch(`${WEB_ORIGIN}/api/revalidate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-revalidate-secret": secret },
      body: JSON.stringify({ paths }),
      signal: AbortSignal.timeout(10000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Tell the IndexNow engines a URL changed. Needs INDEXNOW_KEY, which the website serves at
 * /indexnow-key.txt; we name that location explicitly, which the protocol allows.
 */
async function submitToIndexNow(urls: string[]): Promise<boolean> {
  const key = process.env.INDEXNOW_KEY;
  if (!key || urls.length === 0) return false;
  const host = new URL(SITE_ORIGIN).host;
  try {
    const res = await fetch("https://api.indexnow.org/IndexNow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host, key, keyLocation: `${SITE_ORIGIN}/indexnow-key.txt`, urlList: urls }),
      signal: AbortSignal.timeout(10000),
    });
    // IndexNow answers 200 or 202 on acceptance.
    if (!res.ok) console.warn(`[indexnow] ${res.status}: ${(await res.text()).slice(0, 160)}`);
    return res.ok;
  } catch (err) {
    console.warn(`[indexnow] failed: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

/**
 * Google's Indexing API. Officially valid for JobPosting and BroadcastEvent only, so we call it for job
 * pages and nothing else; other content reaches Google through the (now freshly rebuilt) sitemap.
 */
async function notifyGoogleJobPosting(url: string, removed: boolean): Promise<boolean> {
  const token = await googleAccessToken();
  if (!token) return false;
  try {
    const res = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url, type: removed ? "URL_DELETED" : "URL_UPDATED" }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) console.warn(`[indexing-api] ${res.status}: ${(await res.text()).slice(0, 160)}`);
    return res.ok;
  } catch (err) {
    console.warn(`[indexing-api] failed: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

export interface PublishNotifyInput {
  /**
   * The public path of the item, e.g. /insights/my-article. For a kind with no page of its own
   * (a testimonial), this is the page it appears on.
   */
  path: string;
  kind: "insight" | "case_study" | "legal_page" | "generated_page" | "job" | "author" | "category" | "testimonial";
  /** True when the item is live; false when it was unpublished or deleted. */
  published: boolean;
}

/**
 * Listing pages that must be rebuilt when an item of this kind changes.
 *
 * Authors and categories are here because their details are rendered into other pages: an author's name
 * and bio appear on every article they wrote, and a category name appears on the insights index. Editing
 * one used to change nothing on the website at all, because only insights, jobs and generated pages ever
 * called this. The whole hub is rebuilt for those two, since we cannot cheaply know which articles
 * carry the author or sit in the category.
 */
const HUB_PATHS: Record<PublishNotifyInput["kind"], string[]> = {
  insight: ["/insights"],
  case_study: ["/case-studies"],
  legal_page: [],
  generated_page: [],
  job: ["/careers"],
  author: ["/insights"],
  category: ["/insights"],
  // A testimonial renders inside the homepage carousel and has no page of its own.
  testimonial: ["/"],
};

/**
 * Kinds that have no crawlable URL of their own. They still need the pages that render them rebuilt,
 * but there is nothing to submit to a search engine and nothing new for the sitemap to list.
 */
const NO_URL_OF_ITS_OWN = new Set<PublishNotifyInput["kind"]>(["testimonial"]);

/**
 * Fire the publish notifications for one item. Never throws: a save must not fail because a search
 * engine was slow. Returns what actually happened, for logging and the UI.
 */
export async function notifyPublished(input: PublishNotifyInput): Promise<{ revalidated: boolean; indexNow: boolean; googleJob: boolean }> {
  const url = `${SITE_ORIGIN}${input.path}`;
  const standalone = !NO_URL_OF_ITS_OWN.has(input.kind);
  // The item, its hub, and — for anything with a URL — the two files that advertise the site's
  // contents. A testimonial adds no URL, so asking for the sitemap to rebuild would be busywork.
  const paths = standalone
    ? [input.path, ...HUB_PATHS[input.kind], "/sitemap.xml", "/llms.txt"]
    : [...HUB_PATHS[input.kind]];

  const [revalidated, indexNow, googleJob] = await Promise.all([
    revalidateWeb(paths),
    input.published && standalone ? submitToIndexNow([url]) : Promise.resolve(false),
    input.kind === "job" ? notifyGoogleJobPosting(url, !input.published) : Promise.resolve(false),
  ]);
  return { revalidated, indexNow, googleJob };
}
