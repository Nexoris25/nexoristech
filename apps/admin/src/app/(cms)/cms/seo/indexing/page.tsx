/**
 * Index Coverage (PRD §12.1). What Google has indexed, and what is holding the rest back.
 *
 * The screen previously called every published page "Indexed". Publishing is a decision we make; indexing
 * is a decision Google makes, and the two are not the same number. The indexed figure now comes from
 * Search Console — a page cannot receive an impression unless it is indexed — and the publishing state is
 * shown beside it as our own surface, clearly labelled as such.
 *
 * The gap between the two is the useful number, and it is the one an editor should act on, so it is
 * stated plainly rather than left to be worked out.
 *
 * CMS access only. Responsive.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Search as SearchIcon, Bot, AlertTriangle, PlugZap, ChevronRight } from "lucide-react";
import { requireCmsAccess } from "../../../../../lib/auth.js";
import { cmsDb } from "../../../../../lib/cms-db.js";
import { STATIC_COUNTS } from "../../../../../lib/site-pages.js";
import { fetchGscIndexedPageCount } from "../../../../../lib/google/gsc.js";
import { auditCounts, ISSUES, PUBLIC_KINDS_SQL } from "../../../../../lib/seo-audit.js";

export const dynamic = "force-dynamic";

const INDEX_WINDOW_DAYS = 90;

interface Cov { published: string; draft: string; scheduled: string; noindexed: string; total: string; not_ready: string }

export default async function IndexingPage(): Promise<ReactNode> {
  await requireCmsAccess();
  const [{ rows: [c] }, gscIndexed, audit] = await Promise.all([
    cmsDb().query<Cov>(
      `SELECT count(*) FILTER (WHERE status='published' AND coalesce(noindex,false)=false)::text published,
              count(*) FILTER (WHERE status IN ('draft','in_review'))::text draft,
              count(*) FILTER (WHERE status='scheduled')::text scheduled,
              count(*) FILTER (WHERE status='published' AND coalesce(noindex,false)=true)::text noindexed,
              count(*)::text total,
              count(*) FILTER (WHERE kind='generated_page' AND status<>'published' AND COALESCE(readiness_score,0) < 80)::text not_ready
         FROM cms_content WHERE kind IN ${PUBLIC_KINDS_SQL}`),
    fetchGscIndexedPageCount(INDEX_WINDOW_DAYS),
    auditCounts(),
  ]);

  // The hardcoded static routes are always live, so they are part of the publishable surface.
  const staticTotal = STATIC_COUNTS.total;
  const publishable = Number(c?.published ?? 0) + staticTotal;
  const draft = Number(c?.draft ?? 0);
  const scheduled = Number(c?.scheduled ?? 0);
  const noindexed = Number(c?.noindexed ?? 0);
  const connected = gscIndexed !== null;
  // Google can index a URL we no longer publish, so the gap is floored at zero rather than shown negative.
  const notYetIndexed = connected ? Math.max(0, publishable - gscIndexed) : null;

  const kpis = [
    {
      icon: CheckCircle2, label: "Indexed by Google", value: connected ? gscIndexed.toLocaleString("en-NG") : "—",
      foot: connected ? `Served in search, last ${INDEX_WINDOW_DAYS} days` : "Search Console not connected",
      tint: "#DCFCE7", fg: "#15803D",
    },
    {
      icon: Bot, label: "Published by us", value: publishable.toLocaleString("en-NG"),
      foot: "Live pages open to crawling", tint: "#EEEBFC", fg: "#543CDA",
    },
    {
      icon: SearchIcon, label: "Not yet indexed", value: notYetIndexed === null ? "—" : notYetIndexed.toLocaleString("en-NG"),
      foot: notYetIndexed === null ? "Needs Search Console" : "Published but not seen in results",
      tint: notYetIndexed ? "#FEF3C7" : "#F1F5F9", fg: notYetIndexed ? "#B45309" : "#475569",
    },
    {
      icon: Circle, label: "Held back by us", value: (draft + scheduled + noindexed).toLocaleString("en-NG"),
      foot: "Draft, scheduled, or marked no-index", tint: "#EEEBFC", fg: "#543CDA",
    },
  ];

  const cov = [
    { label: "Indexed", n: connected ? gscIndexed : 0, color: "#15803D" },
    { label: "Not yet indexed", n: notYetIndexed ?? 0, color: "#B45309" },
    { label: "Draft or in review", n: draft, color: "#DC2626" },
    { label: "Scheduled", n: scheduled, color: "#6A55F2" },
    { label: "Marked no-index", n: noindexed, color: "#CBD5E1" },
  ].filter((x) => x.n > 0);
  const covTotal = cov.reduce((s, x) => s + x.n, 0);
  let acc = 0;
  const segs = cov.map((x) => {
    const start = covTotal > 0 ? (acc / covTotal) * 360 : 0;
    acc += x.n;
    return { ...x, s: start, e: covTotal > 0 ? (acc / covTotal) * 360 : 0 };
  });
  const grad = covTotal > 0 ? segs.map((s) => `${s.color} ${s.s}deg ${s.e}deg`).join(", ") : "#E2E8F0 0deg 360deg";

  // What is actually stopping a page from being indexed or from earning a rich result, each linking to
  // the pages it affects so the number is a route to the fix.
  const blockers = ISSUES
    .map((i) => ({ id: i.id, label: i.label, n: audit.byIssue[i.id], severity: i.severity }))
    .filter((i) => i.n > 0)
    .sort((a, b) => (a.severity === b.severity ? b.n - a.n : a.severity === "error" ? -1 : 1));
  const gateHeld = Number(c?.not_ready ?? 0);

  return (
    <div>
      <h1 className="text-[1.4rem] font-700 text-slate-900">Indexing Status</h1>
      <p className="mt-1 max-w-3xl text-[0.86rem] leading-relaxed text-slate-600">
        Indexing is Google&apos;s decision, publishing is ours. The first figure is measured in Search
        Console; the rest describe our own surface.
      </p>

      {!connected && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-4">
          <PlugZap size={16} className="mt-0.5 shrink-0 text-slate-500" />
          <p className="text-[0.8rem] leading-relaxed text-slate-600">
            Search Console is not connected, so there is no way to know what Google has indexed. Set
            GSC_PROPERTY and authorise the account. Until then the indexed figures stay blank rather than
            being filled in with the count of what we published.
          </p>
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle">
            <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: k.tint, color: k.fg }}><k.icon size={17} /></span>
            <p className="mt-3 text-[1.5rem] font-700" style={{ color: k.fg }}>{k.value}</p>
            <p className="text-[0.78rem] font-600 text-slate-700">{k.label}</p>
            <p className="mt-0.5 text-[0.72rem] text-slate-600">{k.foot}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.95rem] font-700 text-slate-900">Coverage</h2>
          <p className="mt-0.5 text-[0.78rem] text-slate-600">Every public page, by where it stands.</p>
          <div className="mt-4 flex flex-wrap items-center gap-6">
            <div className="relative grid h-36 w-36 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(${grad})` }}>
              <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center">
                <span>
                  <span className="block text-[1.3rem] font-700 text-slate-900">{covTotal.toLocaleString("en-NG")}</span>
                  <span className="block text-[0.62rem] text-slate-600">Pages</span>
                </span>
              </div>
            </div>
            <ul className="flex min-w-0 flex-1 flex-col gap-2 text-[0.82rem]">
              {segs.length === 0
                ? <li className="text-slate-600">Nothing published yet.</li>
                : segs.map((s) => (
                    <li key={s.label} className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: s.color }} />
                      <span className="min-w-0 flex-1 truncate text-slate-700">{s.label}</span>
                      <span className="shrink-0 font-600 text-slate-900">{s.n.toLocaleString("en-NG")}</span>
                    </li>
                  ))}
            </ul>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.95rem] font-700 text-slate-900">What to fix</h2>
          <p className="mt-0.5 text-[0.78rem] text-slate-600">Open a row to see the pages and correct them.</p>
          <ul className="mt-3 divide-y divide-slate-100">
            {blockers.length === 0 && gateHeld === 0 ? (
              <li className="flex items-center gap-3 py-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#DCFCE7] text-[#15803D]"><CheckCircle2 size={15} /></span>
                <span className="text-[0.85rem] font-600 text-slate-800">No published page has an outstanding issue.</span>
              </li>
            ) : null}
            {blockers.map((b) => {
              const tone = b.severity === "error" ? { fg: "#DC2626", bg: "#FEE2E2" } : { fg: "#B45309", bg: "#FEF3C7" };
              return (
                <li key={b.id}>
                  <Link href={`/cms/seo/settings/issues/${b.id}`}
                    className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#543CDA]">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ background: tone.bg, color: tone.fg }}><AlertTriangle size={15} /></span>
                    <span className="min-w-0 flex-1 text-[0.84rem] font-600 text-slate-800">{b.label}</span>
                    <span className="shrink-0 text-[0.9rem] font-700" style={{ color: tone.fg }}>{b.n.toLocaleString("en-NG")}</span>
                    <ChevronRight size={15} className="shrink-0 text-slate-400" />
                  </Link>
                </li>
              );
            })}
            {gateHeld > 0 && (
              <li>
                <Link href="/cms/quality-gate"
                  className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#543CDA]">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#FEF3C7] text-[#B45309]"><AlertTriangle size={15} /></span>
                  <span className="min-w-0 flex-1 text-[0.84rem] font-600 text-slate-800">Programmatic pages held by the readiness gate</span>
                  <span className="shrink-0 text-[0.9rem] font-700 text-[#B45309]">{gateHeld.toLocaleString("en-NG")}</span>
                  <ChevronRight size={15} className="shrink-0 text-slate-400" />
                </Link>
              </li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
