/**
 * Testimonials list (CMS design). Customer quotes shown across the site. Columns match the design:
 * customer (avatar + name + title), company, star rating, featured, status, display order, and actions.
 * Admin only. Reads nexoris_cms.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, Plus, Search, Star } from "lucide-react";
import { requireCmsAccess } from "../../../../lib/auth.js";
import { cmsDb } from "../../../../lib/cms-db.js";
import { RowActions } from "../../../../components/cms/RowActions.js";

export const dynamic = "force-dynamic";

interface Row { id: string; title: string; customer_title: string | null; company: string | null; rating: number | null; featured: boolean; status: string; display_order: number; featured_image: string | null }
const STATUS: Record<string, { bg: string; fg: string; label: string }> = {
  published: { bg: "#DCFCE7", fg: "#16A34A", label: "Published" },
  draft: { bg: "#F1F5F9", fg: "#64748B", label: "Draft" },
  in_review: { bg: "#FEF3C7", fg: "#B45309", label: "In Review" },
  archived: { bg: "#F1F5F9", fg: "#94A3B8", label: "Archived" },
};
const AV = ["#543CDA", "#14B8A6", "#3B82F6", "#F59E0B", "#EC4899", "#8B5CF6"];

function Stars({ n }: { n: number }): ReactNode {
  return <span className="inline-flex items-center gap-0.5">{[1, 2, 3, 4, 5].map((i) => <Star key={i} size={13} className={i <= n ? "text-[#F59E0B]" : "text-slate-200"} fill={i <= n ? "#F59E0B" : "#E2E8F0"} />)}</span>;
}

export default async function TestimonialsPage(): Promise<ReactNode> {
  await requireCmsAccess();
  const { rows } = await cmsDb().query<Row>(
    `SELECT id, title, customer_title, company, rating, featured, status, display_order, featured_image
       FROM cms_content WHERE kind='testimonial' ORDER BY display_order LIMIT 50`);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900">Testimonials</h1>
          <p className="mt-1 text-[0.86rem] text-slate-500">Manage customer testimonials shown across your site.</p>
        </div>
        <Link href="/cms/testimonials/new" className="inline-flex items-center gap-1.5 rounded-lg bg-[#543CDA] px-4 py-2 text-[0.82rem] font-600 text-white hover:bg-[#4330B8]"><Plus size={15} strokeWidth={2.4} /> Add Testimonial</Link>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-subtle">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3">
          <div className="relative min-w-0 flex-1 sm:max-w-sm"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input placeholder="Search testimonials..." className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-[0.83rem] focus:border-[#543CDA] focus:bg-white focus:outline-none" /></div>
          <div className="relative"><select className="cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-[0.8rem] font-600 text-slate-600"><option>All Status</option><option>Published</option><option>Draft</option></select><ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500" /></div>
          <div className="relative"><select className="cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-[0.8rem] font-600 text-slate-600"><option>All Ratings</option><option>5 stars</option><option>4 stars</option></select><ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500" /></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left">
            <thead><tr className="border-b border-slate-200 bg-slate-50 text-[0.66rem] uppercase tracking-wide text-slate-500"><th className="px-5 py-3 font-600">Customer</th><th className="px-5 py-3 font-600">Company</th><th className="px-5 py-3 font-600">Rating</th><th className="px-5 py-3 font-600">Featured</th><th className="px-5 py-3 font-600">Status</th><th className="px-5 py-3 font-600">Order</th><th className="px-5 py-3 text-right font-600">Actions</th></tr></thead>
            <tbody>
              {rows.map((r, i) => {
                const s = STATUS[r.status] ?? STATUS.draft!;
                return (
                  <tr key={r.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                    <td className="px-5 py-3">
                      <Link href={`/cms/testimonials/${r.id}`} className="flex items-center gap-3">
                        {r.featured_image
                          ? <img src={r.featured_image} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                          : <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full font-mono text-[0.64rem] font-700 text-white" style={{ background: AV[i % AV.length] }}>{r.title.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase()}</span>}
                        <span className="min-w-0"><span className="block text-[0.85rem] font-600 text-slate-900">{r.title}</span><span className="block truncate text-[0.74rem] text-slate-500">{r.customer_title ?? ""}</span></span>
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-[0.82rem] text-slate-600">{r.company ?? "—"}</td>
                    <td className="px-5 py-3"><Stars n={r.rating ?? 0} /></td>
                    <td className="px-5 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-[0.72rem] font-600 ${r.featured ? "bg-[#FEF3C7] text-[#B45309]" : "bg-slate-100 text-slate-600"}`}>{r.featured ? "Yes" : "No"}</span></td>
                    <td className="px-5 py-3"><span className="inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-600" style={{ background: s.bg, color: s.fg }}>{s.label}</span></td>
                    <td className="px-5 py-3 text-[0.82rem] font-600 text-slate-600">{r.display_order}</td>
                    <td className="px-5 py-3 text-right"><RowActions id={r.id} kind="testimonial" status={r.status} editHref={`/cms/testimonials/${r.id}`} back="/cms/testimonials" label={r.title} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-5 py-3 text-[0.8rem] text-slate-500">
          <span>Showing 1 to {rows.length} of {rows.length} testimonials</span>
        </div>
      </div>
    </div>
  );
}
