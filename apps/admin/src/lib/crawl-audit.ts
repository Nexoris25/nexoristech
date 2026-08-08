/**
 * A real crawl of the site's own corpus, for the Crawl Health screen.
 *
 * The screen used to report 312 broken links, 124 orphan pages, 122 slow pages and 428 4xx errors. No
 * crawler had ever run; the numbers were written into the file. This walks the published body HTML and
 * the redirect table and answers the questions that can be answered from what we hold:
 *
 *   - broken internal links: an internal href that resolves to no published page and no static route
 *   - pages with no contextual inbound link: reachable from their archive, but from no other page's copy
 *   - redirect loops and chains: a redirect whose target is itself another redirect's source
 *   - redirects pointing at nothing: a target that resolves to no live page
 *
 * The inbound-link check deliberately excludes the archive listings. Every insight is linked from
 * /insights and every job from /careers, so counting those would make the check always pass and say
 * nothing. What it measures is whether any page's own copy points at another page, which is the signal
 * that actually distributes authority. Calling that result "orphaned" would be wrong, and it is not.
 *
 * Response time, 4xx status codes and render-blocking resources need a crawler that actually fetches the
 * site over HTTP. That is a separate job, and the screen says so rather than filling the gap in.
 */
import { cmsDb } from "./cms-db.js";
import { STATIC_ROUTES } from "./site-pages.js";
import { PUBLIC_KINDS_SQL, KIND_ROUTES } from "./seo-audit.js";

export interface CrawlPage {
  id: number;
  kind: string;
  title: string;
  path: string;
  /** Internal paths this page links to. */
  links: string[];
}

export interface BrokenLink { from: CrawlPage; href: string }
export interface RedirectIssue { id: number; oldUrl: string; newUrl: string; problem: string }

export interface CrawlReport {
  /** Pages that were walked. */
  crawled: number;
  brokenLinks: BrokenLink[];
  /** Published pages that no other page's copy links to. Still reachable from their archive listing. */
  unlinked: CrawlPage[];
  redirectIssues: RedirectIssue[];
  /** Internal links followed, so the coverage of the walk is visible. */
  linksChecked: number;
  /** Pages whose stored body is empty, so they could not contribute a link to the walk. */
  emptyBodies: number;
}

/** The public path a piece of content lives at. Mirrors the routes apps/web serves. */
export function pathFor(kind: string, slug: string | null): string | null {
  if (!slug) return null;
  if (kind === "insight") return `/insights/${slug}`;
  if (kind === "case_study") return `/case-studies/${slug}`;
  if (kind === "job") return `/careers/${slug}`;
  if (kind === "legal_page" || kind === "generated_page") return `/${slug}`;
  const seg = KIND_ROUTES[kind];
  return seg ? `/${seg}/${slug}` : null;
}

/** Strip the query, hash and trailing slash so two spellings of one path compare equal. */
export function normalisePath(href: string): string {
  const cut = href.split("#")[0]?.split("?")[0] ?? "";
  if (cut.length > 1 && cut.endsWith("/")) return cut.slice(0, -1);
  return cut;
}

/** Internal paths linked from a body of HTML. External, mail and telephone links are not ours to check. */
export function internalLinks(html: string, origin: string): string[] {
  const out = new Set<string>();
  for (const m of html.matchAll(/href\s*=\s*["']([^"']+)["']/gi)) {
    const raw = (m[1] ?? "").trim();
    if (!raw || raw.startsWith("#") || /^(mailto:|tel:|javascript:)/i.test(raw)) continue;
    let path: string;
    if (raw.startsWith("/")) path = raw;
    else if (raw.startsWith(origin)) path = raw.slice(origin.length) || "/";
    else continue; // another site's problem
    const norm = normalisePath(path);
    if (norm) out.add(norm);
  }
  return [...out];
}

interface Row { id: number; kind: string; title: string; slug: string | null; body: string | null }

/** Walks every published page once and reports what the links say about the site. */
export async function crawlReport(origin: string): Promise<CrawlReport> {
  const pool = cmsDb();
  const [{ rows: content }, { rows: redirects }] = await Promise.all([
    pool.query<Row>(
      `SELECT id, kind, title, slug, body FROM cms_content
        WHERE status = 'published' AND kind IN ${PUBLIC_KINDS_SQL} AND coalesce(noindex, false) = false`),
    pool.query<{ id: number; old_url: string; new_url: string; status: string }>(
      "SELECT id, old_url, new_url, status FROM cms_redirect"),
  ]);

  const pages: CrawlPage[] = [];
  let emptyBodies = 0;
  for (const r of content) {
    const path = pathFor(r.kind, r.slug);
    if (!path) continue;
    if (!(r.body ?? "").trim()) emptyBodies += 1;
    pages.push({ id: r.id, kind: r.kind, title: r.title, path: normalisePath(path), links: internalLinks(r.body ?? "", origin) });
  }

  // Everything a link is allowed to land on: a published page, a hand-built route, or a live redirect.
  const live = new Set<string>([...pages.map((p) => p.path), ...STATIC_ROUTES.map(normalisePath)]);
  // The column stores "Active"/"Inactive" capitalised, so a case-sensitive compare matched nothing and
  // the redirect checks silently passed over every row, including a self-referencing loop.
  const activeRedirects = redirects.filter((r) => (r.status ?? "").toLowerCase() === "active");
  const redirectFrom = new Map(activeRedirects.map((r) => [normalisePath(r.old_url), normalisePath(r.new_url)]));
  const reachable = new Set([...live, ...redirectFrom.keys()]);

  const brokenLinks: BrokenLink[] = [];
  let linksChecked = 0;
  const linkedTo = new Set<string>();
  for (const p of pages) {
    for (const href of p.links) {
      linksChecked += 1;
      // A page linking to itself is not an inbound link from anywhere, so it cannot clear the check.
      if (href !== p.path) linkedTo.add(href);
      if (!reachable.has(href)) brokenLinks.push({ from: p, href });
    }
  }

  const staticSet = new Set(STATIC_ROUTES.map(normalisePath));
  const unlinked = pages.filter((p) => !linkedTo.has(p.path) && !staticSet.has(p.path));

  const redirectIssues: RedirectIssue[] = [];
  for (const r of activeRedirects) {
    const from = normalisePath(r.old_url);
    const to = normalisePath(r.new_url);
    if (from === to) redirectIssues.push({ id: r.id, oldUrl: r.old_url, newUrl: r.new_url, problem: "Points at itself" });
    else if (redirectFrom.has(to)) redirectIssues.push({ id: r.id, oldUrl: r.old_url, newUrl: r.new_url, problem: "Chains into another redirect" });
    else if (to.startsWith("/") && !live.has(to)) redirectIssues.push({ id: r.id, oldUrl: r.old_url, newUrl: r.new_url, problem: "Target is not a live page" });
  }

  return { crawled: pages.length, brokenLinks, unlinked, redirectIssues, linksChecked, emptyBodies };
}
