/**
 * Create or update a job (nexoris_cms, kind='job'). CMS access only. Job lifecycle maps onto the content
 * status (Open = published, Closed = archived). Stores the role description as semantic HTML plus the SEO
 * fields and careers metadata. Publishing stamps published_at (or the given publish date).
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cmsDb } from "../../../../lib/cms-db.js";
import { getCmsStaff } from "../../../../lib/auth.js";
import { syncToKnowledgeBase } from "../../../../lib/kb-reingest.js";
import { notifyPublished } from "../../../../lib/publish-notify.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const slugify = (s: string): string => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const VALID = new Set(["draft", "in_review", "scheduled", "published", "archived"]);
const int = (v: FormDataEntryValue | null): number | null => { const n = Number(String(v ?? "").trim()); return String(v ?? "").trim() !== "" && Number.isFinite(n) ? Math.round(n) : null; };

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getCmsStaff();
  if (!staff) return NextResponse.redirect(new URL("/cms/jobs", request.url), { status: 303 });
  const f = await request.formData();
  const id = String(f.get("id") ?? "").trim();
  const title = String(f.get("title") ?? "").trim();
  if (!title) return NextResponse.redirect(new URL(`${id ? `/cms/jobs/${id}` : "/cms/jobs/new"}?error=title`, request.url), { status: 303 });

  const statusRaw = String(f.get("status") ?? "draft").trim();
  const status = VALID.has(statusRaw) ? statusRaw : "draft";
  const vals = [
    title,                                                       // 1
    slugify(String(f.get("slug") ?? "") || title),               // 2
    String(f.get("body") ?? ""),                                 // 3
    String(f.get("excerpt") ?? "").trim() || null,               // 4
    String(f.get("department") ?? "").trim() || null,            // 5
    String(f.get("employment_type") ?? "").trim() || null,       // 6
    String(f.get("work_mode") ?? "").trim() || null,             // 7
    String(f.get("job_location") ?? "").trim() || null,          // 8
    int(f.get("salary_min")),                                    // 9
    int(f.get("salary_max")),                                    // 10
    String(f.get("application_deadline") ?? "").trim() || null,  // 11
    f.get("featured") != null,                                   // 12
    status,                                                       // 13
    String(f.get("featured_image") ?? "").trim() || null,        // 14
    String(f.get("featured_image_alt") ?? "").trim() || null,    // 15
    String(f.get("meta_title") ?? "").trim() || null,            // 16
    String(f.get("meta_description") ?? "").trim() || null,      // 17
    String(f.get("focus_keyword") ?? "").trim() || null,         // 18
    String(f.get("publish_date") ?? "").trim() || null,          // 19
  ];
  const pool = cmsDb();

  if (id) {
    await pool.query(
      `UPDATE cms_content SET title=$1, slug=$2, body=$3, excerpt=$4, department=$5, employment_type=$6, work_mode=$7,
              job_location=$8, salary_min=$9, salary_max=$10, application_deadline=$11::date, featured=$12, status=$13,
              featured_image=$14, featured_image_alt=$15, meta_title=$16, meta_description=$17, focus_keyword=$18, updated_at=now(),
              published_at = COALESCE($19::timestamptz, CASE WHEN $13='published' AND published_at IS NULL THEN now() ELSE published_at END)
        WHERE id=$20 AND kind='job'`,
      [...vals, id]);
    await syncToKnowledgeBase({ kind: "job", slug: String(vals[1]), title, status, excerpt: vals[3] as string | null, metaDescription: vals[16] as string | null, body: vals[2] as string });
    await notifyPublished({ path: `/careers/${String(vals[1])}`, kind: "job", published: status === "published" });
    return NextResponse.redirect(new URL(`/cms/jobs/${id}`, request.url), { status: 303 });
  }
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO cms_content (kind, title, slug, body, excerpt, department, employment_type, work_mode, job_location,
            salary_min, salary_max, application_deadline, featured, status, featured_image, featured_image_alt,
            meta_title, meta_description, focus_keyword, published_at)
     VALUES ('job',$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::date,$12,$13,$14,$15,$16,$17,$18,
            COALESCE($19::timestamptz, CASE WHEN $13='published' THEN now() ELSE NULL END)) RETURNING id`,
    vals);
  await syncToKnowledgeBase({ kind: "job", slug: String(vals[1]), title, status, excerpt: vals[3] as string | null, metaDescription: vals[16] as string | null, body: vals[2] as string });
    await notifyPublished({ path: `/careers/${String(vals[1])}`, kind: "job", published: status === "published" });
  return NextResponse.redirect(new URL(`/cms/jobs/${rows[0]?.id ?? ""}`, request.url), { status: 303 });
}
