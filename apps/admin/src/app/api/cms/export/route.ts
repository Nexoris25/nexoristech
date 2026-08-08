/**
 * CSV export for the CMS lists.
 *
 * Several lists carried an "Export" button with no handler. Exporting is the one thing people reliably
 * want from a list — to take it into a spreadsheet — so this makes the button real rather than removing
 * it.
 *
 * The column set per kind is fixed here, not taken from the request, so the export cannot be steered
 * into reading columns the screen does not show.
 */
import type { NextRequest } from "next/server";
import { getCmsStaff } from "../../../../lib/auth.js";
import { cmsDb } from "../../../../lib/cms-db.js";
import { PUBLIC_KINDS_SQL } from "../../../../lib/seo-audit.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Report {
  filename: string;
  headers: string[];
  sql: string;
}

const REPORTS: Record<string, Report> = {
  content: {
    filename: "content",
    headers: ["Title", "Kind", "Slug", "Status", "Author", "Published", "Updated"],
    sql: `SELECT c.title, c.kind, c.slug, c.status, a.name AS author,
                 c.published_at::date::text AS published, c.updated_at::date::text AS updated
            FROM cms_content c LEFT JOIN cms_author a ON a.id = c.author_id
           WHERE c.kind IN ${PUBLIC_KINDS_SQL}
           ORDER BY c.updated_at DESC`,
  },
  "case-studies": {
    filename: "case-studies",
    headers: ["Title", "Company", "Industry", "Status", "Rating", "Updated"],
    sql: `SELECT title, company, service_industry AS industry, status, rating::text,
                 updated_at::date::text AS updated
            FROM cms_content WHERE kind = 'case_study' ORDER BY updated_at DESC`,
  },
  applications: {
    filename: "job-applications",
    headers: ["Applicant", "Email", "Role applied for", "Stage", "Verification", "Received"],
    sql: `SELECT title AS applicant, applicant_email AS email, applied_job AS role,
                 application_stage AS stage, verification_status AS verification,
                 created_at::date::text AS received
            FROM cms_content WHERE kind = 'application' ORDER BY created_at DESC`,
  },
  authors: {
    filename: "authors",
    headers: ["Name", "Job title", "Department", "Email", "Active", "On the website"],
    sql: `SELECT name, job_title, department, email, active::text, show_on_website::text
            FROM cms_author ORDER BY name`,
  },
};

/** RFC 4180: quote every field, and double any quote inside it. */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  return `"${String(value).replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest): Promise<Response> {
  const staff = await getCmsStaff();
  if (!staff) return new Response("Not authorised", { status: 401 });

  const report = REPORTS[new URL(request.url).searchParams.get("report") ?? ""];
  if (!report) return new Response("Unknown report", { status: 400 });

  const { rows } = await cmsDb().query<Record<string, unknown>>(report.sql);
  const lines = [
    report.headers.map(csvCell).join(","),
    ...rows.map((r) => Object.values(r).map(csvCell).join(",")),
  ];

  // Excel needs a byte-order mark to open a UTF-8 CSV correctly; without it, Nigerian names carrying
  // accents arrive mangled. Named as a constant rather than typed inline, because the character itself
  // is invisible in an editor and reads as stray whitespace to anything scanning the source.
  const BOM = String.fromCharCode(0xFEFF);
  const body = `${BOM}${lines.join("\r\n")}\r\n`;
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="nexoris-${report.filename}-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
