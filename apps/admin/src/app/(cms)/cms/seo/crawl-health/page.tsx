/**
 * Crawl Health. What a walk of the published corpus and the redirect table actually finds.
 *
 * The screen previously reported 312 broken links, 124 orphan pages, 122 slow pages, 428 4xx errors and a
 * score of 87, none of which any crawler had produced, over a trend line that was plotting page views.
 * Every figure here now comes from lib/crawl-audit, which walks the body HTML of every published page.
 *
 * Response time, HTTP status codes and render-blocking resources need a crawler that fetches the site
 * over the network. That does not exist yet, so those checks are listed as not run rather than passed.
 *
 * CMS access only. Responsive.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { Activity, FileSearch, Unlink, Link2Off, ArrowRightLeft, CheckCircle2, Clock } from "lucide-react";
import { requireCmsAccess } from "../../../../../lib/auth.js";
import { STATIC_COUNTS, SITE_ORIGIN } from "../../../../../lib/site-pages.js";
import { crawlReport } from "../../../../../lib/crawl-audit.js";
import { auditCounts, scoreColor, editHref } from "../../../../../lib/seo-audit.js";

export const dynamic = "force-dynamic";

/** Checks that need a networked crawler. Named so their absence is visible rather than assumed passing. */
const NOT_RUN = [
  { label: "HTTP status codes", why: "Needs a crawler that requests every URL" },
  { label: "Response time", why: "Needs timed requests against the live site" },
  { label: "Render-blocking resources", why: "Needs the rendered page, not the stored HTML" },
];

export default async function CrawlHealthPage(): Promise<ReactNode> {
  await requireCmsAccess();
  const [report, audit] = await Promise.all([crawlReport(SITE_ORIGIN), auditCounts()]);

  const surface = report.crawled + STATIC_COUNTS.total;
  // The score counts only faults: a link that goes nowhere and a redirect that is wrong. Thin internal
  // linking is reported beside it as its own measure rather than folded in, because a page reachable
  // from its archive is not broken, and burying the two together would make neither readable.
  const faults = report.brokenLinks.length + report.redirectIssues.length;
  const score = surface > 0 ? Math.max(0, Math.round(((surface - Math.min(surface, faults)) / surface) * 100)) : 100;
  const tone = scoreColor(score);
  const linked = report.crawled - report.unlinked.length;

  const kpis = [
    { icon: Activity, label: "Crawl health score", value: `${score}/100`, foot: tone.label, tint: tone.tint, fg: tone.fg },
    { icon: FileSearch, label: "Pages walked", value: surface.toLocaleString("en-NG"), foot: `${report.crawled.toLocaleString("en-NG")} from the CMS, ${STATIC_COUNTS.total} hand-built`, tint: "#EEEBFC", fg: "#543CDA" },
    { icon: Unlink, label: "Broken internal links", value: report.brokenLinks.length.toLocaleString("en-NG"), foot: `of ${report.linksChecked.toLocaleString("en-NG")} internal links found`, tint: report.brokenLinks.length ? "#FEE2E2" : "#DCFCE7", fg: report.brokenLinks.length ? "#DC2626" : "#15803D" },
    { icon: Link2Off, label: "No contextual inbound link", value: report.unlinked.length.toLocaleString("en-NG"), foot: `${linked.toLocaleString("en-NG")} of ${report.crawled.toLocaleString("en-NG")} CMS pages are linked from another page`, tint: report.unlinked.length ? "#FEF3C7" : "#DCFCE7", fg: report.unlinked.length ? "#B45309" : "#15803D" },
  ];

  return (
    <div>
      <h1 className="text-[1.4rem] font-700 text-slate-900">Crawl Health</h1>
      <p className="mt-1 max-w-3xl text-[0.86rem] leading-relaxed text-slate-600">
        A walk of every published page and the redirect table. Each figure is the result of a check that
        ran just now.
      </p>

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
          <h2 className="text-[0.95rem] font-700 text-slate-900">Broken internal links</h2>
          <p className="mt-0.5 text-[0.78rem] text-slate-600">The link, and the page it sits on.</p>
          {report.brokenLinks.length === 0 ? (
            <Clear what="Every internal link resolves to a live page." />
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {report.brokenLinks.slice(0, 12).map((b, i) => (
                <li key={`${b.from.id}${b.href}${i}`} className="flex items-center gap-3 py-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#FEE2E2] text-[#DC2626]"><Unlink size={15} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-[0.78rem] text-slate-900">{b.href}</span>
                    <span className="block truncate text-[0.72rem] text-slate-600">on {b.from.title}</span>
                  </span>
                  <Link href={editHref(b.from)} className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[0.74rem] font-600 text-slate-700 hover:border-[#543CDA] hover:text-[#543CDA]">Fix</Link>
                </li>
              ))}
            </ul>
          )}
          {report.brokenLinks.length > 12 && (
            <p className="mt-2 text-[0.74rem] text-slate-600">and {(report.brokenLinks.length - 12).toLocaleString("en-NG")} more.</p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.95rem] font-700 text-slate-900">No contextual inbound link</h2>
          <p className="mt-0.5 text-[0.78rem] leading-relaxed text-slate-600">
            Still reachable from their archive listing, but no other page&apos;s copy points at them, so they
            inherit almost no authority.
            {report.emptyBodies > 0 && ` ${report.emptyBodies.toLocaleString("en-NG")} published pages have no body text at all, which is why so few links exist to find.`}
          </p>
          {report.unlinked.length === 0 ? (
            <Clear what="Every published page is linked from another page's copy." />
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {report.unlinked.slice(0, 12).map((o) => (
                <li key={o.id} className="flex items-center gap-3 py-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#FEF3C7] text-[#B45309]"><Link2Off size={15} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.82rem] font-600 text-slate-800">{o.title}</span>
                    <span className="block truncate font-mono text-[0.72rem] text-slate-600">{o.path}</span>
                  </span>
                  <Link href={editHref(o)} className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[0.74rem] font-600 text-slate-700 hover:border-[#543CDA] hover:text-[#543CDA]">Open</Link>
                </li>
              ))}
            </ul>
          )}
          {report.unlinked.length > 12 && (
            <p className="mt-2 text-[0.74rem] text-slate-600">and {(report.unlinked.length - 12).toLocaleString("en-NG")} more.</p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.95rem] font-700 text-slate-900">Redirects</h2>
          <p className="mt-0.5 text-[0.78rem] text-slate-600">Loops, chains, and targets that no longer exist.</p>
          {report.redirectIssues.length === 0 ? (
            <Clear what="Every active redirect points at a live page in one hop." />
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {report.redirectIssues.slice(0, 10).map((r) => (
                <li key={r.id} className="flex items-center gap-3 py-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#FEE2E2] text-[#DC2626]"><ArrowRightLeft size={15} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-[0.76rem] text-slate-900">{r.oldUrl} → {r.newUrl}</span>
                    <span className="block text-[0.72rem] text-slate-600">{r.problem}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/cms/seo/redirects" className="mt-3 inline-flex items-center gap-1 text-[0.8rem] font-600 text-[#543CDA] hover:underline">Open redirect manager</Link>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.95rem] font-700 text-slate-900">Metadata and structured data</h2>
          <p className="mt-0.5 text-[0.78rem] text-slate-600">Counted across the same published pages. Open a row to correct them.</p>
          <ul className="mt-3 divide-y divide-slate-100">
            <li className="flex items-center gap-3 py-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ background: audit.schemaErrors ? "#FEE2E2" : "#DCFCE7", color: audit.schemaErrors ? "#DC2626" : "#15803D" }}><Activity size={15} /></span>
              <span className="flex-1 text-[0.84rem] font-600 text-slate-800">Pages with a structured-data error</span>
              <span className="text-[0.9rem] font-700" style={{ color: audit.schemaErrors ? "#DC2626" : "#15803D" }}>{audit.schemaErrors.toLocaleString("en-NG")}</span>
            </li>
            <li className="flex items-center gap-3 py-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ background: audit.schemaWarnings ? "#FEF3C7" : "#DCFCE7", color: audit.schemaWarnings ? "#B45309" : "#15803D" }}><Activity size={15} /></span>
              <span className="flex-1 text-[0.84rem] font-600 text-slate-800">Pages with a metadata warning</span>
              <span className="text-[0.9rem] font-700" style={{ color: audit.schemaWarnings ? "#B45309" : "#15803D" }}>{audit.schemaWarnings.toLocaleString("en-NG")}</span>
            </li>
          </ul>
          <Link href="/cms/seo/settings" className="mt-3 inline-flex items-center gap-1 text-[0.8rem] font-600 text-[#543CDA] hover:underline">See the full metadata list</Link>
        </section>
      </div>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
        <h2 className="text-[0.95rem] font-700 text-slate-900">Not checked</h2>
        <p className="mt-0.5 text-[0.78rem] text-slate-600">
          These need a crawler that fetches the live site over the network. Nothing here is being reported
          as passing.
        </p>
        <ul className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {NOT_RUN.map((n) => (
            <li key={n.label} className="flex min-w-0 flex-1 items-start gap-2.5 rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-3 sm:min-w-[15rem]">
              <Clock size={15} className="mt-0.5 shrink-0 text-slate-500" />
              <span className="min-w-0">
                <span className="block text-[0.82rem] font-600 text-slate-800">{n.label}</span>
                <span className="block text-[0.72rem] leading-snug text-slate-600">{n.why}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Clear({ what }: { what: string }): ReactNode {
  return (
    <div className="mt-3 flex items-center gap-2.5 rounded-lg bg-[#DCFCE7]/60 p-3">
      <CheckCircle2 size={16} className="shrink-0 text-[#15803D]" />
      <p className="text-[0.8rem] font-600 text-[#15803D]">{what}</p>
    </div>
  );
}
