/**
 * Jobs list (CMS Careers design). Columns match the design: job title, department, type, work mode, live
 * application count, AI fit score, status (Open / Draft / Scheduled / Closed), published date, and row
 * actions. Job lifecycle maps onto the content status: Open = published, Closed = archived. CMS access
 * only. Reads nexoris_cms. Responsive: the table scrolls inside its own container down to 360px.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, Plus, Search, Star } from "lucide-react";
import { requireCmsAccess } from "../../../../lib/auth.js";
import { cmsDb } from "../../../../lib/cms-db.js";
import { RowActions } from "../../../../components/cms/RowActions.js";

export const dynamic = "force-dynamic";

interface Row { id: string; title: string; slug: string; department: string | null; employment_type: string | null; work_mode: string | null; apps: string; ai_fit_score: number | null; status: string; featured: boolean; published_at: string | null }
const STATUS: Record<string, { bg: string; fg: string; label: string }> = {
  published: { bg: "#DCFCE7", fg: "#16A34A", label: "Open" },
  draft: { bg: "#F1F5F9", fg: "#64748B", label: "Draft" },
  scheduled: { bg: "#EDE9FE", fg: "#6D28D9", label: "Scheduled" },
  archived: { bg: "#FEE2E2", fg: "#DC2626", label: "Closed" },
  in_review: { bg: "#FEF3C7", fg: "#B45309", label: "In Review" },
};
function fitColor(n: number | null): string { return n == null ? "#94A3B8" : n >= 85 ? "#16A34A" : n >= 70 ? "#B45309" : "#DC2626"; }

export default async function JobsPage(): Promise<ReactNode> {
  await requireCmsAccess();
  const { rows } = await cmsDb().query<Row>(
    `SELECT c.id, c.title, c.slug, c.department, c.employment_type, c.work_mode, c.ai_fit_score, c.status, c.featured,
            c.published_at::text,
            (SELECT count(*) FROM cms_content a WHERE a.kind='application' AND a.applied_job = c.title)::text AS apps
       FROM cms_content c WHERE c.kind='job' ORDER BY c.created_at DESC LIMIT 50`);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900">Jobs</h1>
          <p className="mt-1 text-[0.86rem] text-slate-500">Manage and publish job opportunities.</p>
        </div>
        <Link href="/cms/jobs/new" className="inline-flex items-center gap-1.5 rounded-lg bg-[#543CDA] px-4 py-2 text-[0.82rem] font-600 text-white hover:bg-[#4330B8]"><Plus size={15} strokeWidth={2.4} /> Create Job</Link>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-subtle">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3">
          <div className="relative min-w-0 flex-1 sm:max-w-xs"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input placeholder="Search jobs..." className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-[0.83rem] focus:border-[#543CDA] focus:bg-white focus:outline-none" /></div>
          <div className="relative"><select className="cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-[0.8rem] font-600 text-slate-600"><option>All Departments</option></select><ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500" /></div>
          <div className="relative"><select className="cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-[0.8rem] font-600 text-slate-600"><option>All Types</option></select><ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500" /></div>
          <div className="relative"><select className="cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-[0.8rem] font-600 text-slate-600"><option>All Statuses</option><option>Open</option><option>Draft</option><option>Closed</option></select><ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500" /></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left">
            <thead><tr className="border-b border-slate-200 bg-slate-50 text-[0.66rem] uppercase tracking-wide text-slate-500"><th className="px-5 py-3 font-600">Job Title</th><th className="px-5 py-3 font-600">Department</th><th className="px-5 py-3 font-600">Type</th><th className="px-5 py-3 font-600">Work Mode</th><th className="px-5 py-3 font-600">Applications</th><th className="px-5 py-3 font-600">AI Fit</th><th className="px-5 py-3 font-600">Status</th><th className="px-5 py-3 font-600">Published</th><th className="px-5 py-3 text-right font-600">Actions</th></tr></thead>
            <tbody>
              {rows.map((r) => {
                const s = STATUS[r.status] ?? STATUS.draft!;
                return (
                  <tr key={r.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                    <td className="px-5 py-3"><Link href={`/cms/jobs/${r.id}`} className="inline-flex items-center gap-1.5 text-[0.85rem] font-600 text-slate-900 hover:text-[#543CDA]">{r.featured ? <Star size={13} className="text-[#F59E0B]" fill="#F59E0B" /> : null}{r.title}</Link></td>
                    <td className="px-5 py-3 text-[0.82rem] text-slate-600">{r.department ?? "—"}</td>
                    <td className="px-5 py-3 text-[0.82rem] text-slate-600">{r.employment_type ?? "—"}</td>
                    <td className="px-5 py-3"><span className="rounded-md bg-slate-100 px-2 py-0.5 text-[0.72rem] font-500 text-slate-600">{r.work_mode ?? "—"}</span></td>
                    <td className="px-5 py-3 text-[0.84rem] font-600 text-slate-800">{r.apps}</td>
                    <td className="px-5 py-3"><span className="text-[0.84rem] font-700" style={{ color: fitColor(r.ai_fit_score) }}>{r.ai_fit_score == null ? "—" : `${r.ai_fit_score}%`}</span></td>
                    <td className="px-5 py-3"><span className="inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-600" style={{ background: s.bg, color: s.fg }}>{s.label}</span></td>
                    <td className="px-5 py-3 text-[0.8rem] text-slate-500">{r.published_at ? new Date(r.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : <span className="text-slate-300">—</span>}</td>
                    <td className="px-5 py-3 text-right"><RowActions id={r.id} kind="job" status={r.status} editHref={`/cms/jobs/${r.id}`} viewHref={`https://nexoristech.com/careers/${r.slug}`} back="/cms/jobs" label={r.title} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-5 py-3 text-[0.8rem] text-slate-500">
          <span>Showing 1 to {rows.length} of {rows.length} jobs</span>
        </div>
      </div>
    </div>
  );
}
