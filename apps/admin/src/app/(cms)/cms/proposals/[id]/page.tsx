/**
 * Proposal review (CMS Programmatic SEO design). Review and approve an AI-generated page opportunity: the
 * opportunity overview, Oge's rationale, the projected impact, and a suggested structure. Approving
 * creates a draft generated page seeded from the proposal. CMS access only. Responsive.
 *
 * The impact figures state their own basis. Clicks come from this site's measured Search Console
 * click-through rate; effort and time to rank are stated as what they are, judgements from the
 * keyword difficulty rather than forecasts.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Sparkles, TrendingUp, Clock, Gauge, Layers } from "lucide-react";
import { requireCmsAccess } from "../../../../../lib/auth.js";
import { cmsDb } from "../../../../../lib/cms-db.js";
import { fetchGscDaily } from "../../../../../lib/google/gsc.js";

export const dynamic = "force-dynamic";

interface Row { id: string; keyword: string; industry: string | null; search_volume: number; difficulty: number | null; priority: string; status: string; cpc: string | null; rationale: string | null; confidence: number | null }

export default async function ProposalReviewPage({ params }: { params: Promise<{ id: string }> }): Promise<ReactNode> {
  await requireCmsAccess();
  const { id } = await params;
  const { rows } = await cmsDb().query<Row>(
    "SELECT id, keyword, industry, search_volume, difficulty, priority, status, cpc::text, rationale, confidence FROM cms_proposal WHERE id=$1", [id]);
  const p = rows[0];
  if (!p) notFound();

  const diff = p.difficulty ?? 50;
  const effort = diff >= 55 ? "High" : diff >= 40 ? "Medium" : "Low";
  const timeToRank = diff >= 55 ? "4 to 8 months" : diff >= 40 ? "3 to 6 months" : "1 to 3 months";
  const structure = ["Introduction", `Benefits of ${p.keyword}`, "Key Applications & Use Cases", "Key Technologies", "Why Choose Nexoris Technologies", "FAQ", "Call To Action"];

  /**
   * Projected clicks, from this site's own measured click-through rate.
   *
   * This used to read `search_volume * 0.12` to `* 0.22` for traffic and that again `* 0.018` to
   * `* 0.028` for leads: a forecast dressed as data, from four multipliers nobody had measured, on
   * the screen where someone decides whether a page is worth writing. Search Console knows what
   * share of impressions this site actually converts to clicks, so that is the number used. The
   * range is a wide band around it, because a new page ranking is uncertain and the label says so.
   * With Search Console unavailable it shows a dash rather than a guess.
   *
   * The leads projection is gone. There is no conversion rate to derive one from, and inventing one
   * put a number of new customers on the screen that nothing in the platform could support.
   */
  const CTR_WINDOW_DAYS = 90;
  const daily = await fetchGscDaily(CTR_WINDOW_DAYS);
  const totals = (daily ?? []).reduce(
    (acc, d) => ({ clicks: acc.clicks + d.clicks, impressions: acc.impressions + d.impressions }),
    { clicks: 0, impressions: 0 },
  );
  const siteCtr = totals.impressions > 0 ? totals.clicks / totals.impressions : null;
  const clicksLow = siteCtr === null ? 0 : Math.round(p.search_volume * siteCtr * 0.6);
  const clicksHigh = siteCtr === null ? 0 : Math.round(p.search_volume * siteCtr * 1.4);

  const impact = [
    {
      icon: TrendingUp,
      label: "Projected monthly clicks",
      value: siteCtr === null ? "—" : `${clicksLow.toLocaleString()} - ${clicksHigh.toLocaleString()}`,
      note: siteCtr === null
        ? "Connect Search Console to project this"
        : `At this site's ${(siteCtr * 100).toFixed(1)}% click rate over ${CTR_WINDOW_DAYS} days`,
    },
    { icon: Layers, label: "Content Effort", value: effort, note: "From the keyword difficulty" },
    { icon: Clock, label: "Time to Rank", value: timeToRank, note: "A rule of thumb, not a forecast" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/cms/proposals" className="inline-flex items-center gap-1.5 text-[0.8rem] font-600 text-slate-500 hover:text-[#543CDA]"><ArrowLeft size={15} /> Back to Proposals</Link>
        <div className="flex flex-wrap items-center gap-2">
          <form action="/api/cms/proposals" method="post"><input type="hidden" name="id" value={p.id} /><input type="hidden" name="action" value="reject" /><button type="submit" className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[0.82rem] font-600 text-slate-700 hover:bg-slate-50">Reject</button></form>
          <form action="/api/cms/proposals" method="post"><input type="hidden" name="id" value={p.id} /><input type="hidden" name="action" value="approve" /><button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-[#543CDA] px-4 py-2 text-[0.82rem] font-600 text-white hover:bg-[#4330B8]"><Sparkles size={15} /> Approve &amp; Create Page</button></form>
        </div>
      </div>

      <h1 className="mt-4 text-[1.3rem] font-700 text-slate-900">{p.keyword}</h1>
      <p className="mt-1 text-[0.86rem] text-slate-500">Review and approve this AI-generated opportunity.</p>

      <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex min-w-0 flex-col gap-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
            <h2 className="text-[0.95rem] font-700 text-slate-900">Opportunity Overview</h2>
            <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[
                { k: "Industry", v: p.industry ?? "—" }, { k: "Search Volume", v: `${p.search_volume.toLocaleString()} / mo` },
                { k: "Keyword Difficulty", v: `${diff} / 100` }, { k: "CPC (USD)", v: p.cpc ? `$${p.cpc}` : "—" },
                { k: "Priority", v: p.priority }, { k: "AI Confidence", v: p.confidence != null ? `${p.confidence}%` : "—" },
              ].map((x) => <div key={x.k}><p className="text-[0.72rem] font-600 uppercase tracking-wide text-slate-500">{x.k}</p><p className="text-[0.92rem] font-700 text-slate-900">{x.v}</p></div>)}
            </div>
          </section>

          <section className="rounded-2xl border border-[#543CDA]/20 bg-[#F4F1FD] p-5">
            <h2 className="flex items-center gap-1.5 text-[0.95rem] font-700 text-[#543CDA]"><Sparkles size={15} /> AI Rationale</h2>
            <p className="mt-2 text-[0.86rem] leading-relaxed text-slate-600">{p.rationale ?? "Oge identified this as a strong opportunity based on search demand and fit with Nexoris Technologies services."}</p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
            <h2 className="text-[0.95rem] font-700 text-slate-900">Suggested Structure</h2>
            <ol className="mt-3 flex flex-col gap-2">
              {structure.map((s, i) => <li key={i} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[0.84rem] font-600 text-slate-700"><span className="mr-2 text-slate-500">{i + 1}.</span>{s}</li>)}
            </ol>
          </section>
        </div>

        <div className="min-w-0">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
            <h2 className="text-[0.95rem] font-700 text-slate-900">Estimated Impact</h2>
            <div className="mt-3 flex flex-col gap-3">
              {impact.map((x) => (
                <div key={x.label} className="flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#EEEBFC] text-[#543CDA]"><x.icon size={16} /></span>
                  <span className="min-w-0">
                    <span className="block text-[0.72rem] text-slate-500">{x.label}</span>
                    <span className="block text-[0.92rem] font-700 text-slate-900">{x.value}</span>
                    {/* Where the figure comes from, next to the figure. A projection with no stated
                        basis reads as a measurement. */}
                    <span className="block text-[0.68rem] text-slate-500">{x.note}</span>
                  </span>
                </div>
              ))}
              <div className="mt-1 flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#DCFCE7] text-[#15803D]"><Gauge size={16} /></span>
                <span><span className="block text-[0.72rem] text-slate-500">Confidence Score</span><span className="block text-[0.92rem] font-700 text-[#15803D]">{p.confidence != null ? `${p.confidence}%` : "—"}</span></span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
