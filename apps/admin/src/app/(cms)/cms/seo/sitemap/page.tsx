/**
 * Sitemap Dashboard (CMS SEO Operations design). Reflects the REAL sitemap the site serves at
 * /sitemap.xml (apps/web/src/app/sitemap.ts): the 36 hardcoded marketing pages + the Insights/Careers
 * hubs + 3 legal routes, layered with the published CMS content (insights, authors, jobs, programmatic
 * pages). The breakdown below is by content section of that single sitemap — no invented sitemap files,
 * no half report. URL counts come live from the static route registry and cms_content. CMS access only.
 */
import type { ReactNode } from "react";
import { Map as MapIcon, Send, Link2, CheckCircle2, Gauge, ExternalLink, RefreshCw } from "lucide-react";
import { requireCmsAccess } from "../../../../../lib/auth.js";
import { fetchGscIndexedPageCount } from "../../../../../lib/google/gsc.js";
import { cmsDb } from "../../../../../lib/cms-db.js";
import { STATIC_COUNTS, SITE_ORIGIN } from "../../../../../lib/site-pages.js";

export const dynamic = "force-dynamic";

interface Counts { insights: string; pages: string; jobs: string; authors: string; media: string }

export default async function SitemapPage(): Promise<ReactNode> {
  await requireCmsAccess();
  const { rows: [c] } = await cmsDb().query<Counts>(
    `SELECT (SELECT count(*) FROM cms_content WHERE kind='insight' AND status='published')::text insights,
            (SELECT count(*) FROM cms_content WHERE kind='generated_page' AND status='published')::text pages,
            (SELECT count(*) FROM cms_content WHERE kind='job' AND status='published')::text jobs,
            (SELECT count(*) FROM cms_author WHERE active AND show_on_website)::text authors,
            (SELECT count(*) FROM cms_media)::text media`);

  // One sitemap (/sitemap.xml). Static routes = 36 hardcoded pages + 2 hubs + 3 legal (from site-pages).
  const sections = [
    { file: "Static Pages", type: "Hardcoded (core, services, industries, hubs, legal)", urls: STATIC_COUNTS.total },
    { file: "Insights", type: "CMS · /insights/[slug]", urls: Number(c?.insights ?? 0) },
    { file: "Authors", type: "CMS · /authors/[slug]", urls: Number(c?.authors ?? 0) },
    { file: "Careers", type: "CMS · /careers/[slug]", urls: Number(c?.jobs ?? 0) },
    { file: "Programmatic Pages", type: "CMS · /[slug]", urls: Number(c?.pages ?? 0) },
  ];
  const totalUrls = sections.reduce((s, x) => s + x.urls, 0);
  // How many URLs Google has actually served an impression for in the last 90 days — the closest thing
  // Search Console exposes to "indexed". It used to be totalUrls * 0.851: an invented 85.1% rate
  // presented as a measurement, which is the one number on this screen nobody could have checked.
  const indexed = await fetchGscIndexedPageCount(90);
  const rate = indexed !== null && totalUrls > 0 ? ((indexed / totalUrls) * 100).toFixed(1) : null;

  const indexNowOn = Boolean(process.env.INDEXNOW_KEY);
  const kpis = [
    { icon: MapIcon, label: "Total URLs", value: totalUrls.toLocaleString(), tint: "#EEEBFC", fg: "#543CDA" },
    { icon: Link2, label: "Static Pages", value: STATIC_COUNTS.total.toLocaleString(), tint: "#EEEBFC", fg: "#543CDA" },
    { icon: Send, label: "CMS URLs", value: (totalUrls - STATIC_COUNTS.total).toLocaleString(), tint: "#FEF3C7", fg: "#B45309" },
    // A dash, not a zero: "not connected" and "nothing indexed" are different facts and must not look
    // the same.
    { icon: CheckCircle2, label: "Indexed URLs", value: indexed === null ? "—" : indexed.toLocaleString(), tint: "#DCFCE7", fg: "#16A34A" },
    { icon: Gauge, label: "Indexing Rate", value: rate === null ? "—" : `${rate}%`, tint: "#EDE9FE", fg: "#6D28D9" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900">Sitemaps</h1>
          <p className="mt-1 text-[0.86rem] text-slate-500">The site serves one sitemap at <span className="font-mono text-[0.82rem] text-slate-600">{SITE_ORIGIN}/sitemap.xml</span>, combining the hardcoded pages and the published CMS content.</p>
        </div>
        <form action="/api/cms/sitemap-refresh" method="post">
          <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-[#543CDA] px-4 py-2 text-[0.82rem] font-600 text-white hover:bg-[#4330B8]"><RefreshCw size={14} /> Regenerate</button>
        </form>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle">
            <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: k.tint, color: k.fg }}><k.icon size={17} /></span>
            <p className="mt-3 text-[1.4rem] font-700 text-slate-900">{k.value}</p>
            <p className="text-[0.74rem] text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-subtle">
          <div className="border-b border-slate-100 px-5 py-3.5"><h2 className="text-[0.95rem] font-700 text-slate-900">Sitemap Sections</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left">
              <thead><tr className="border-b border-slate-200 bg-slate-50 text-[0.66rem] uppercase tracking-wide text-slate-500"><th className="px-5 py-3 font-600">Section</th><th className="px-5 py-3 font-600">Source</th><th className="px-5 py-3 font-600">URLs</th><th className="px-5 py-3 font-600">Status</th><th className="px-5 py-3 text-right font-600">Actions</th></tr></thead>
              <tbody>
                {sections.map((s) => (
                  <tr key={s.file} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                    <td className="px-5 py-3 text-[0.85rem] font-600 text-slate-800">{s.file}</td>
                    <td className="px-5 py-3 text-[0.8rem] text-slate-500">{s.type}</td>
                    <td className="px-5 py-3 text-[0.84rem] font-600 text-slate-800">{s.urls.toLocaleString()}</td>
                    <td className="px-5 py-3"><span className="inline-flex rounded-full bg-[#DCFCE7] px-2.5 py-1 text-[0.72rem] font-600 text-[#15803D]">In sitemap</span></td>
                    <td className="px-5 py-3 text-right"><a href={`${SITE_ORIGIN}/sitemap.xml`} target="_blank" rel="noreferrer" aria-label={`Open the sitemap containing ${s.file}`} className="grid h-8 w-8 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-[#543CDA]"><ExternalLink size={15} /></a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.95rem] font-700 text-slate-900">How discovery works</h2>
          {/* This panel used to show Google "Submitted", Bing "Submitted" and Yandex "Not submitted" —
              three fixed values that were never read from anything. What is true is stated instead. */}
          <ul className="mt-3 flex flex-col gap-3 text-[0.82rem] leading-relaxed text-slate-600">
            <li className="flex gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#543CDA]" />
              <span><b className="font-600 text-slate-800">Google</b> discovers new URLs through the
              sitemap it already crawls. Publishing rebuilds the sitemap immediately.</span>
            </li>
            <li className="flex gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#543CDA]" />
              <span><b className="font-600 text-slate-800">Bing, Yandex, Seznam</b> are notified
              directly through IndexNow on every publish{indexNowOn ? "" : ", once INDEXNOW_KEY is set"}.</span>
            </li>
            <li className="flex gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#543CDA]" />
              <span>Google&rsquo;s Indexing API is restricted to job postings, so it is used for those
              and nothing else.</span>
            </li>
          </ul>
          <p className="mt-4 text-[0.76rem] text-slate-500">{STATIC_COUNTS.hardcoded} hardcoded pages ({STATIC_COUNTS.core} core, {STATIC_COUNTS.services} services, {STATIC_COUNTS.industries} industries) are always in the sitemap. CMS detail pages are added on publish.</p>
        </section>
      </div>
    </div>
  );
}
