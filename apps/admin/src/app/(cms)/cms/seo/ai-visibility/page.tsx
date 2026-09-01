/**
 * AI Visibility (PRD §9.8, winning AI Overviews / GEO). Every figure comes from Google Analytics 4.
 *
 * The screen previously carried invented totals — 2,842 citations, 5,671 mentions, 12.4K traffic, an
 * average position of 3.6 — and seven hardcoded platform rows, shown whenever GA4 was not connected.
 * There is no source anywhere for a citation count or an average position inside an AI answer, so those
 * are gone rather than estimated. What GA4 can answer is which assistants referred sessions and which
 * pages those sessions landed on, and that is what is reported.
 *
 * Top pages were also wrong: they ranked `cms_content.views`, which counts traffic from everywhere, and
 * labelled it "cited by AI". They are now the GA4 landing pages of AI-referred sessions only.
 *
 * CMS access only. Responsive.
 */
import type { ReactNode } from "react";
import { MessageSquare, TrendingUp, Target, Sparkles, ExternalLink, FileText, PlugZap } from "lucide-react";
import { AiPlatformLogo } from "../../../../../components/cms/AiPlatformLogo.js";
import { requireCmsAccess } from "../../../../../lib/auth.js";
import { fetchGa4AiReferrals, fetchGa4AiLandingPages } from "../../../../../lib/google/ga4.js";
import { GSC_RANGES, resolveRange } from "../../../../../lib/google/gsc-constants.js";
import { fetchGscSearchAppearance, isAiAppearance, appearanceLabel } from "../../../../../lib/google/gsc.js";
import { RangeFilter } from "../../../../../components/cms/RangeFilter.js";

export const dynamic = "force-dynamic";

/** A readable name, a chart colour and the brand mark to draw, for each GA4 referral host. */
const PLATFORM_META: { match: RegExp; name: string; color: string; logo: string }[] = [
  { match: /chatgpt|openai/i, name: "ChatGPT", color: "#10A37F", logo: "chatgpt" },
  { match: /perplexity/i, name: "Perplexity", color: "#1FB8CD", logo: "perplexity" },
  { match: /notebooklm/i, name: "NotebookLM", color: "#3B82F6", logo: "notebooklm" },
  { match: /gemini|bard/i, name: "Gemini", color: "#8E75B2", logo: "gemini" },
  { match: /copilot/i, name: "Microsoft Copilot", color: "#EC4899", logo: "copilot" },
  { match: /claude|anthropic/i, name: "Claude", color: "#D97757", logo: "claude" },
  { match: /grok|x\.ai/i, name: "Grok", color: "#1F2937", logo: "grok" },
  { match: /deepseek/i, name: "DeepSeek", color: "#5786FE", logo: "deepseek" },
  { match: /mistral|lechat/i, name: "Mistral Le Chat", color: "#FA520F", logo: "mistral" },
  { match: /meta\.ai|metaai/i, name: "Meta AI", color: "#0467DF", logo: "metaai" },
  { match: /huggingface/i, name: "Hugging Face", color: "#F59E0B", logo: "huggingface" },
  { match: /bing/i, name: "Microsoft Bing", color: "#0EA5E9", logo: "bing" },
  { match: /phind/i, name: "Phind", color: "#0891B2", logo: "phind" },
  { match: /poe\.com/i, name: "Poe", color: "#5D5CDE", logo: "poe" },
];
function platformOf(source: string): { name: string; color: string; logo: string | null } {
  const hit = PLATFORM_META.find((p) => p.match.test(source));
  return hit ? { name: hit.name, color: hit.color, logo: hit.logo } : { name: source, color: "#94A3B8", logo: null };
}

/** Distinguishes "Analytics is not connected" from "connected, and the answer is nothing". */
function EmptyPanel({ connected, what }: { connected: boolean; what: string }): ReactNode {
  return (
    <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-4">
      <PlugZap size={16} className="mt-0.5 shrink-0 text-slate-500" />
      <p className="text-[0.8rem] leading-relaxed text-slate-600">
        {connected ? what : "Connect Google Analytics 4 in SEO Settings. Until then there is no measurement to show, and nothing is estimated in its place."}
      </p>
    </div>
  );
}

export default async function AiVisibilityPage({ searchParams }: { searchParams: Promise<{ range?: string }> }): Promise<ReactNode> {
  await requireCmsAccess();
  const activeRange = resolveRange((await searchParams).range);
  // Top pages come from GA4 landing pages reached from an AI host, not from cms_content.views. Views
  // are all traffic from anywhere; calling them "cited by AI" was simply the wrong number.
  const [aiReferrals, aiPages, appearances] = await Promise.all([
    fetchGa4AiReferrals(activeRange.days),
    fetchGa4AiLandingPages(activeRange.days, 8),
    // Search Console's own account of how results were presented, including its AI surfaces.
    fetchGscSearchAppearance(activeRange.days),
  ]);

  // Connected means GA4 answered. It answering with nothing is a real result — no AI referrals in the
  // window — and is shown as zero rather than replaced with invented figures.
  const connected = aiReferrals !== null;
  const platforms = (aiReferrals ?? []).map((r) => {
    const m = platformOf(r.source);
    return { name: m.name, v: r.sessions, color: m.color, logo: m.logo, source: r.source };
  });
  // Each landing page carries the assistant that sent the session, so the row can show whose logo it is.
  const topPages = (aiPages ?? []).map((r) => ({ ...r, platform: platformOf(r.source) }));
  const aiSessions = platforms.reduce((sum, x) => sum + x.v, 0);

  const kpis = [
    { icon: TrendingUp, label: "AI referral sessions", value: connected ? aiSessions.toLocaleString("en-NG") : "—", tint: "#DCFCE7", fg: "#15803D" },
    { icon: MessageSquare, label: "Assistants referring", value: connected ? String(platforms.length) : "—", tint: "#EEEBFC", fg: "#543CDA" },
    { icon: FileText, label: "Pages entered", value: connected ? String(topPages.length) : "—", tint: "#EEEBFC", fg: "#543CDA" },
    { icon: Target, label: "Window", value: activeRange.label.replace("Last ", ""), tint: "#FEF3C7", fg: "#B45309" },
  ];
  const total = platforms.reduce((sum, x) => sum + x.v, 0);
  let acc = 0;
  const segs = platforms.map((p) => { const start = total > 0 ? acc / total * 360 : 0; acc += p.v; return { ...p, s: start, e: total > 0 ? acc / total * 360 : 0 }; });
  const grad = segs.map((s) => `${s.color} ${s.s}deg ${s.e}deg`).join(", ");
  const pct = (v: number): string => (total > 0 ? `${((v / total) * 100).toFixed(1)}%` : "0%");

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[1.4rem] font-700 text-slate-900">AI Visibility</h1>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.68rem] font-700 ${connected ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#FEF3C7] text-[#B45309]"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-[#15803D]" : "bg-[#B45309]"}`} />{connected ? "Google Analytics 4" : "Not connected"}
            </span>
          </div>
          <p className="mt-1 text-[0.86rem] text-slate-600">
            {connected
              ? "Sessions referred by AI assistants, measured by Google Analytics 4."
              : "Google Analytics 4 is not connected, so there is nothing to report here yet."}
          </p>
        </div>
        {/* The default must be the range the data was actually fetched for, or the chip claims one
            window while the figures below describe another. */}
        <RangeFilter defaultValue={activeRange.value} options={GSC_RANGES.map((r) => ({ value: r.value, label: r.label }))} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle">
            <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: k.tint, color: k.fg }}><k.icon size={17} /></span>
            <p className="mt-3 text-[1.5rem] font-700 text-slate-900">{k.value}</p>
            <p className="text-[0.78rem] text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.95rem] font-700 text-slate-900">Referrals by assistant</h2>
          <p className="mt-0.5 text-[0.78rem] text-slate-600">Sessions whose source is an AI assistant, over {activeRange.label.toLowerCase()}.</p>
          {platforms.length === 0 ? (
            <EmptyPanel connected={connected} what="No AI assistant referred a session in this window." />
          ) : (
            <div className="mt-4 flex flex-wrap items-center gap-6">
              <div className="relative grid h-36 w-36 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(${grad})` }}>
                <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center"><span><span className="block text-[1.3rem] font-700 text-slate-900">{total.toLocaleString("en-NG")}</span><span className="block text-[0.62rem] text-slate-600">Sessions</span></span></div>
              </div>
              <ul className="flex min-w-0 flex-1 flex-col gap-2 text-[0.8rem]">
                {platforms.map((p) => (
                  <li key={p.source} className="flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: p.color }} />
                    <AiPlatformLogo slug={p.logo} name={p.name} size={17} />
                    <span className="min-w-0 flex-1 truncate text-slate-700">{p.name}</span>
                    <span className="shrink-0 font-600 text-slate-900">{p.v.toLocaleString("en-NG")}</span>
                    <span className="w-12 shrink-0 text-right text-slate-600">{pct(p.v)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.95rem] font-700 text-slate-900">How Google presented your results</h2>
          <p className="mt-1 text-[0.8rem] leading-relaxed text-slate-600">
            From Search Console&apos;s search-appearance breakdown, which is where Google reports rich
            results. It does not report AI Overviews or AI Mode: the Search Analytics API has no
            appearance type for either and refuses the request when asked for one. Their impressions
            are counted inside the Search Console totals instead. If Google ever adds an AI appearance,
            it will appear here without anything being changed.
          </p>
          {appearances === null ? (
            <EmptyPanel connected={false} what="" />
          ) : appearances.length === 0 ? (
            <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-3.5">
              <Sparkles size={15} className="mt-0.5 shrink-0 text-slate-500" />
              <p className="text-[0.8rem] leading-relaxed text-slate-600">
                Search Console reports no special appearance for this property over {activeRange.label.toLowerCase()}.
                Google records an appearance type only when it uses one, so this stays empty until it
                does. Nothing is being estimated in its place.
              </p>
            </div>
          ) : (
            <ul className="mt-3 flex flex-col gap-2">
              {appearances.map((a) => {
                const ai = isAiAppearance(a.key);
                return (
                  <li key={a.key} className="flex flex-wrap items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                    <Sparkles size={15} className="shrink-0" style={{ color: ai ? "#543CDA" : "#94A3B8" }} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.84rem] font-600 text-slate-800">{appearanceLabel(a.key)}</span>
                      <span className="block text-[0.74rem] text-slate-600">
                        {Math.round(a.impressions).toLocaleString("en-NG")} impressions · {Math.round(a.clicks).toLocaleString("en-NG")} clicks
                      </span>
                    </span>
                    {ai ? (
                      <span className="shrink-0 rounded-full bg-[#EEEBFC] px-2 py-0.5 text-[0.66rem] font-700 text-[#543CDA]">AI surface</span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
          <a href="https://search.google.com/search-console/performance/search-analytics" target="_blank" rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-[0.8rem] font-600 text-[#543CDA] hover:text-[#4330B8]">
            Open Search Console report <ExternalLink size={13} />
          </a>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.95rem] font-700 text-slate-900">Pages entered from an assistant</h2>
          <p className="mt-0.5 text-[0.78rem] text-slate-600">The landing page of each AI-referred session, so these are pages an assistant actually pointed someone at.</p>
          {topPages.length === 0 ? (
            <EmptyPanel connected={connected} what="No AI-referred session landed on a page in this window." />
          ) : (
            <ol className="mt-3 flex flex-col divide-y divide-slate-100">
              {topPages.map((p, i) => (
                <li key={`${p.source}${p.path}`} className="flex items-center gap-3 py-2.5">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[#EEEBFC] text-[0.72rem] font-700 text-[#543CDA]">{i + 1}</span>
                  <AiPlatformLogo slug={p.platform.logo} name={p.platform.name} size={17} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-[0.78rem] text-slate-800">{p.path}</span>
                    <span className="block truncate text-[0.72rem] text-slate-600">via {p.platform.name}</span>
                  </span>
                  <span className="shrink-0 text-[0.78rem] font-600 text-slate-700">{p.sessions.toLocaleString("en-NG")}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
