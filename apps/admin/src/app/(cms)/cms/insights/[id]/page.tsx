import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { requireCmsAccess } from "../../../../../lib/auth.js";
import { cmsDb } from "../../../../../lib/cms-db.js";
import { InsightEditor } from "../InsightEditor.js";

export const dynamic = "force-dynamic";

interface Row { id: string; title: string; short_title: string | null; slug: string | null; body: string | null; excerpt: string | null; category_id: string | null; author_id: string | null; fact_checker_id: string | null; status: string; featured_image: string | null; featured_image_alt: string | null; meta_title: string | null; meta_description: string | null; focus_keyword: string | null; author_bio: string | null; fact_checker_bio: string | null; publish_date: string | null; noindex: boolean; schema_type: string | null }

export default async function EditInsightPage({ params }: { params: Promise<{ id: string }> }): Promise<ReactNode> {
  await requireCmsAccess();
  const { id } = await params;
  const pool = cmsDb();
  const [{ rows }, { rows: categories }, { rows: authors }, { rows: pageRows }] = await Promise.all([
    pool.query<Row>(
      `SELECT c.id, c.title, c.short_title, c.slug, c.body, c.excerpt, c.category_id, c.author_id, c.fact_checker_id, c.status, c.featured_image,
              c.featured_image_alt, c.meta_title, c.meta_description, c.focus_keyword, c.author_bio, c.fact_checker_bio,
              c.noindex, c.schema_type, to_char(c.published_at, 'YYYY-MM-DD"T"HH24:MI') AS publish_date
         FROM cms_content c WHERE c.id=$1 AND c.kind='insight'`, [id]),
    pool.query<{ id: string; name: string }>("SELECT id, name FROM cms_category WHERE active ORDER BY name"),
    pool.query<{ id: string; name: string }>("SELECT id, name FROM cms_author WHERE active ORDER BY name"),
    pool.query<{ title: string; slug: string }>("SELECT title, slug FROM cms_content WHERE kind='insight' AND status='published' AND slug IS NOT NULL AND id<>$1 ORDER BY published_at DESC NULLS LAST LIMIT 60", [id]),
  ]);
  const r = rows[0];
  if (!r) notFound();
  const pages = pageRows.map((p) => ({ title: p.title, url: `/insights/${p.slug}` }));

  const crumb = (r.short_title ?? r.title).trim();
  return (
    <div>
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-[0.8rem] text-slate-500">
        <Link href="/cms" className="hover:text-[#543CDA]">CMS</Link>
        <ChevronRight size={13} className="text-slate-300" />
        <Link href="/cms/insights" className="hover:text-[#543CDA]">Insights</Link>
        <ChevronRight size={13} className="text-slate-300" />
        <span className="max-w-[16rem] truncate font-600 text-slate-700">{crumb}</span>
      </nav>
      <h1 className="mt-3 text-[1.4rem] font-700 text-slate-900">Edit Insight</h1>
      <p className="mt-1 truncate text-[0.86rem] text-slate-500">{r.title}</p>
      <div className="mt-5">
        <InsightEditor categories={categories} authors={authors} pages={pages} initial={{
          id: r.id, title: r.title, shortTitle: r.short_title ?? "", slug: r.slug ?? "", body: r.body ?? "", excerpt: r.excerpt ?? "",
          categoryId: r.category_id ?? "", authorId: r.author_id ?? "", factCheckerId: r.fact_checker_id ?? "", status: r.status,
          featuredImage: r.featured_image ?? "", featuredImageAlt: r.featured_image_alt ?? "", metaTitle: r.meta_title ?? "",
          metaDescription: r.meta_description ?? "", focusKeyword: r.focus_keyword ?? "", authorBio: r.author_bio ?? "",
          factCheckerBio: r.fact_checker_bio ?? "", publishDate: r.publish_date ?? "", noindex: r.noindex, schemaType: r.schema_type ?? "BlogPosting",
        }} />
      </div>
    </div>
  );
}
