import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireCmsAccess } from "../../../../../lib/auth.js";
import { linkCandidates } from "../../../../../lib/link-candidates.js";
import { cmsDb } from "../../../../../lib/cms-db.js";
import { InsightEditor } from "../InsightEditor.js";

export const dynamic = "force-dynamic";

export default async function NewInsightPage(): Promise<ReactNode> {
  await requireCmsAccess();
  const pool = cmsDb();
  const [{ rows: categories }, { rows: authors }, pages] = await Promise.all([
    pool.query<{ id: string; name: string }>("SELECT id, name FROM cms_category WHERE active ORDER BY name"),
    pool.query<{ id: string; name: string; job_title: string | null; years_experience: string | null; expertise: string[] | null; bio: string | null }>(
      // The bio generator needs the author's real record, not just a name: without it an
      // E-E-A-T bio has nothing factual to stand on and a model invents credentials.
      "SELECT id, name, job_title, years_experience, expertise, bio FROM cms_author WHERE active ORDER BY name"),
    linkCandidates(pool),
  ]);
  return (
    <div>
      <Link href="/cms/insights" className="inline-flex items-center gap-1.5 text-[0.8rem] font-600 text-slate-500 hover:text-[#543CDA]"><ArrowLeft size={15} /> Back to Insights</Link>
      <h1 className="mt-3 text-[1.4rem] font-700 text-slate-900">New Insight</h1>
      <p className="mt-1 text-[0.86rem] text-slate-500">Write an article built to perform in search and AI answers.</p>
      <div className="mt-5"><InsightEditor categories={categories} authors={authors} pages={pages} /></div>
    </div>
  );
}
