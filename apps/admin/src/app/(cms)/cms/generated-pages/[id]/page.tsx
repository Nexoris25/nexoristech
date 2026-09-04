import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireCmsAccess } from "../../../../../lib/auth.js";
import { linkCandidates } from "../../../../../lib/link-candidates.js";
import { cmsDb } from "../../../../../lib/cms-db.js";
import { GeneratedPageForm } from "../GeneratedPageForm.js";
import { requireUuid } from "../../../../../lib/route-params.js";

export const dynamic = "force-dynamic";

interface Row { id: string; title: string; slug: string | null; service_industry: string | null; industry: string | null; target_location: string | null; search_intent: string | null; target_keyword: string | null; excerpt: string | null; body: string | null; status: string; template: string | null; featured_image: string | null; featured_image_alt: string | null; meta_title: string | null; meta_description: string | null; noindex: boolean; author_id: string | null; fact_checker_id: string | null; author_bio: string | null; fact_checker_bio: string | null; short_title: string | null; category_id: string | null }

export default async function EditGeneratedPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ gate?: string }>;
}): Promise<ReactNode> {
  await requireCmsAccess();
  const { id } = await params;
  const { gate } = await searchParams;
  requireUuid(id);
  const pool = cmsDb();
  // Everything Oge may link to: published CMS content plus the marketing site's own pages.
  const linkPages = await linkCandidates(pool, id);
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

      {/*
        * The API redirects here with gate=held when a publish was refused. It has done so since the
        * gate was wired and nothing read it, so the page came back saved, still a draft, and silent
        * about why. The requirements it missed are listed further down the form.
        */}
      {gate === "held" ? (
        <p className="mt-4 rounded-lg border border-[#FCD34D] bg-[#FFFBEB] px-4 py-3 text-[0.85rem] text-[#92400E]">
          Your changes were saved, but this page was <b>not published</b>. It does not yet meet every
          publishing requirement, so it has been kept as a draft and hidden from search engines. The
          <b> Publishing requirements</b> list below shows what is still needed.
        </p>
      ) : null}

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
