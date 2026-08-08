import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireCmsAccess } from "../../../../../lib/auth.js";
import { cmsDb } from "../../../../../lib/cms-db.js";
import { LegalPageForm } from "../LegalPageForm.js";

export const dynamic = "force-dynamic";

interface Row { id: string; title: string; slug: string | null; version: string | null; effective_date: string | null; body: string | null; status: string; visible_in_footer: boolean; require_acceptance: boolean; meta_title: string | null; meta_description: string | null }

export default async function EditLegalPage({ params }: { params: Promise<{ id: string }> }): Promise<ReactNode> {
  await requireCmsAccess();
  const { id } = await params;
  const { rows } = await cmsDb().query<Row>(
    `SELECT id, title, slug, version, effective_date::text, body, status, visible_in_footer, require_acceptance,
            meta_title, meta_description FROM cms_content WHERE id=$1 AND kind='legal_page'`, [id]);
  const r = rows[0];
  if (!r) notFound();
  return (
    <div>
      <Link href="/cms/legal-pages" className="inline-flex items-center gap-1.5 text-[0.8rem] font-600 text-slate-500 hover:text-[#543CDA]"><ArrowLeft size={15} /> Back to Legal Pages</Link>
      <h1 className="mt-3 text-[1.4rem] font-700 text-slate-900">Edit Legal Page</h1>
      <p className="mt-1 text-[0.86rem] text-slate-500">{r.title} · v{r.version ?? "1.0"}</p>
      <div className="mt-5">
        <LegalPageForm initial={{
          id: r.id, title: r.title, slug: r.slug ?? "", version: r.version ?? "1.0",
          effectiveDate: r.effective_date ?? "", body: r.body ?? "", status: r.status,
          visibleInFooter: r.visible_in_footer, requireAcceptance: r.require_acceptance,
          metaTitle: r.meta_title ?? "", metaDescription: r.meta_description ?? "",
        }} />
      </div>
    </div>
  );
}
