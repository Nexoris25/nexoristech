import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireCmsAccess } from "../../../../../lib/auth.js";
import { linkCandidates } from "../../../../../lib/link-candidates.js";
import { cmsDb } from "../../../../../lib/cms-db.js";
import { GeneratedPageForm } from "../GeneratedPageForm.js";

export const dynamic = "force-dynamic";

export default async function NewGeneratedPage(): Promise<ReactNode> {
  await requireCmsAccess();
  const pool = cmsDb();
  // Everything Oge may link to: published CMS content plus the marketing site's own pages.
  const linkPages = await linkCandidates(pool);
  const [{ rows }, { rows: authors }, { rows: categories }] = await Promise.all([
    pool.query<{ name: string }>("SELECT name FROM cms_template WHERE active ORDER BY name"),
    pool.query<{ id: string; name: string }>("SELECT id, name FROM cms_author WHERE active ORDER BY name"),
    pool.query<{ id: string; name: string }>("SELECT id, name FROM cms_category ORDER BY name"),
  ]);
  return (
    <div>
      <Link href="/cms/generated-pages" className="inline-flex items-center gap-1.5 text-[0.8rem] font-600 text-slate-500 hover:text-[#543CDA]"><ArrowLeft size={15} /> Back to Generated Pages</Link>
      <h1 className="mt-3 text-[1.4rem] font-700 text-slate-900">Create Generated Page</h1>
      <p className="mt-1 text-[0.86rem] text-slate-500">Build an AI-optimized programmatic landing page.</p>
      <div className="mt-5"><GeneratedPageForm templates={rows.map((r) => r.name)} authors={authors} categories={categories} pages={linkPages} /></div>
    </div>
  );
}
