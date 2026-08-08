import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireCmsAccess } from "../../../../../lib/auth.js";
import { cmsDb } from "../../../../../lib/cms-db.js";
import { JobForm } from "../JobForm.js";

export const dynamic = "force-dynamic";

interface Row { id: string; title: string; slug: string | null; department: string | null; employment_type: string | null; work_mode: string | null; job_location: string | null; salary_min: string | null; salary_max: string | null; application_deadline: string | null; featured: boolean; body: string | null; excerpt: string | null; status: string; featured_image: string | null; featured_image_alt: string | null; meta_title: string | null; meta_description: string | null; focus_keyword: string | null; publish_date: string | null }

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }): Promise<ReactNode> {
  await requireCmsAccess();
  const { id } = await params;
  const pool = cmsDb();
  const [{ rows }, { rows: departments }] = await Promise.all([
    pool.query<Row>(
      `SELECT id, title, slug, department, employment_type, work_mode, job_location, salary_min::text, salary_max::text,
              application_deadline::text, featured, body, excerpt, status, featured_image, featured_image_alt,
              meta_title, meta_description, focus_keyword, to_char(published_at,'YYYY-MM-DD"T"HH24:MI') AS publish_date
         FROM cms_content WHERE id=$1 AND kind='job'`, [id]),
    pool.query<{ id: string; name: string }>("SELECT id, name FROM cms_department WHERE active ORDER BY display_order, name"),
  ]);
  const r = rows[0];
  if (!r) notFound();
  return (
    <div>
      <Link href="/cms/jobs" className="inline-flex items-center gap-1.5 text-[0.8rem] font-600 text-slate-500 hover:text-[#543CDA]"><ArrowLeft size={15} /> Back to Jobs</Link>
      <h1 className="mt-3 text-[1.4rem] font-700 text-slate-900">Edit Job</h1>
      <p className="mt-1 truncate text-[0.86rem] text-slate-500">{r.title}</p>
      <div className="mt-5">
        <JobForm departments={departments} initial={{
          id: r.id, title: r.title, slug: r.slug ?? "", department: r.department ?? "", employmentType: r.employment_type ?? "",
          workMode: r.work_mode ?? "", location: r.job_location ?? "", salaryMin: r.salary_min ?? "", salaryMax: r.salary_max ?? "",
          deadline: r.application_deadline ?? "", featured: r.featured, body: r.body ?? "", excerpt: r.excerpt ?? "", status: r.status,
          featuredImage: r.featured_image ?? "", featuredImageAlt: r.featured_image_alt ?? "", metaTitle: r.meta_title ?? "",
          metaDescription: r.meta_description ?? "", focusKeyword: r.focus_keyword ?? "", publishDate: r.publish_date ?? "",
        }} />
      </div>
    </div>
  );
}
