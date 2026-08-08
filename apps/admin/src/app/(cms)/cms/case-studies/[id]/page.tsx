import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireCmsAccess } from "../../../../../lib/auth.js";
import { cmsDb } from "../../../../../lib/cms-db.js";
import { CaseStudyForm } from "../CaseStudyForm.js";

export const dynamic = "force-dynamic";

interface Row { id: string; title: string; slug: string | null; service_industry: string | null; excerpt: string | null; body: string | null; highlights: string[]; technologies: string[]; featured_image: string | null; featured_image_alt: string | null; status: string; featured: boolean; display_order: number; meta_title: string | null; meta_description: string | null; service_paths: string[] | null; gallery: unknown }

export default async function EditCaseStudyPage({ params }: { params: Promise<{ id: string }> }): Promise<ReactNode> {
  await requireCmsAccess();
  const { id } = await params;
  const { rows } = await cmsDb().query<Row>(
    `SELECT id, title, slug, service_industry, excerpt, body, highlights, technologies, featured_image,
            featured_image_alt, status, featured, display_order, meta_title, meta_description,
            service_paths, gallery
       FROM cms_content WHERE id=$1 AND kind='case_study'`, [id]);
  const r = rows[0];
  if (!r) notFound();
  return (
    <div>
      <Link href="/cms/case-studies" className="inline-flex items-center gap-1.5 text-[0.8rem] font-600 text-slate-500 hover:text-[#543CDA]"><ArrowLeft size={15} /> Back to Case Studies</Link>
      <h1 className="mt-3 text-[1.4rem] font-700 text-slate-900">Edit Case Study</h1>
      <p className="mt-1 text-[0.86rem] text-slate-500">{r.title}</p>
      <div className="mt-5">
        <CaseStudyForm initial={{
          id: r.id, title: r.title, slug: r.slug ?? "", serviceIndustry: r.service_industry ?? "",
          excerpt: r.excerpt ?? "", body: r.body ?? "", highlights: r.highlights.join(", "),
          technologies: r.technologies.join(", "), featuredImage: r.featured_image ?? "", featuredImageAlt: r.featured_image_alt ?? "", status: r.status,
          featured: r.featured, displayOrder: r.display_order, metaTitle: r.meta_title ?? "", metaDescription: r.meta_description ?? "",
          // Neither of these was selected, so the service checkboxes came back empty and the uploaded
          // project images disappeared from the form every time the record was reopened. Both were
          // stored correctly the whole time; the editor simply never read them back.
          servicePaths: r.service_paths ?? [],
          gallery: Array.isArray(r.gallery)
            ? (r.gallery as { url?: unknown; alt?: unknown }[])
                .map((g) => ({ url: String(g.url ?? ""), alt: String(g.alt ?? "") }))
                .filter((g) => g.url)
            : [],
        }} />
      </div>
    </div>
  );
}
