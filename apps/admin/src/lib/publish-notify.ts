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
    /*
     * With the trailing slash.
     *
     * The website appends one to every URL, so this POST was answered with a 308 — and a redirect
     * turns a POST into a GET and drops its body. The call looked like it worked (the redirect
     * follows, the endpoint answers) and revalidated nothing at all, so publishing never refreshed
     * a single page: every one of them waited for its own five-minute timer instead. This is the
     * same trailing-slash trap the engagement beacon fell into.
     */
    const res = await fetch(`${WEB_ORIGIN}/api/revalidate/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-revalidate-secret": secret },
      body: JSON.stringify({ paths }),
      signal: AbortSignal.timeout(10000),
      /*
       * Do not follow a redirect.
       *
       * Following one is how this failed silently: the 308 was followed as a GET, the endpoint
       * answered 200, and `res.ok` reported a success that had revalidated nothing. A redirect on
       * this call means the URL is wrong, and the honest answer to a wrong URL is a failure.
       */
      redirect: "manual",
    });
    if (!res.ok) return false;
    // The endpoint echoes the paths it acted on, so a 200 that did nothing cannot pass for a success.
    const body = (await res.json().catch(() => null)) as { revalidated?: unknown } | null;
    return Array.isArray(body?.revalidated) && body.revalidated.length > 0;
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
  /**
   * Further pages this particular item appears on, beyond the fixed hubs.
   *
   * An article is listed on its author's profile, and the profile lives at a path only the caller
   * can work out: authors have no stored slug, it is derived from the name. Without this the profile
   * kept showing yesterday's list until its own timer came round.
   */
  extraPaths?: string[];
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
  /*
   * The home page lists the latest articles, and it was not here.
   *
   * Publishing rebuilt the article and the Insights hub and stopped there, so the new piece appeared
   * on the hub and was missing from the home page until that page's own five minute timer came
   * round. Someone publishing and then checking the site saw exactly that: present in one place,
   * absent in another, with nothing to explain the difference.
   */
  insight: ["/insights", "/"],
  case_study: ["/case-studies"],
  legal_page: [],
  generated_page: [],
  job: ["/careers"],
  author: ["/insights", "/"],
  category: ["/insights", "/"],
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
  const extra = input.extraPaths ?? [];
  const paths = [
    ...new Set(
      standalone
        ? [input.path, ...HUB_PATHS[input.kind], ...extra, "/sitemap.xml", "/llms.txt"]
        : [...HUB_PATHS[input.kind], ...extra],
    ),
  ];

  const [revalidated, indexNow, googleJob] = await Promise.all([
    revalidateWeb(paths),
    input.published && standalone ? submitToIndexNow([url]) : Promise.resolve(false),
    input.kind === "job" ? notifyGoogleJobPosting(url, !input.published) : Promise.resolve(false),
  ]);
  return { revalidated, indexNow, googleJob };
}
