/**
 * Review Queue Dashboard (CMS Workflow design, PRD Part Two editorial workflow). An overview of everything
 * awaiting review: headline KPIs, a reviews-by-stage breakdown, and the queue table (title, type, author,
 * reviewer, stage, priority, due date). Every figure is derived live from cms_content.workflow_state. CMS
 * access only. Responsive: the table scrolls inside its own container down to 360px.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { ClipboardList, Sparkles, Scale, CalendarClock, RotateCcw, AlertTriangle, ArrowRight } from "lucide-react";
import { requireCmsAccess } from "../../../../lib/auth.js";
import { cmsDb } from "../../../../lib/cms-db.js";

export const dynamic = "force-dynamic";

interface Kpis { pending: string; ai_done: string; legal: string; scheduled: string; returned: string; overdue: string }
interface Stage { workflow_state: string; n: string }
interface Item { id: string; title: string; kind: string; author: string | null; reviewer: string | null; workflow_state: string; priority: string | null; review_due: string | null }
const STAGE_META: Record<string, { label: string; color: string }> = {
  pending_review: { label: "Pending", color: "#94A3B8" }, ai_review: { label: "AI Review", color: "#543CDA" },
  editorial_review: { label: "Editorial Review", color: "#3B82F6" }, legal_review: { label: "Legal Review", color: "#B45309" },
  ready_to_publish: { label: "Ready to Publish", color: "#16A34A" }, returned: { label: "Returned", color: "#DC2626" },
};
const KIND_LABEL: Record<string, string> = { insight: "Insight", case_study: "Case Study", legal_page: "Legal Page", generated_page: "Generated Page", job: "Job", testimonial: "Testimonial" };
/** Where each content kind is edited, so a queue row opens the thing you are meant to review. */
const KIND_PATH: Record<string, string> = {
  insight: "insights", case_study: "case-studies", legal_page: "legal-pages",
  generated_page: "generated-pages", job: "jobs", testimonial: "testimonials",
};
const editorHref = (kind: string, id: string): string => `/cms/${KIND_PATH[kind] ?? "insights"}/${id}`;
const PRIORITY: Record<string, { bg: string; fg: string }> = { High: { bg: "#FEE2E2", fg: "#DC2626" }, Medium: { bg: "#FEF3C7", fg: "#B45309" }, Low: { bg: "#F1F5F9", fg: "#64748B" } };

export default async function ReviewQueuePage(): Promise<ReactNode> {
  await requireCmsAccess();
  const pool = cmsDb();
  const [{ rows: [k] }, { rows: stages }, { rows: items }] = await Promise.all([
    pool.query<Kpis>(
      `SELECT count(*) FILTER (WHERE workflow_state IN ('pending_review','ai_review','editorial_review','legal_review'))::text pending,
              count(*) FILTER (WHERE workflow_state IN ('editorial_review','legal_review','ready_to_publish'))::text ai_done,
              count(*) FILTER (WHERE workflow_state='legal_review')::text legal,
              count(*) FILTER (WHERE workflow_state='scheduled')::text scheduled,
              count(*) FILTER (WHERE workflow_state='returned')::text returned,
              count(*) FILTER (WHERE workflow_state IN ('pending_review','ai_review','editorial_review','legal_review') AND review_due < now())::text overdue
         FROM cms_content WHERE workflow_state IS NOT NULL`),
    pool.query<Stage>("SELECT workflow_state, count(*)::text n FROM cms_content WHERE workflow_state IN ('ai_review','editorial_review','legal_review','ready_to_publish','returned') GROUP BY workflow_state"),
    pool.query<Item>(
      `SELECT c.id, c.title, c.kind, a.name AS author, c.reviewer, c.workflow_state, c.priority, c.review_due::text
         FROM cms_content c LEFT JOIN cms_author a ON a.id=c.author_id
        WHERE c.workflow_state IN ('pending_review','ai_review','editorial_review','legal_review','returned')
        ORDER BY c.review_due NULLS LAST LIMIT 20`),
  ]);

  const kpis = [
    { icon: ClipboardList, label: "Pending Reviews", value: k?.pending ?? "0", tint: "#EEEBFC", fg: "#543CDA" },
    { icon: Sparkles, label: "AI Review Complete", value: k?.ai_done ?? "0", tint: "#EEEBFC", fg: "#543CDA" },
    { icon: Scale, label: "Awaiting Legal Review", value: k?.legal ?? "0", tint: "#FEF3C7", fg: "#B45309" },
    { icon: CalendarClock, label: "Scheduled", value: k?.scheduled ?? "0", tint: "#DCFCE7", fg: "#16A34A" },
    { icon: RotateCcw, label: "Returned for Revision", value: k?.returned ?? "0", tint: "#F1F5F9", fg: "#64748B" },
    { icon: AlertTriangle, label: "Overdue Reviews", value: k?.overdue ?? "0", tint: "#FEE2E2", fg: "#DC2626" },
  ];
  const total = stages.reduce((s, x) => s + Number(x.n), 0) || 1;
  let acc = 0;
  const segs = stages.map((x) => { const start = acc / total * 360; acc += Number(x.n); const end = acc / total * 360; const m = STAGE_META[x.workflow_state] ?? { label: x.workflow_state, color: "#CBD5E1" }; return { ...x, start, end, m }; });
  const gradient = segs.length ? segs.map((s) => `${s.m.color} ${s.start}deg ${s.end}deg`).join(", ") : "#E2E8F0 0deg 360deg";

  return (
    <div>
      <h1 className="text-[1.4rem] font-700 text-slate-900">Review Queue</h1>
      <p className="mt-1 text-[0.86rem] text-slate-500">An overview of all content items awaiting review and action.</p>

      <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle">
            <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: c.tint, color: c.fg }}><c.icon size={17} /></span>
            <p className="mt-3 text-[1.5rem] font-700 text-slate-900">{c.value}</p>
            <p className="text-[0.74rem] text-slate-500">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.95rem] font-700 text-slate-900">Reviews by Stage</h2>
          <div className="mt-4 flex items-center gap-5">
            <div className="relative grid h-32 w-32 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(${gradient})` }}>
              <div className="grid h-20 w-20 place-items-center rounded-full bg-white text-center"><span><span className="block text-[1.3rem] font-700 text-slate-900">{total}</span><span className="block text-[0.62rem] text-slate-500">Total</span></span></div>
            </div>
            <div className="flex flex-col gap-1.5">
              {segs.map((s) => <div key={s.workflow_state} className="flex items-center gap-2 text-[0.78rem]"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.m.color }} /><span className="text-slate-600">{s.m.label}</span><span className="font-600 text-slate-800">{s.n}</span></div>)}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-subtle">
          <div className="border-b border-slate-100 px-5 py-3.5"><h2 className="text-[0.95rem] font-700 text-slate-900">Queue</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead><tr className="border-b border-slate-200 bg-slate-50 text-[0.66rem] uppercase tracking-wide text-slate-500"><th className="px-5 py-3 font-600">Title</th><th className="px-5 py-3 font-600">Type</th><th className="px-5 py-3 font-600">Author</th><th className="px-5 py-3 font-600">Reviewer</th><th className="px-5 py-3 font-600">Stage</th><th className="px-5 py-3 font-600">Priority</th><th className="px-5 py-3 font-600">Due Date</th><th className="px-5 py-3 text-right font-600">Actions</th></tr></thead>
              <tbody>
                {items.map((it) => {
                  const m = STAGE_META[it.workflow_state] ?? { label: it.workflow_state, color: "#94A3B8" };
                  const pr = PRIORITY[it.priority ?? "Medium"] ?? PRIORITY.Medium!;
                  const overdue = it.review_due != null && new Date(it.review_due) < new Date();
                  return (
                    <tr key={it.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                      <td className="px-5 py-3"><Link href={editorHref(it.kind, it.id)} title={it.title} className="block max-w-[16rem] truncate text-[0.85rem] font-600 text-slate-900 hover:text-[#543CDA]">{it.title}</Link></td>
                      <td className="px-5 py-3 text-[0.82rem] text-slate-600">{KIND_LABEL[it.kind] ?? it.kind}</td>
                      <td className="px-5 py-3 text-[0.82rem] text-slate-600">{it.author ?? "—"}</td>
                      <td className="px-5 py-3 text-[0.82rem] text-slate-600">{it.reviewer ?? "—"}</td>
                      <td className="px-5 py-3"><span className="inline-flex items-center gap-1.5 text-[0.8rem] font-600" style={{ color: m.color }}><span className="h-2 w-2 rounded-full" style={{ background: m.color }} />{m.label}</span></td>
                      <td className="px-5 py-3"><span className="inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-600" style={{ background: pr.bg, color: pr.fg }}>{it.priority ?? "Medium"}</span></td>
                      <td className="px-5 py-3 text-[0.8rem]"><span className={overdue ? "font-600 text-[#DC2626]" : "text-slate-500"}>{it.review_due ? new Date(it.review_due).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}</span></td>
                      <td className="px-5 py-3 text-right">
                        <Link href={editorHref(it.kind, it.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#543CDA]/25 bg-[#F4F1FD] px-3 py-1.5 text-[0.78rem] font-600 text-[#543CDA] hover:bg-[#EEEBFC]">
                          Review <ArrowRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-[0.8rem] text-slate-500">
            <span>Showing {items.length} items in review</span>
            <Link href="/cms/activity-log" className="font-600 text-[#543CDA] hover:underline">View activity log</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
