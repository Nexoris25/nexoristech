/**
 * Author profile (CMS design). A gradient banner with the headshot and key facts, a row of derived stats
 * (published insights, total views, avg read time, expertise count), the bio, and the author's Articles
 * table. All figures come live from the author's own content. Admin only. Reads nexoris_cms.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, MapPin, Briefcase, Star, Eye, FileText, Clock, Tag, ExternalLink } from "lucide-react";
import { requireCmsAccess } from "../../../../../lib/auth.js";
import { cmsDb } from "../../../../../lib/cms-db.js";
import { requireUuid } from "../../../../../lib/route-params.js";

export const dynamic = "force-dynamic";

interface Author { id: string; name: string; email: string | null; role: string; job_title: string | null; department: string | null; location: string | null; years_experience: number | null; expertise: string[]; bio: string | null; headshot_url: string | null; featured: boolean; active: boolean; last_active_at: string; profile_html: string | null; linkedin_url: string | null; x_url: string | null }
interface Stat { pub: string; views: string; avg_read: string | null }
interface Article { id: string; title: string; category: string | null; status: string; published_at: string | null; views: string; read_time_min: number | null }
function abbr(n: number): string { return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : String(n); }
const STATUS: Record<string, { bg: string; fg: string; label: string }> = {
  published: { bg: "#DCFCE7", fg: "#16A34A", label: "Published" },
  in_review: { bg: "#FEF3C7", fg: "#B45309", label: "In Review" },
  draft: { bg: "#F1F5F9", fg: "#64748B", label: "Draft" },
  scheduled: { bg: "#EDE9FE", fg: "#6D28D9", label: "Scheduled" },
  archived: { bg: "#F1F5F9", fg: "#94A3B8", label: "Archived" },
};

export default async function AuthorProfilePage({ params }: { params: Promise<{ id: string }> }): Promise<ReactNode> {
  await requireCmsAccess();
  const { id } = await params;
  requireUuid(id);
  const pool = cmsDb();
  const [{ rows: aRows }, { rows: sRows }, { rows: articles }] = await Promise.all([
    pool.query<Author>(
      `SELECT id, name, email, role, job_title, department, location, years_experience, expertise, bio,
              headshot_url, featured, active, last_active_at::text, profile_html, linkedin_url, x_url
         FROM cms_author WHERE id=$1`, [id]),
    pool.query<Stat>(
      `SELECT (SELECT count(*) FROM cms_content WHERE author_id=$1 AND kind='insight' AND status='published')::text pub,
              (SELECT COALESCE(sum(views),0) FROM cms_content WHERE author_id=$1)::text views,
              (SELECT round(avg(read_time_min)) FROM cms_content WHERE author_id=$1 AND read_time_min IS NOT NULL)::text avg_read`, [id]),
    pool.query<Article>(
      `SELECT c.id, c.title, cat.name AS category, c.status, c.published_at::text, c.views::text, c.read_time_min
         FROM cms_content c LEFT JOIN cms_category cat ON cat.id=c.category_id
        WHERE c.author_id=$1 AND c.kind='insight' ORDER BY c.published_at DESC NULLS LAST LIMIT 20`, [id]),
  ]);
  const a = aRows[0];
  if (!a) notFound();
  const s = sRows[0] ?? { pub: "0", views: "0", avg_read: null };
  const initials = a.name.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  const stats = [
    { icon: FileText, label: "Published Insights", value: s.pub },
    { icon: Eye, label: "Total Views", value: abbr(+s.views) },
    { icon: Clock, label: "Avg. Read Time", value: s.avg_read ? `${s.avg_read} min` : "—" },
    { icon: Tag, label: "Areas of Expertise", value: String(a.expertise.length) },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/cms/authors" className="inline-flex items-center gap-1.5 text-[0.8rem] font-600 text-slate-500 hover:text-[#543CDA]"><ArrowLeft size={15} /> Back to Authors</Link>
        <Link href={`/cms/authors/${a.id}/edit`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-[0.82rem] font-600 text-slate-700 hover:bg-slate-50"><Pencil size={14} /> Edit Author</Link>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-subtle">
        <div className="h-24 bg-gradient-to-r from-[#543CDA] to-[#6A55F2]" />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex flex-wrap items-end gap-4">
            {a.headshot_url ? <img src={a.headshot_url} alt="" className="h-20 w-20 rounded-2xl border-4 border-white object-cover shadow" /> : <span className="grid h-20 w-20 place-items-center rounded-2xl border-4 border-white bg-gradient-to-br from-[#543CDA] to-[#6A55F2] font-mono text-[1.1rem] font-700 text-white shadow">{initials}</span>}
            <div className="flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[1.3rem] font-700 text-slate-900">{a.name}</h1>
                {a.featured ? <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF3C7] px-2.5 py-1 text-[0.72rem] font-600 text-[#B45309]"><Star size={12} /> Featured</span> : null}
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-600 ${a.active ? "bg-[#DCFCE7] text-[#15803D]" : "bg-slate-100 text-slate-600"}`}>{a.active ? "Active" : "Inactive"}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.82rem] text-slate-500">
                <span className="inline-flex items-center gap-1"><Briefcase size={13} className="text-slate-500" />{a.job_title ?? a.role}{a.department ? ` · ${a.department}` : ""}</span>
                {a.location ? <span className="inline-flex items-center gap-1"><MapPin size={13} className="text-slate-500" />{a.location}</span> : null}
                {a.email ? <span>{a.email}</span> : null}
              </div>
            </div>
          </div>

          {a.expertise.length ? <div className="mt-4 flex flex-wrap gap-1.5">{a.expertise.map((e) => <span key={e} className="rounded-md bg-[#EEEBFC] px-2.5 py-1 text-[0.74rem] font-500 text-[#543CDA]">{e}</span>)}</div> : null}
          {a.bio ? <p className="mt-4 max-w-3xl text-[0.88rem] leading-relaxed text-slate-600">{a.bio}</p> : null}
          {a.linkedin_url || a.x_url ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {a.linkedin_url ? <a href={a.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[0.76rem] font-600 text-slate-600 hover:bg-slate-50"><ExternalLink size={13} /> LinkedIn</a> : null}
              {a.x_url ? <a href={a.x_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[0.76rem] font-600 text-slate-600 hover:bg-slate-50"><ExternalLink size={13} /> X</a> : null}
            </div>
          ) : null}
          {/* The profile page. Whether an author has one at all is the thing to see at a glance. */}
          <p className="mt-3 text-[0.78rem] text-slate-500">
            {a.profile_html
              ? <>Author page written · <a href={`/cms/authors/${a.id}/edit`} className="font-600 text-[#543CDA] hover:underline">edit it</a></>
              : <>No author page written yet. <a href={`/cms/authors/${a.id}/edit`} className="font-600 text-[#543CDA] hover:underline">Write one</a> so the byline stands for something.</>}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((st) => (
          <div key={st.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#EEEBFC] text-[#543CDA]"><st.icon size={17} /></span>
            <p className="mt-3 text-[1.4rem] font-700 text-slate-900">{st.value}</p>
            <p className="text-[0.78rem] text-slate-500">{st.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white shadow-subtle">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5"><h2 className="text-[0.95rem] font-700 text-slate-900">Articles by {a.name.split(/\s+/)[0]}</h2><span className="text-[0.78rem] text-slate-500">{articles.length} shown</span></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead><tr className="border-b border-slate-200 bg-slate-50 text-[0.66rem] uppercase tracking-wide text-slate-500"><th className="px-5 py-3 font-600">Title</th><th className="px-5 py-3 font-600">Category</th><th className="px-5 py-3 font-600">Status</th><th className="px-5 py-3 font-600">Published</th><th className="px-5 py-3 font-600">Views</th><th className="px-5 py-3 font-600">Read Time</th></tr></thead>
            <tbody>
              {articles.length === 0 ? <tr><td colSpan={6} className="px-5 py-10 text-center text-[0.85rem] text-slate-500">No articles yet.</td></tr> : articles.map((r) => {
                const st = STATUS[r.status] ?? STATUS.draft!;
                return (
                  <tr key={r.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                    <td className="px-5 py-3"><Link href={`/cms/insights/${r.id}`} className="block max-w-[20rem] truncate text-[0.85rem] font-600 text-slate-900 hover:text-[#543CDA]">{r.title}</Link></td>
                    <td className="px-5 py-3">{r.category ? <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[0.72rem] font-500 text-slate-600">{r.category}</span> : <span className="text-slate-300">—</span>}</td>
                    <td className="px-5 py-3"><span className="inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-600" style={{ background: st.bg, color: st.fg }}>{st.label}</span></td>
                    <td className="px-5 py-3 text-[0.8rem] text-slate-600">{r.published_at ? new Date(r.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : <span className="text-slate-300">—</span>}</td>
                    <td className="px-5 py-3 text-[0.82rem] font-600 text-slate-700">{abbr(+r.views)}</td>
                    <td className="px-5 py-3 text-[0.8rem] text-slate-500">{r.read_time_min ? `${r.read_time_min} min` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
