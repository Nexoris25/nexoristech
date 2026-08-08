/**
 * The structured-data and metadata audit behind the SEO dashboards.
 *
 * Every count here is produced by checking the published corpus against the properties Google documents
 * as required for the rich result each page type emits. Nothing is estimated. The previous Schema Status
 * panel showed a fixed "23 active, 19 valid, 3 warnings, 1 error" that no check had produced.
 *
 * The rules mirror what apps/web actually puts on the page, so a page counted eligible here is a page
 * whose JSON-LD really does carry every required property:
 *
 *   - insights and case studies emit Article / BlogPosting  (packages/seo articleNode)
 *   - jobs emit JobPosting                                   (packages/seo jobPostingNode)
 *   - generated pages and legal pages emit WebPage           (packages/seo webPageNode)
 *
 * Google's required properties are taken from its structured-data documentation: JobPosting requires
 * title, description, datePosted, hiringOrganization and jobLocation; Article names no hard-required
 * property, but the article rich result only appears with a headline, an image, a date and an author,
 * so those four are what eligibility is measured against and the UI says so.
 *
 * This is a check of what the site emits. It is not a claim about what Google has decided to show.
 */
import { cmsDb } from "./cms-db.js";

/** The public content kinds, and the CMS collection that edits each one. */
export const KIND_ROUTES: Record<string, string> = {
  insight: "insights",
  generated_page: "generated-pages",
  case_study: "case-studies",
  legal_page: "legal-pages",
  job: "jobs",
};

export const PUBLIC_KINDS_SQL = "('insight','generated_page','case_study','legal_page','job')";

/** The issues a page can have. Each one is a filter the issue list can be opened on. */
export type IssueId =
  | "missing-title"
  | "missing-description"
  | "duplicate-title"
  | "missing-og-image"
  | "missing-author"
  | "missing-date"
  | "job-missing-required";

export interface IssueDef {
  id: IssueId;
  label: string;
  /** What it breaks, in one line, for the row's secondary text. */
  note: string;
  /** Severity: an error blocks the rich result, a warning weakens the listing. */
  severity: "error" | "warning";
  /** The SQL predicate identifying an affected row of cms_content. */
  sql: string;
}

/**
 * A page counts as having a title/description if either the meta field or the visible title carries one,
 * because that is the fallback apps/web applies when building metadata.
 */
export const ISSUES: IssueDef[] = [
  {
    id: "missing-title",
    label: "Missing meta titles",
    note: "No title tag is written, so search engines fall back to the page heading",
    severity: "warning",
    sql: "coalesce(meta_title, '') = ''",
  },
  {
    id: "missing-description",
    label: "Missing meta descriptions",
    note: "No description tag, so the search snippet is written by Google, not by you",
    severity: "warning",
    sql: "coalesce(meta_description, '') = '' AND coalesce(excerpt, '') = ''",
  },
  {
    id: "duplicate-title",
    label: "Duplicate titles",
    note: "Two or more published pages share a title, which splits their ranking signals",
    severity: "warning",
    sql: `lower(title) IN (
            SELECT lower(title) FROM cms_content
             WHERE status = 'published' AND kind IN ${PUBLIC_KINDS_SQL}
             GROUP BY lower(title) HAVING count(*) > 1)`,
  },
  {
    id: "missing-og-image",
    label: "Missing social images",
    note: "No featured image, so link previews and the article rich result have nothing to show",
    severity: "error",
    sql: "coalesce(featured_image, '') = '' AND kind IN ('insight','case_study')",
  },
  {
    id: "missing-author",
    label: "Articles with no author",
    note: "Article structured data needs a named author to qualify for the rich result",
    severity: "error",
    sql: "author_id IS NULL AND kind IN ('insight','case_study')",
  },
  {
    id: "missing-date",
    label: "Articles with no publish date",
    note: "datePublished is missing, so the result cannot carry a date",
    severity: "error",
    sql: "published_at IS NULL AND kind IN ('insight','case_study')",
  },
  {
    id: "job-missing-required",
    label: "Jobs missing a required property",
    note: "JobPosting requires a description, a posting date and a location to appear in Google Jobs",
    severity: "error",
    sql: `kind = 'job' AND (coalesce(excerpt, '') = '' OR published_at IS NULL OR coalesce(job_location, '') = '')`,
  },
];

export function issueById(id: string): IssueDef | undefined {
  return ISSUES.find((i) => i.id === id);
}

export interface AuditCounts {
  /** Published pages in the CMS, by public kind. */
  published: number;
  /** Pages carrying at least one error-severity issue. */
  schemaErrors: number;
  /** Pages carrying at least one warning-severity issue and no error. */
  schemaWarnings: number;
  /** Pages whose emitted structured data carries every property its rich result needs. */
  richEligible: number;
  /** Per-issue counts, keyed by issue id. */
  byIssue: Record<IssueId, number>;
}

/** Counts every issue and the resulting error / warning / eligible split in one pass. */
export async function auditCounts(): Promise<AuditCounts> {
  const errors = ISSUES.filter((i) => i.severity === "error");
  const warnings = ISSUES.filter((i) => i.severity === "warning");
  const anyOf = (list: IssueDef[]): string => (list.length ? list.map((i) => `(${i.sql})`).join(" OR ") : "false");

  const selects = ISSUES.map((i) => `count(*) FILTER (WHERE ${i.sql})::text AS "${i.id}"`).join(",\n      ");
  const { rows } = await cmsDb().query<Record<string, string>>(`
    SELECT count(*)::text AS published,
      count(*) FILTER (WHERE ${anyOf(errors)})::text AS err,
      count(*) FILTER (WHERE NOT (${anyOf(errors)}) AND (${anyOf(warnings)}))::text AS warn,
      count(*) FILTER (WHERE NOT (${anyOf(errors)}))::text AS eligible,
      ${selects}
      FROM cms_content
     WHERE status = 'published' AND kind IN ${PUBLIC_KINDS_SQL} AND coalesce(noindex, false) = false
  `);

  const r = rows[0] ?? {};
  const byIssue = {} as Record<IssueId, number>;
  for (const i of ISSUES) byIssue[i.id] = Number(r[i.id] ?? 0);
  return {
    published: Number(r.published ?? 0),
    schemaErrors: Number(r.err ?? 0),
    schemaWarnings: Number(r.warn ?? 0),
    richEligible: Number(r.eligible ?? 0),
    byIssue,
  };
}

export interface AffectedPage {
  id: number;
  kind: string;
  title: string;
  slug: string | null;
  status: string;
  updated_at: string;
}

const affectedWhere = (issue: IssueDef): string =>
  `status = 'published' AND kind IN ${PUBLIC_KINDS_SQL} AND coalesce(noindex, false) = false AND (${issue.sql})`;

/** How many published pages one issue affects. Read before paging, so the page number can be clamped. */
export async function countWithIssue(issue: IssueDef): Promise<number> {
  const { rows } = await cmsDb().query<{ c: string }>(
    `SELECT count(*)::text AS c FROM cms_content WHERE ${affectedWhere(issue)}`);
  return Number(rows[0]?.c ?? 0);
}

/** The pages one issue affects, so the dashboard row can lead straight to the fix. */
export async function pagesWithIssue(issue: IssueDef, limit: number, offset: number): Promise<AffectedPage[]> {
  const { rows } = await cmsDb().query<AffectedPage>(
    `SELECT id, kind, title, slug, status, updated_at::text
       FROM cms_content WHERE ${affectedWhere(issue)} ORDER BY updated_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]);
  return rows;
}

/** Where to send an editor to correct a given page. */
export function editHref(page: { kind: string; id: number }): string {
  const collection = KIND_ROUTES[page.kind] ?? "insights";
  return `/cms/${collection}/${page.id}`;
}

/** The colour a score should be shown in: green when healthy, amber when slipping, red when poor. */
export function scoreColor(score: number): { fg: string; tint: string; label: string } {
  if (score >= 90) return { fg: "#15803D", tint: "#DCFCE7", label: "Healthy" };
  if (score >= 75) return { fg: "#0369A1", tint: "#E0F2FE", label: "Good" };
  if (score >= 50) return { fg: "#B45309", tint: "#FEF3C7", label: "Needs work" };
  return { fg: "#DC2626", tint: "#FEE2E2", label: "Poor" };
}
