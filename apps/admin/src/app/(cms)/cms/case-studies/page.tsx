/**
 * Case Studies list (CMS design). Project showcases displayed on the Services / Industries pages. Columns
 * match the design: title, service/industry, project summary, status, display order, last updated, and row
 * actions. Header carries Export + Add Case Study. Admin only. Reads nexoris_cms.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, Plus, Download, Search, Star } from "lucide-react";
import { requireCmsAccess } from "../../../../lib/auth.js";
import { cmsDb } from "../../../../lib/cms-db.js";
import { RowActions } from "../../../../components/cms/RowActions.js";

export const dynamic = "force-dynamic";

interface Row { id: string; title: string; slug: string; service_industry: string | null; excerpt: string | null; status: string; display_order: number; featured: boolean; updated_at: string }
const STATUS: Record<string, { bg: string; fg: string; label: string }> = {
  published: { bg: "#DCFCE7", fg: "#16A34A", label: "Published" },
  draft: { bg: "#F1F5F9", fg: "#64748B", label: "Draft" },
  in_review: { bg: "#FEF3C7", fg: "#B45309", label: "In Review" },
  archived: { bg: "#F1F5F9", fg: "#94A3B8", label: "Archived" },
};

export default async function CaseStudiesPage(): Promise<ReactNode> {
  await requireCmsAccess();
  const { rows } = await cmsDb().query<Row>(
    `SELECT id, title, slug, service_industry, excerpt, status, display_order, featured,
            COALESCE(updated_at, created_at)::text AS updated_at
       FROM cms_content WHERE kind='case_study' ORDER BY display_order LIMIT 50`);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900">Case Studies</h1>
          <p className="mt-1 text-[0.86rem] text-slate-500">Project showcases displayed on your Services and Industries pages.</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/api/cms/export?report=case-studies" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[0.82rem] font-600 text-slate-700 hover:bg-slate-50"><Download size={14} /> Export CSV</a>
          <Link href="/cms/case-studies/new" className="inline-flex items-center gap-1.5 rounded-lg bg-[#543CDA] px-4 py-2 text-[0.82rem] font-600 text-white hover:bg-[#4330B8]"><Plus size={15} strokeWidth={2.4} /> Add Case Study</Link>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-subtle">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3">
          <div className="relative min-w-0 flex-1 sm:max-w-sm"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input placeholder="Search case studies..." className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-[0.83rem] focus:border-[#543CDA] focus:bg-white focus:outline-none" /></div>
          <div className="relative"><select className="cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-[0.8rem] font-600 text-slate-600"><option>All Services</option></select><ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500" /></div>
          <div className="relative"><select className="cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-[0.8rem] font-600 text-slate-600"><option>All Industries</option></select><ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500" /></div>
          <div className="relative"><select className="cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-[0.8rem] font-600 text-slate-600"><option>All Status</option><option>Published</option><option>Draft</option></select><ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500" /></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead><tr className="border-b border-slate-200 bg-slate-50 text-[0.66rem] uppercase tracking-wide text-slate-500"><th className="px-5 py-3 font-600">Title</th><th className="px-5 py-3 font-600">Service / Industry</th><th className="px-5 py-3 font-600">Project Summary</th><th className="px-5 py-3 font-600">Status</th><th className="px-5 py-3 font-600">Order</th><th className="px-5 py-3 font-600">Updated</th><th className="px-5 py-3 text-right font-600">Actions</th></tr></thead>
            <tbody>
              {rows.map((r) => {
                const s = STATUS[r.status] ?? STATUS.draft!;
                return (
                  <tr key={r.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                    <td className="px-5 py-3"><Link href={`/cms/case-studies/${r.id}`} className="inline-flex items-center gap-1.5 text-[0.85rem] font-600 text-slate-900 hover:text-[#543CDA]">{r.featured ? <Star size={13} className="text-[#F59E0B]" fill="#F59E0B" /> : null}{r.title}</Link></td>
                    <td className="px-5 py-3">{r.service_industry ? <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[0.72rem] font-500 text-slate-600">{r.service_industry}</span> : <span className="text-slate-300">—</span>}</td>
                    <td className="px-5 py-3"><span className="block max-w-[18rem] truncate text-[0.82rem] text-slate-500">{r.excerpt ?? "—"}</span></td>
                    <td className="px-5 py-3"><span className="inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-600" style={{ background: s.bg, color: s.fg }}>{s.label}</span></td>
                    <td className="px-5 py-3 text-[0.82rem] font-600 text-slate-600">{r.display_order}</td>
                    <td className="px-5 py-3 text-[0.8rem] text-slate-500">{new Date(r.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                    <td className="px-5 py-3 text-right"><RowActions id={r.id} kind="case_study" status={r.status} editHref={`/cms/case-studies/${r.id}`} viewHref={`https://nexoristech.com/case-studies/${r.slug}`} back="/cms/case-studies" label={r.title} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-5 py-3 text-[0.8rem] text-slate-500">
          <span>Showing 1 to {rows.length} of {rows.length} case studies</span>
        </div>
      </div>
    </div>
  );
}
