import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireCmsAccess } from "../../../../../lib/auth.js";
import { cmsDb } from "../../../../../lib/cms-db.js";
import { GeneratedPageForm } from "../GeneratedPageForm.js";
import { requireUuid } from "../../../../../lib/route-params.js";

export const dynamic = "force-dynamic";

interface Row { id: string; title: string; slug: string | null; service_industry: string | null; industry: string | null; target_location: string | null; search_intent: string | null; target_keyword: string | null; excerpt: string | null; body: string | null; status: string; template: string | null; featured_image: string | null; featured_image_alt: string | null; meta_title: string | null; meta_description: string | null; noindex: boolean; author_id: string | null; fact_checker_id: string | null; author_bio: string | null; fact_checker_bio: string | null; short_title: string | null; category_id: string | null }

export default async function EditGeneratedPage({ params }: { params: Promise<{ id: string }> }): Promise<ReactNode> {
  await requireCmsAccess();
  const { id } = await params;
  requireUuid(id);
  const pool = cmsDb();
  // Internal-link candidates: what is actually published and therefore safe to link to.
  const { rows: linkRows } = await pool.query<{ title: string; slug: string; kind: string }>(
    `SELECT title, slug, kind FROM cms_content
      WHERE status='published' AND slug IS NOT NULL AND kind IN ('insight','generated_page','case_study')
      ORDER BY published_at DESC NULLS LAST LIMIT 60`);
  const linkPages = linkRows.map((r) => ({
    title: r.title,
    url: r.kind === "insight" ? `/insights/${r.slug}` : r.kind === "case_study" ? `/case-studies/${r.slug}` : `/${r.slug}`,
  }));
  const [{ rows }, { rows: templates }, { rows: authors }, { rows: categories }] = await Promise.all([
    pool.query<Row>(
      `SELECT id, title, slug, service_industry, industry, target_location, search_intent, target_keyword, excerpt,
              body, status, template, featured_image, featured_image_alt, meta_title, meta_description, noindex,
              author_id, fact_checker_id, author_bio, fact_checker_bio, short_title, category_id
         FROM cms_content WHERE id=$1 AND kind='generated_page'`, [id]),
    pool.query<{ name: string }>("SELECT name FROM cms_template WHERE active ORDER BY name"),
    pool.query<{ id: string; name: string }>("SELECT id, name FROM cms_author WHERE active ORDER BY name"),
    pool.query<{ id: string; name: string }>("SELECT id, name FROM cms_category ORDER BY name"),
  ]);
  const r = rows[0];
  if (!r) notFound();
  return (
    <div>
      <Link href="/cms/generated-pages" className="inline-flex items-center gap-1.5 text-[0.8rem] font-600 text-slate-500 hover:text-[#543CDA]"><ArrowLeft size={15} /> Back to Generated Pages</Link>
      <h1 className="mt-3 text-[1.4rem] font-700 text-slate-900">Edit Generated Page</h1>
      <p className="mt-1 truncate text-[0.86rem] text-slate-500">{r.title}</p>
      <div className="mt-5">
        <GeneratedPageForm templates={templates.map((t) => t.name)} authors={authors} categories={categories} pages={linkPages} initial={{
          id: r.id, title: r.title, slug: r.slug ?? "", primaryService: r.service_industry ?? "", industry: r.industry ?? "",
          targetLocation: r.target_location ?? "Global", searchIntent: r.search_intent ?? "Informational", targetKeyword: r.target_keyword ?? "",
          excerpt: r.excerpt ?? "", body: r.body ?? "", status: r.status, template: r.template ?? "",
          featuredImage: r.featured_image ?? "", featuredImageAlt: r.featured_image_alt ?? "", metaTitle: r.meta_title ?? "", metaDescription: r.meta_description ?? "", noindex: r.noindex,
          authorId: r.author_id ?? "", factCheckerId: r.fact_checker_id ?? "", authorBio: r.author_bio ?? "", factCheckerBio: r.fact_checker_bio ?? "", shortTitle: r.short_title ?? "",
          categoryId: r.category_id ?? "",
        }} />
      </div>
    </div>
  );
}
