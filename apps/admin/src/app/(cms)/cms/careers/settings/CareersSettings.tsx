"use client";
/**
 * Careers settings (CMS design). Tabbed configuration: General, Application Settings, Branding, AI
 * Settings (the Oge configuration toggles), and SEO. Native POST to /api/cms/careers-settings, which
 * stores one JSON blob for the 'careers' scope. Responsive to 360px.
 */
import { useState } from "react";
import type { ReactNode } from "react";
import { Settings, Inbox, Palette, Sparkles, Search } from "lucide-react";

export interface CareersConfig {
  pageTitle: string; pageIntro: string;
  requirePortfolio: boolean; requireCoverLetter: boolean; notifyOnApply: boolean;
  brandColor: string; showTeamPhotos: boolean;
  aiEnabled: boolean; aiFitScore: boolean; aiVerification: boolean; aiCandidateAnalysis: boolean;
  metaTitle: string; metaDescription: string;
}
const TABS = [
  { id: "general", label: "General", icon: Settings },
  { id: "application", label: "Application", icon: Inbox },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "ai", label: "AI Settings", icon: Sparkles },
  { id: "seo", label: "SEO", icon: Search },
] as const;
const field = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[0.86rem] text-slate-900 placeholder:text-slate-400 focus:border-[#543CDA] focus:outline-none focus:ring-2 focus:ring-[#543CDA]/15 resize-none";
const label = "text-[0.8rem] font-600 text-slate-700";

export function CareersSettings({ initial }: { initial: CareersConfig }): ReactNode {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("general");
  const [c, setC] = useState<CareersConfig>(initial);
  const set = <K extends keyof CareersConfig>(k: K, v: CareersConfig[K]): void => setC((p) => ({ ...p, [k]: v }));

  return (
    <form action="/api/cms/careers-settings" method="post">
      <input type="hidden" name="data" value={JSON.stringify(c)} />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[13rem_1fr]">
        <nav className="flex gap-1 overflow-x-auto lg:flex-col">
          {TABS.map((t) => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[0.84rem] font-600 ${tab === t.id ? "bg-[#EEEBFC] text-[#543CDA]" : "text-slate-600 hover:bg-slate-100"}`}>
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </nav>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle sm:p-5">
          {tab === "general" ? (
            <div className="flex flex-col gap-4">
              <h2 className="text-[0.95rem] font-700 text-slate-900">General</h2>
              <label className="flex flex-col gap-1.5"><span className={label}>Careers Page Title</span><input value={c.pageTitle} onChange={(e) => set("pageTitle", e.target.value)} className={field} /></label>
              <label className="flex flex-col gap-1.5"><span className={label}>Introduction</span><textarea value={c.pageIntro} onChange={(e) => set("pageIntro", e.target.value)} rows={4} className={field} /></label>
            </div>
          ) : tab === "application" ? (
            <div className="flex flex-col gap-3">
              <h2 className="text-[0.95rem] font-700 text-slate-900">Application Settings</h2>
              <Toggle title="Require portfolio or GitHub link" sub="Ask applicants for a portfolio URL." checked={c.requirePortfolio} set={(v) => set("requirePortfolio", v)} />
              <Toggle title="Require cover letter" sub="Ask applicants to include a short cover letter." checked={c.requireCoverLetter} set={(v) => set("requireCoverLetter", v)} />
              <Toggle title="Notify team on new application" sub="Email the hiring team when someone applies." checked={c.notifyOnApply} set={(v) => set("notifyOnApply", v)} />
            </div>
          ) : tab === "branding" ? (
            <div className="flex flex-col gap-4">
              <h2 className="text-[0.95rem] font-700 text-slate-900">Branding</h2>
              <label className="flex flex-col gap-1.5"><span className={label}>Accent Colour</span>
                <span className="flex items-center gap-2"><input type="color" value={c.brandColor} onChange={(e) => set("brandColor", e.target.value)} className="h-9 w-12 cursor-pointer rounded-md border border-slate-200" /><span className="font-mono text-[0.82rem] text-slate-600">{c.brandColor}</span></span>
              </label>
              <Toggle title="Show team photos" sub="Display team imagery on the careers hub." checked={c.showTeamPhotos} set={(v) => set("showTeamPhotos", v)} />
            </div>
          ) : tab === "ai" ? (
            <div className="flex flex-col gap-3">
              <h2 className="text-[0.95rem] font-700 text-slate-900">AI Configuration</h2>
              <p className="text-[0.8rem] text-slate-500">Controls how Oge assists with applications. These connect to the operational Oge AI module.</p>
              <Toggle title="Enable AI features" sub="Turn on all AI-powered candidate analysis and scoring." checked={c.aiEnabled} set={(v) => set("aiEnabled", v)} />
              <Toggle title="Enable AI fit score" sub="Score each candidate on fit for the role." checked={c.aiFitScore} set={(v) => set("aiFitScore", v)} disabled={!c.aiEnabled} />
              <Toggle title="Enable evidence verification" sub="Cross-check LinkedIn, portfolio, and the CV for consistency." checked={c.aiVerification} set={(v) => set("aiVerification", v)} disabled={!c.aiEnabled} />
              <Toggle title="Enable candidate analysis" sub="Summarise strengths, gaps, and a hiring recommendation." checked={c.aiCandidateAnalysis} set={(v) => set("aiCandidateAnalysis", v)} disabled={!c.aiEnabled} />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <h2 className="text-[0.95rem] font-700 text-slate-900">SEO</h2>
              <label className="flex flex-col gap-1.5"><span className={label}>Meta Title</span><input value={c.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} className={field} /></label>
              <label className="flex flex-col gap-1.5"><span className={label}>Meta Description</span><textarea value={c.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} rows={3} className={field} /></label>
            </div>
          )}

          <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="submit" className="rounded-lg bg-[#543CDA] px-6 py-2.5 text-[0.85rem] font-600 text-white hover:bg-[#4330B8]">Save Settings</button>
          </div>
        </section>
      </div>
    </form>
  );
}

function Toggle({ title, sub, checked, set, disabled }: { title: string; sub: string; checked: boolean; set: (v: boolean) => void; disabled?: boolean }): ReactNode {
  return (
    <label className={`flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-3 ${disabled ? "opacity-50" : "cursor-pointer"}`}>
      <span><span className="block text-[0.85rem] font-600 text-slate-800">{title}</span><span className="block text-[0.76rem] text-slate-500">{sub}</span></span>
      <span onClick={() => { if (!disabled) set(!checked); }} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-[#543CDA]" : "bg-slate-300"} ${disabled ? "" : "cursor-pointer"}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${checked ? "left-[1.4rem]" : "left-0.5"}`} /></span>
    </label>
  );
}
