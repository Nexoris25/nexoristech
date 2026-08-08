/**
 * Data Readiness (PRD §9.7 — the gate that holds programmatic pages back until they have real, distinct
 * substance).
 *
 * Every requirement here is MEASURED. The previous version listed 21 requirements with hardcoded
 * verdicts — "Competitor Insights: pending", "Brand Authority Signals: warning" — none of which the
 * platform could observe. A readiness gate that reports invented verdicts is worse than no gate: it
 * grants permission to publish on the strength of nothing.
 *
 * So the list is shorter and honest. Each row states what it counts, where the number came from, and
 * what it needs to pass. Anything the platform cannot observe is absent rather than guessed at.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { CheckCircle2, AlertTriangle, Clock, Database } from "lucide-react";
import { requireCmsAccess } from "../../../../lib/auth.js";
import { cmsDb } from "../../../../lib/cms-db.js";

export const dynamic = "force-dynamic";

type Status = "ready" | "warning" | "pending";

const MAP: Record<Status, { icon: typeof CheckCircle2; color: string; bg: string; label: string }> = {
  ready: { icon: CheckCircle2, color: "#15803D", bg: "#DCFCE7", label: "Ready" },
  warning: { icon: AlertTriangle, color: "#B45309", bg: "#FEF3C7", label: "Thin" },
  pending: { icon: Clock, color: "#475569", bg: "#F1F5F9", label: "Missing" },
};

interface Requirement {
  label: string;
  /** What was counted, so the verdict can be checked rather than taken on trust. */
  detail: string;
  count: number;
  /** At or above this it passes; below half of it, it is missing rather than merely thin. */
  target: number;
  href?: string;
}

function statusOf(r: Requirement): Status {
  if (r.count >= r.target) return "ready";
  return r.count >= Math.ceil(r.target / 2) ? "warning" : "pending";
}

function Gauge({ value }: { value: number }): ReactNode {
  const r = 40, c = 2 * Math.PI * r, off = c - (value / 100) * c;
  const color = value >= 80 ? "#15803D" : value >= 60 ? "#B45309" : "#DC2626";
  const sub = value >= 80 ? "Ready" : value >= 60 ? "Partial" : "Not ready";
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-28 w-28">
        <svg viewBox="0 0 96 96" className="h-28 w-28 -rotate-90" role="img" aria-label={`Readiness ${value} percent`}>
          <circle cx="48" cy="48" r={r} fill="none" stroke="#EEF2F7" strokeWidth="8" />
          <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <span className="block text-[1.5rem] font-700 text-slate-900">{value}%</span>
        </div>
      </div>
      <span className="mt-1 text-[0.82rem] font-700" style={{ color }}>{sub}</span>
    </div>
  );
}

interface Counts {
  insights: string; case_studies: string; testimonials: string; jobs: string;
  authors: string; categories: string; media: string; proposals: string;
  demand_days: string; impressions: string; gated_pages: string;
}

export default async function DataReadinessPage(): Promise<ReactNode> {
  await requireCmsAccess();

  const { rows } = await cmsDb().query<Counts>(`
    SELECT
      (SELECT count(*) FROM cms_content WHERE kind='insight' AND status='published')::text AS insights,
      (SELECT count(*) FROM cms_content WHERE kind='case_study' AND status='published')::text AS case_studies,
      (SELECT count(*) FROM cms_content WHERE kind='testimonial' AND status='published')::text AS testimonials,
      (SELECT count(*) FROM cms_content WHERE kind='job' AND status='published')::text AS jobs,
      (SELECT count(*) FROM cms_author WHERE active)::text AS authors,
      (SELECT count(*) FROM cms_category)::text AS categories,
      (SELECT count(*) FROM cms_media)::text AS media,
      (SELECT count(*) FROM cms_proposal WHERE status='Pending')::text AS proposals,
      (SELECT count(*) FROM cms_metric_daily WHERE day > current_date - 28 AND impressions > 0)::text AS demand_days,
      (SELECT coalesce(sum(impressions),0) FROM cms_metric_daily WHERE day > current_date - 28)::text AS impressions,
      (SELECT count(*) FROM cms_content WHERE kind='generated_page' AND status <> 'published')::text AS gated_pages
  `);
  const c = rows[0]!;
  const n = (v: string): number => Number(v);

  // Targets are the minimum a page generator needs to draw on before it can produce something distinct.
  const requirements: Requirement[] = [
    { label: "Search demand", detail: `${n(c.impressions).toLocaleString("en-NG")} impressions across ${c.demand_days} of the last 28 days`, count: n(c.demand_days), target: 14, href: "/cms/seo" },
    { label: "Keyword proposals", detail: `${c.proposals} awaiting a decision`, count: n(c.proposals), target: 10, href: "/cms/proposals" },
    { label: "Published insights", detail: `${c.insights} live articles to link from`, count: n(c.insights), target: 20, href: "/cms/insights" },
    { label: "Case studies", detail: `${c.case_studies} published`, count: n(c.case_studies), target: 6, href: "/cms/case-studies" },
    { label: "Testimonials", detail: `${c.testimonials} published`, count: n(c.testimonials), target: 10, href: "/cms/testimonials" },
    { label: "Authors", detail: `${c.authors} active, for attribution and E-E-A-T`, count: n(c.authors), target: 3, href: "/cms/authors" },
    { label: "Categories", detail: `${c.categories} defined`, count: n(c.categories), target: 4, href: "/cms/categories" },
    { label: "Media library", detail: `${n(c.media).toLocaleString("en-NG")} assets available`, count: n(c.media), target: 50, href: "/cms/media" },
    { label: "Open roles", detail: `${c.jobs} published`, count: n(c.jobs), target: 1, href: "/cms/jobs" },
  ];

  const ready = requirements.filter((r) => statusOf(r) === "ready").length;
  const score = Math.round((ready / requirements.length) * 100);
  const gated = n(c.gated_pages);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900">Data Readiness</h1>
          <p className="mt-1 text-[0.86rem] text-slate-500">Whether there is enough real material to generate distinct pages. Every figure below is counted from the CMS.</p>
        </div>
        <Link href="/cms/proposals" className="inline-flex items-center gap-1.5 rounded-lg bg-[#543CDA] px-4 py-2 text-[0.82rem] font-600 text-white hover:bg-[#4330B8]">
          <Database size={15} /> Review proposals
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[300px_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <Gauge value={score} />
          <p className="mt-4 text-center text-[0.8rem] text-slate-500">Overall readiness</p>
          <div className="mt-3 rounded-lg bg-[#F4F1FD] p-3 text-center">
            <p className="text-[1.2rem] font-700 text-[#543CDA]">{ready} / {requirements.length}</p>
            <p className="text-[0.74rem] font-600 text-slate-600">Requirements met</p>
          </div>
          {gated > 0 ? (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-[0.76rem] leading-relaxed text-amber-900">
              {gated.toLocaleString("en-NG")} generated pages are held back from publication by the §9.7 gate.
            </p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.95rem] font-700 text-slate-900">Data requirements</h2>
          <p className="mt-0.5 text-[0.78rem] text-slate-600">Each row states what was counted and the minimum it needs.</p>
          <ul className="mt-3 flex flex-col">
            {requirements.map((r) => {
              const m = MAP[statusOf(r)];
              return (
                <li key={r.label} className="flex items-start gap-2.5 border-b border-slate-100 py-3 last:border-b-0">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full" style={{ background: m.bg, color: m.color }}>
                    <m.icon size={13} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.85rem] font-600 text-slate-900">
                      {r.href ? <Link href={r.href} className="hover:text-[#543CDA]">{r.label}</Link> : r.label}
                    </span>
                    <span className="block text-[0.76rem] text-slate-600">{r.detail}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-[0.76rem] font-700" style={{ color: m.color }}>{m.label}</span>
                    <span className="block text-[0.72rem] text-slate-500">{r.count} of {r.target}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
