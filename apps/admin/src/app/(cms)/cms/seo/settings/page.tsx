/**
 * SEO Settings (PRD §9). The site's global SEO state: a health score, how many pages Google has actually
 * indexed, the structured-data audit, and the metadata gaps — each one leading to the pages that need it.
 *
 * Three things here used to be assertions rather than measurements. "Indexed Pages" counted what we had
 * published, which says nothing about what Google indexed. Schema Status showed a fixed 23 / 19 / 3 / 1
 * that no check produced. Rich Results Eligible was arithmetic on metadata gaps rather than a look at the
 * structured data the site emits. All three now come from lib/seo-audit and Search Console.
 *
 * The metadata rows are links: each one opens the list of pages carrying that issue, with an edit link
 * per page, so a gap can be closed from here in two clicks.
 *
 * CMS access only. Responsive.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { Gauge, FileCheck2, AlertTriangle, Sparkles, ChevronRight, ShieldCheck, CircleAlert, PlugZap } from "lucide-react";
import { requireCmsAccess } from "../../../../../lib/auth.js";
import { STATIC_COUNTS } from "../../../../../lib/site-pages.js";
import { auditCounts, ISSUES, scoreColor } from "../../../../../lib/seo-audit.js";
import { fetchGscIndexedPageCount } from "../../../../../lib/google/gsc.js";

export const dynamic = "force-dynamic";

const INDEX_WINDOW_DAYS = 90;

export default async function SeoSettingsPage(): Promise<ReactNode> {
  await requireCmsAccess();
  const [audit, gscIndexed] = await Promise.all([
    auditCounts(),
    fetchGscIndexedPageCount(INDEX_WINDOW_DAYS),
  ]);

  // The hardcoded static routes ship with hand-written metadata and complete structured data, so they
  // add to the publishable surface and never to the error count.
  const staticTotal = STATIC_COUNTS.total;
  const surface = audit.published + staticTotal;
  const eligible = audit.richEligible + staticTotal;

  // The health score is the share of the surface that is free of errors and warnings alike, so closing a
  // gap moves it. A score with nothing behind it would be worse than no score.
  const clean = Math.max(0, audit.published - audit.schemaErrors - audit.schemaWarnings) + staticTotal;
  const health = surface > 0 ? Math.round((clean / surface) * 100) : 100;
  const healthTone = scoreColor(health);
  const errorTone = audit.schemaErrors > 0 ? { fg: "#DC2626", tint: "#FEE2E2" } : { fg: "#15803D", tint: "#DCFCE7" };

  const kpis = [
    { icon: Gauge, label: "SEO health score", value: `${health}/100`, foot: healthTone.label, tint: healthTone.tint, fg: healthTone.fg },
    {
      icon: FileCheck2,
      label: "Indexed in Google",
      value: gscIndexed === null ? "—" : gscIndexed.toLocaleString("en-NG"),
      foot: gscIndexed === null ? "Search Console not connected" : `Served in search, last ${INDEX_WINDOW_DAYS} days`,
      tint: "#EEEBFC", fg: "#543CDA",
    },
    { icon: AlertTriangle, label: "Structured data errors", value: audit.schemaErrors.toLocaleString("en-NG"), foot: audit.schemaErrors > 0 ? "Blocks the rich result" : "No page is blocked", tint: errorTone.tint, fg: errorTone.fg },
    { icon: Sparkles, label: "Rich result eligible", value: eligible.toLocaleString("en-NG"), foot: `of ${surface.toLocaleString("en-NG")} public pages`, tint: "#DCFCE7", fg: "#15803D" },
  ];

  // The donut is the audit split, so it always adds up to the published corpus.
  const clean_ = Math.max(0, audit.published - audit.schemaErrors - audit.schemaWarnings);
  const split = [
    { label: "Valid", n: clean_, color: "#15803D" },
    { label: "Warnings", n: audit.schemaWarnings, color: "#B45309" },
    { label: "Errors", n: audit.schemaErrors, color: "#DC2626" },
  ];
  const splitTotal = split.reduce((s, x) => s + x.n, 0);
  let acc = 0;
  const segs = split.map((x) => {
    const start = splitTotal > 0 ? (acc / splitTotal) * 360 : 0;
    acc += x.n;
    return { ...x, s: start, e: splitTotal > 0 ? (acc / splitTotal) * 360 : 0 };
  });
  const grad = splitTotal > 0 ? segs.map((s) => `${s.color} ${s.s}deg ${s.e}deg`).join(", ") : "#E2E8F0 0deg 360deg";

  const quickActions = [
    { label: "Edit meta templates", href: "/cms/seo/settings/templates" },
    { label: "Open redirect manager", href: "/cms/seo/redirects" },
    { label: "Edit robots.txt", href: "/cms/seo/robots" },
    { label: "Generate sitemap", href: "/cms/seo/sitemap" },
    { label: "Check indexing status", href: "/cms/seo/indexing" },
    { label: "View Search Console", href: "/cms/seo/search-console" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900">SEO Settings</h1>
          <p className="mt-1 text-[0.86rem] text-slate-600">
            The site&apos;s global SEO state, measured against the structured data it actually emits.
          </p>
        </div>
        <a href="https://nexoristech.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-[0.82rem] font-600 text-slate-700 hover:bg-slate-50">View site</a>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle">
            <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: c.tint, color: c.fg }}><c.icon size={17} /></span>
            <p className="mt-3 text-[1.5rem] font-700" style={{ color: c.fg }}>{c.value}</p>
            <p className="text-[0.78rem] font-600 text-slate-700">{c.label}</p>
            <p className="mt-0.5 text-[0.72rem] text-slate-600">{c.foot}</p>
          </div>
        ))}
      </div>

      {gscIndexed === null && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-4">
          <PlugZap size={16} className="mt-0.5 shrink-0 text-slate-500" />
          <p className="text-[0.8rem] leading-relaxed text-slate-600">
            Search Console is not connected, so the real indexed count cannot be read. Set GSC_PROPERTY and
            authorise the account, and this reports how many pages Google has served in search. Nothing is
            estimated in the meantime.
          </p>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.95rem] font-700 text-slate-900">Metadata status</h2>
          <p className="mt-0.5 text-[0.78rem] text-slate-600">Open a row to see and fix the pages it affects.</p>
          <ul className="mt-3 divide-y divide-slate-100">
            {ISSUES.map((x) => {
              const n = audit.byIssue[x.id];
              const tone = n === 0 ? { fg: "#15803D", bg: "#DCFCE7" } : x.severity === "error" ? { fg: "#DC2626", bg: "#FEE2E2" } : { fg: "#B45309", bg: "#FEF3C7" };
              const Icon = n === 0 ? ShieldCheck : x.severity === "error" ? CircleAlert : AlertTriangle;
              return (
                <li key={x.id}>
                  <Link href={`/cms/seo/settings/issues/${x.id}`}
                    className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#543CDA]">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ background: tone.bg, color: tone.fg }}><Icon size={15} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.85rem] font-600 text-slate-800">{x.label}</span>
                      <span className="block text-[0.72rem] leading-snug text-slate-600">{x.note}</span>
                    </span>
                    <span className="shrink-0 text-[0.9rem] font-700" style={{ color: tone.fg }}>{n.toLocaleString("en-NG")}</span>
                    <ChevronRight size={15} className="shrink-0 text-slate-400" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.95rem] font-700 text-slate-900">Structured data</h2>
          <p className="mt-0.5 text-[0.78rem] text-slate-600">
            Checked against the properties each rich result needs. An error means the result cannot appear.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-5">
            <div className="relative grid h-28 w-28 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(${grad})` }}>
              <div className="grid h-[4.6rem] w-[4.6rem] place-items-center rounded-full bg-white text-center">
                <span>
                  <span className="block text-[1.2rem] font-700 text-slate-900">{splitTotal.toLocaleString("en-NG")}</span>
                  <span className="block text-[0.6rem] text-slate-600">Pages</span>
                </span>
              </div>
            </div>
            <ul className="flex flex-col gap-1.5 text-[0.8rem]">
              {split.map((s) => (
                <li key={s.label} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
                  <span className="w-20 text-slate-700">{s.label}</span>
                  <span className="font-600 text-slate-900">{s.n.toLocaleString("en-NG")}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-3 text-[0.72rem] leading-relaxed text-slate-600">
            Insights and case studies emit Article, jobs emit JobPosting, and the rest emit WebPage. This
            reports what the site sends. What Google chooses to show is its own decision.
          </p>
          {/* No "manage schemas" link: there is nothing to manage. The type is decided by what the
              content is, and this panel reports what that produces. The link pointed at a page that
              was never built. */}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.95rem] font-700 text-slate-900">Quick actions</h2>
          <ul className="mt-3 flex flex-col gap-1">
            {quickActions.map((a) => (
              <li key={a.label}><Link href={a.href} className="flex items-center justify-between rounded-lg px-3 py-2 text-[0.84rem] font-600 text-slate-700 hover:bg-slate-50 hover:text-[#543CDA]">{a.label}<ChevronRight size={15} className="text-slate-500" /></Link></li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
