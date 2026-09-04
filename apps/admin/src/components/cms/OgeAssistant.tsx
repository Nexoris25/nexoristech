"use client";
/**
 * The Oge AI Assistant panel for CMS pages with a rich text editor (PRD Part Two). It is the right
 * column: tabs on top (SEO, TL;DR, Excerpt, Author Bio, FAQs, Internal Links, More), a compact body under
 * them, and it stays balanced against the editor rather than dominating it. The SEO tab shows a circular
 * score gauge with the meta title and description. TL;DR inserts at
 * the top of the article; FAQs (5-7, FAQPage-schema shape) insert at the bottom. Author and fact-checker
 * each get a per-article generated bio. Real AI via the Oge gateway when configured, deterministic draft
 * otherwise; a badge shows which ran. Everything is a draft the editor approves before saving.
 */
import { useState } from "react";
import type { ReactNode } from "react";
import { Sparkles, Loader2, Check, Copy, CornerDownLeft, Search, ListTree, AlignLeft, HelpCircle, User, Link2, LayoutList, ChevronDown } from "lucide-react";
import { findAnchor, alreadyLinks } from "../../lib/inline-links.js";
import type { MetaFinding } from "../../lib/meta-quality.js";

export type OgeTab = "seo" | "tldr" | "excerpt" | "author-bio" | "faqs" | "internal-links" | "more";
interface SeoResult { metaTitle: string; metaDescription: string }
export interface FaqItem { question: string; answer: string }
interface InternalLink { anchor: string; target: string; rationale: string }

/** A page an article may link to: what to call it, and where it lives. */
export interface PageRef { title: string; url: string }

export interface OgeContext {
  title?: string | undefined; body?: string | undefined; focusKeyword?: string | undefined;
  authorName?: string | undefined; authorRole?: string | undefined; expertise?: string[] | undefined;
  pages?: PageRef[] | undefined;
}
export interface OgeApply {
  seo?: (r: SeoResult) => void;
  excerpt?: (r: string) => void;
  insertTop?: (html: string) => void;    // TL;DR at the top of the article
  insertBottom?: (html: string) => void; // FAQ section at the bottom
  /** The article as it stands, so a link suggestion can be located in the real copy. */
  getBody?: () => string;
  /** Put the link on the phrase where it already appears. False when it could not be placed. */
  linkInline?: (anchor: string, target: string) => boolean;
  storeFaqs?: (items: FaqItem[]) => void; // persist for FAQPage schema
  editFaqs?: (items: FaqItem[]) => void;  // the same setter, used when a question is edited by hand
  storeTldr?: (items: string[]) => void;
}
export interface OgeSeo {
  score: number;
  /** The checks behind the score, so the panel can say what is missing rather than only how much. */
  findings?: MetaFinding[];
  metaTitle: string; setMetaTitle: (v: string) => void;
  metaDesc: string; setMetaDesc: (v: string) => void;
}
export interface OgeBios {
  authorName?: string | undefined; factCheckerName?: string | undefined;
  authorBio: string; factCheckerBio: string;
  setAuthorBio: (v: string) => void; setFactCheckerBio: (v: string) => void;
  /**
   * The assigned person's real record: role, years, expertise and their standing profile bio.
   *
   * A per-article bio is an E-E-A-T signal, so it has to be true about the person as well as about
   * the article. Sending only a name left the model nothing factual to work from, which is the
   * condition under which it invents a title or a number of years.
   */
  authorContext?: Record<string, unknown>;
  factCheckerContext?: Record<string, unknown>;
}

const TAB_META: Record<OgeTab, { label: string; icon: typeof Search; kind: string }> = {
  seo: { label: "SEO", icon: Search, kind: "seo" },
  tldr: { label: "TL;DR", icon: ListTree, kind: "tldr" },
  excerpt: { label: "Excerpt", icon: AlignLeft, kind: "excerpt" },
  "author-bio": { label: "Author Bio", icon: User, kind: "author-bio" },
  faqs: { label: "FAQs", icon: HelpCircle, kind: "faqs" },
  "internal-links": { label: "Internal Links", icon: Link2, kind: "internal-links" },
  more: { label: "More", icon: LayoutList, kind: "" },
};

const fieldSm = "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[0.82rem] text-slate-900 placeholder:text-slate-400 focus:border-[#543CDA] focus:outline-none focus:ring-2 focus:ring-[#543CDA]/15 resize-none";

async function callOge(kind: string, ctx: OgeContext, extra?: Record<string, unknown>): Promise<{ result: unknown; source: "oge" | "fallback" } | null> {
  try {
    const res = await fetch("/api/cms/oge/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, ...ctx, ...extra }) });
    if (!res.ok) return null;
    return (await res.json()) as { result: unknown; source: "oge" | "fallback" };
  } catch { return null; }
}

/** What the page already holds, so the panel opens describing the page rather than the session. */
export interface OgeInitial { faqs?: FaqItem[]; tldr?: string[]; excerpt?: string }

export function OgeAssistant({ tabs, getContext, apply, seo, bios, initial }: { tabs: OgeTab[]; getContext: () => OgeContext; apply?: OgeApply; seo?: OgeSeo; bios?: OgeBios; initial?: OgeInitial }): ReactNode {
  // Only the first three tabs show inline; the rest live behind a "More" menu so the tab row never
  // overflows or wraps, even on a 360px panel.
  const realTabs = tabs.filter((t) => t !== "more");
  const primary = realTabs.slice(0, 3);
  const overflow = realTabs.slice(3);
  const [active, setActive] = useState<OgeTab>(realTabs[0] ?? "seo");
  const [moreOpen, setMoreOpen] = useState(false);
  const [busy, setBusy] = useState("");
  const [source, setSource] = useState<Record<string, "oge" | "fallback">>({});
  /*
   * Seeded from what the page already holds.
   *
   * These were component state starting empty, so everything Oge had produced disappeared on
   * reload: the panel offered to generate FAQs that were already written, and the excerpt and
   * TL;DR looked as though nothing had been done. Seeding from the saved values means the panel
   * describes the page rather than the session.
   */
  const [results, setResults] = useState<Record<string, unknown>>(() => {
    const seed: Record<string, unknown> = {};
    if (initial?.faqs && initial.faqs.length > 0) seed["faqs"] = initial.faqs;
    if (initial?.tldr && initial.tldr.length > 0) seed["tldr"] = initial.tldr;
    if (initial?.excerpt) seed["excerpt"] = initial.excerpt;
    return seed;
  });
  const [copied, setCopied] = useState("");
  const overflowActive = overflow.some((t) => t === active);

  /**
   * Run one generation.
   *
   * `busyKey` exists so two controls that call the same kind can spin separately. The meta title and
   * the meta description are both drafted by the "seo" kind, and while they shared a busy flag,
   * asking for one set every spinner in the tab going and looked as though both were being rewritten.
   */
  const run = async (kind: string, extra?: Record<string, unknown>, busyKey?: string): Promise<unknown> => {
    setBusy(busyKey ?? kind);
    const r = await callOge(kind, getContext(), extra);
    setBusy("");
    if (r) {
      setResults((s) => ({ ...s, [kind]: r.result })); setSource((s) => ({ ...s, [kind]: r.source }));
      if (kind === "faqs" && apply?.storeFaqs) apply.storeFaqs(r.result as FaqItem[]);
      if (kind === "tldr" && apply?.storeTldr) apply.storeTldr(r.result as string[]);
      return r.result;
    }
    return null;
  };
  const copy = (key: string, text: string): void => { void navigator.clipboard?.writeText(text); setCopied(key); setTimeout(() => setCopied(""), 1500); };

  return (
    <section className="overflow-hidden rounded-2xl border border-[#543CDA]/20 bg-white shadow-subtle">
      <div className="flex items-center gap-2 border-b border-[#543CDA]/15 bg-[#F4F1FD] px-4 py-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[#543CDA] to-[#6A55F2] text-white"><Sparkles size={15} /></span>
        <span className="min-w-0"><span className="block text-[0.9rem] font-700 text-[#543CDA]">Oge AI Assistant</span><span className="block truncate text-[0.7rem] text-slate-500">AI copilot for high-quality, SEO-friendly content</span></span>
      </div>

      <div className="flex items-center gap-1 border-b border-slate-100 px-2 py-2">
        {primary.map((t) => { const m = TAB_META[t]; const on = active === t; return (
          <button key={t} type="button" onClick={() => setActive(t)}
            className={`inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[0.76rem] font-600 ${on ? "bg-[#543CDA] text-white" : "text-slate-500 hover:bg-slate-100"}`}>
            <m.icon size={13} className="shrink-0" /> <span className="truncate">{m.label}</span>
          </button>
        ); })}
        {overflow.length ? (
          <div className="relative shrink-0">
            <button type="button" onClick={() => setMoreOpen((o) => !o)} aria-haspopup="menu" aria-expanded={moreOpen}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[0.76rem] font-600 ${overflowActive ? "bg-[#543CDA] text-white" : "text-slate-500 hover:bg-slate-100"}`}>
              <LayoutList size={13} /> <span className="max-w-[5.5rem] truncate">{overflowActive ? TAB_META[active].label : "More"}</span> <ChevronDown size={12} className={moreOpen ? "rotate-180" : ""} />
            </button>
            {moreOpen ? (
              <>
                <button type="button" aria-label="Close menu" className="fixed inset-0 z-10 cursor-default" onClick={() => setMoreOpen(false)} />
                <div role="menu" className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                  {overflow.map((t) => { const m = TAB_META[t]; const on = active === t; return (
                    <button key={t} type="button" role="menuitem" onClick={() => { setActive(t); setMoreOpen(false); }}
                      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[0.78rem] font-600 ${on ? "bg-[#EEEBFC] text-[#543CDA]" : "text-slate-600 hover:bg-slate-100"}`}>
                      <m.icon size={13} className="shrink-0" /> <span className="min-w-0 flex-1 truncate">{m.label}</span> {on ? <Check size={12} className="text-[#543CDA]" /> : null}
                    </button>
                  ); })}
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="p-4">
        {active === "seo" ? <SeoTab busy={busy} source={source.seo} seo={seo}
            onGenerate={async () => { const r = (await run("seo")) as SeoResult | null; if (r && seo) { seo.setMetaTitle(r.metaTitle); seo.setMetaDesc(r.metaDescription); } else if (r && apply?.seo) apply.seo(r); }}
            onGenerateField={async (field) => {
              // The gateway drafts the pair together, because a description that ignores its own
              // title reads like it belongs to another page. Only the field that was asked for is
              // written back, so whatever the editor already worded by hand survives, and the
              // busy key names the field so the other one's button does not spin with it.
              const r = (await run("seo", undefined, `seo:${field}`)) as SeoResult | null;
              if (!r || !seo) return;
              if (field === "title") seo.setMetaTitle(r.metaTitle);
              else seo.setMetaDesc(r.metaDescription);
            }} />
          : active === "tldr" ? <TldrTab busy={busy === "tldr"} source={source.tldr} result={results.tldr as string[] | undefined} onGenerate={() => void run("tldr")} onInsert={(html) => apply?.insertTop?.(html)} copied={copied} onCopy={copy} />
          : active === "excerpt" ? <ExcerptTab busy={busy === "excerpt"} source={source.excerpt} result={results.excerpt as string | undefined} onGenerate={() => void run("excerpt")} onApply={apply?.excerpt} copied={copied} onCopy={copy} />
          : active === "author-bio" ? <BioTab busy={busy} source={source} bios={bios} onGenerate={(_who, ctx) => run("author-bio", ctx)} onInsert={(html) => apply?.insertBottom?.(html)} />
          : active === "faqs" ? <FaqTab busy={busy === "faqs"} source={source.faqs} result={results.faqs as FaqItem[] | undefined} onGenerate={() => void run("faqs")} onEdit={apply?.editFaqs ? (items) => { setResults((r) => ({ ...r, faqs: items })); apply.editFaqs?.(items); } : undefined} />
          : active === "internal-links" ? <LinksTab busy={busy === "internal-links"} source={source["internal-links"]} result={results["internal-links"] as InternalLink[] | undefined} onGenerate={() => void run("internal-links")} getBody={apply?.getBody} linkInline={apply?.linkInline} />
          : <MoreTab />}
      </div>
    </section>
  );
}

function ScoreGauge({ value }: { value: number }): ReactNode {
  const r = 34, c = 2 * Math.PI * r, off = c - (Math.max(0, Math.min(100, value)) / 100) * c;
  const color = value >= 80 ? "#16A34A" : value >= 50 ? "#B45309" : "#DC2626";
  const label = value >= 80 ? "Good" : value >= 50 ? "Fair" : "Needs work";
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-24 w-24">
        <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90">
          <circle cx="40" cy="40" r={r} fill="none" stroke="#EEF2F7" strokeWidth="7" />
          <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center"><span><span className="block text-[1.3rem] font-700 text-slate-900">{value}</span><span className="block text-[0.6rem] text-slate-500">/100</span></span></div>
      </div>
      <span className="mt-1 text-[0.78rem] font-600" style={{ color }}>{label}</span>
    </div>
  );
}

function GenBtn({ busy, has, onClick, label }: { busy: boolean; has: boolean; onClick: () => void; label?: string }): ReactNode {
  return (
    <button type="button" disabled={busy} onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[#543CDA]/30 px-3 py-1.5 text-[0.78rem] font-600 text-[#543CDA] hover:bg-[#EEEBFC] disabled:opacity-60">
      {busy ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} {label ?? (has ? "Regenerate" : "Generate")}
    </button>
  );
}
/**
 * A compact generate control that sits on a single field's label.
 *
 * The SEO tab had one button that rewrote the meta title and the meta description together, so
 * someone who had worded the title exactly as they wanted and only needed a fresh description lost
 * the title to get it. Each field now asks for its own.
 */
function FieldGenBtn({ busy, onClick, title }: { busy: boolean; onClick: () => void; title: string }): ReactNode {
  return (
    <button type="button" disabled={busy} onClick={onClick} title={title} aria-label={title}
      className="inline-flex items-center gap-1 rounded-md border border-[#543CDA]/30 px-1.5 py-0.5 text-[0.68rem] font-600 text-[#543CDA] hover:bg-[#EEEBFC] disabled:opacity-60">
      {busy ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />} Generate
    </button>
  );
}
function Badge({ source }: { source: "oge" | "fallback" | undefined }): ReactNode {
  if (!source) return null;
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.64rem] font-600 ${source === "oge" ? "bg-[#EEEBFC] text-[#543CDA]" : "bg-slate-100 text-slate-600"}`}>{source === "oge" ? "Oge" : "Draft"}</span>;
}
function InsertBtn({ onClick, label }: { onClick: () => void; label: string }): ReactNode {
  return <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 rounded-lg bg-[#543CDA] px-3 py-1.5 text-[0.78rem] font-600 text-white hover:bg-[#4330B8]"><CornerDownLeft size={13} /> {label}</button>;
}
function CopyBtn({ k, text, copied, onCopy }: { k: string; text: string; copied: string; onCopy: (k: string, t: string) => void }): ReactNode {
  return <button type="button" onClick={() => onCopy(k, text)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[0.76rem] font-600 text-slate-500 hover:bg-slate-50">{copied === k ? <Check size={12} className="text-[#15803D]" /> : <Copy size={12} />} {copied === k ? "Copied" : "Copy"}</button>;
}

function SeoTab({ busy, source, seo, onGenerate, onGenerateField }: { busy: string; source: "oge" | "fallback" | undefined; seo?: OgeSeo | undefined; onGenerate: () => void; onGenerateField: (field: "title" | "description") => void }): ReactNode {
  if (!seo) {
    return <div><div className="mb-3 flex items-center justify-between"><p className="text-[0.78rem] text-slate-500">Draft a meta title and description for search and AI answers.</p><Badge source={source} /></div><GenBtn busy={busy === "seo"} has={false} onClick={onGenerate} label="Generate with Oge" /></div>;
  }
  const inWindow = seo.metaDesc.length >= 155 && seo.metaDesc.length <= 160;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-[0.8rem] font-700 text-slate-800">SEO Score</span><Badge source={source} />
      </div>
      <ScoreGauge value={seo.score} />

      {/* What the missing points are.
          The gauge on its own was a number an editor could read and not act on: 57 out of 100, with
          no way to find out what the other 43 was. Each failing check says what to change. */}
      {(seo.findings ?? []).some((f) => !f.pass) ? (
        <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-3">
          <p className="text-[0.74rem] font-700 uppercase tracking-wide text-[#B45309]">To raise this score</p>
          <ul className="mt-2 flex flex-col gap-2">
            {(seo.findings ?? []).filter((f) => !f.pass).map((f) => (
              <li key={f.id} className="flex gap-2">
                <span className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#B45309]" aria-hidden="true" />
                <span>
                  <span className="block text-[0.78rem] font-600 text-slate-800">{f.label}</span>
                  <span className="block text-[0.76rem] leading-snug text-slate-600">{f.fix}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (seo.findings ?? []).length > 0 ? (
        <p className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-[0.78rem] text-green-700">
          Every check passes. Nothing here is holding the score down.
        </p>
      ) : null}

      {/* Field rows are divs, not labels: a click inside a label is forwarded to its control, so a
          Generate button placed in one also grabbed focus for the input beneath it. */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2 text-[0.74rem] font-600 text-slate-600">
          <span className="flex items-center gap-2">
            Meta Title
            <FieldGenBtn busy={busy === "seo:title"} onClick={() => onGenerateField("title")} title="Draft a meta title with Oge" />
          </span>
          <span className="text-slate-500">{seo.metaTitle.length}/60</span>
        </div>
        <input value={seo.metaTitle} onChange={(e) => seo.setMetaTitle(e.target.value)} placeholder="Defaults to the page title" className={fieldSm} />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2 text-[0.74rem] font-600 text-slate-600">
          <span className="flex items-center gap-2">
            Meta Description
            <FieldGenBtn busy={busy === "seo:description"} onClick={() => onGenerateField("description")} title="Draft a meta description with Oge" />
          </span>
          <span className={inWindow ? "text-[#15803D]" : "text-slate-500"}>{seo.metaDesc.length}/160</span>
        </div>
        <textarea value={seo.metaDesc} onChange={(e) => seo.setMetaDesc(e.target.value)} rows={3} maxLength={200} placeholder="The snippet shown in search and AI answers" className={fieldSm} />
      </div>

      <GenBtn busy={busy === "seo"} has onClick={onGenerate} label="Regenerate both" />
    </div>
  );
}

function TldrTab({ busy, source, result, onGenerate, onInsert, copied, onCopy }: { busy: boolean; source: "oge" | "fallback" | undefined; result?: string[] | undefined; onGenerate: () => void; onInsert: (html: string) => void; copied: string; onCopy: (k: string, t: string) => void }): ReactNode {
  const html = result ? `<h2>TL;DR</h2><ul>${result.map((b) => `<li>${b}</li>`).join("")}</ul>` : "";
  return (
    <div>
      <div className="mb-3 flex items-center justify-between"><p className="text-[0.78rem] text-slate-500">A scannable summary, inserted at the top of the article.</p><Badge source={source} /></div>
      {result ? <ul className="mb-3 list-disc space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-3 pl-7 text-[0.83rem] text-slate-700">{result.map((b, i) => <li key={i}>{b}</li>)}</ul> : null}
      <div className="flex flex-wrap items-center gap-2"><GenBtn busy={busy} has={!!result} onClick={onGenerate} />{result ? <InsertBtn onClick={() => onInsert(html)} label="Insert TL;DR into content" /> : null}{result ? <CopyBtn k="tldr" text={result.join("\n")} copied={copied} onCopy={onCopy} /> : null}</div>
    </div>
  );
}

function ExcerptTab({ busy, source, result, onGenerate, onApply, copied, onCopy }: { busy: boolean; source: "oge" | "fallback" | undefined; result?: string | undefined; onGenerate: () => void; onApply?: ((r: string) => void) | undefined; copied: string; onCopy: (k: string, t: string) => void }): ReactNode {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between"><p className="text-[0.78rem] text-slate-500">A one to two sentence summary for cards and search.</p><Badge source={source} /></div>
      {result ? <p className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-[0.84rem] text-slate-700">{result}</p> : null}
      <div className="flex flex-wrap items-center gap-2"><GenBtn busy={busy} has={!!result} onClick={onGenerate} />{result && onApply ? <InsertBtn onClick={() => onApply(result)} label="Apply to excerpt" /> : null}{result ? <CopyBtn k="excerpt" text={result} copied={copied} onCopy={onCopy} /> : null}</div>
    </div>
  );
}

function BioTab({ busy, source, bios, onGenerate, onInsert }: { busy: string; source: Record<string, "oge" | "fallback">; bios?: OgeBios | undefined; onGenerate: (who: "author" | "fact-checker", ctx: Record<string, unknown>) => Promise<unknown>; onInsert: (html: string) => void }): ReactNode {
  const [who, setWho] = useState<"author" | "fact-checker">("author");
  if (!bios) return <p className="text-[0.8rem] text-slate-500">Assign an author to generate a bio.</p>;
  const name = who === "author" ? bios.authorName : bios.factCheckerName;
  const value = who === "author" ? bios.authorBio : bios.factCheckerBio;
  const setValue = who === "author" ? bios.setAuthorBio : bios.setFactCheckerBio;
  const key = who === "author" ? "author-bio" : "author-bio";
  const generate = async (): Promise<void> => {
    // The whole record for whichever person is selected. The fact-checker's role is stated so the
    // bio explains what they checked rather than reading like a second author byline.
    const ctx = who === "author" ? (bios.authorContext ?? {}) : { ...(bios.factCheckerContext ?? {}), authorRole: "Fact-Checker" };
    const r = (await onGenerate(who, { authorName: name, ...ctx })) as string | null;
    if (typeof r === "string" && r) setValue(r);
  };
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="inline-flex rounded-lg border border-slate-200 p-0.5 text-[0.74rem] font-600">
          <button type="button" onClick={() => setWho("author")} className={`rounded-md px-2.5 py-1 ${who === "author" ? "bg-[#543CDA] text-white" : "text-slate-500"}`}>Author</button>
          <button type="button" onClick={() => setWho("fact-checker")} className={`rounded-md px-2.5 py-1 ${who === "fact-checker" ? "bg-[#543CDA] text-white" : "text-slate-500"}`}>Fact-Checker</button>
        </div>
        <Badge source={source[key]} />
      </div>
      <p className="mb-2 text-[0.76rem] text-slate-500">{name ? `Per-article bio for ${name}.` : `Assign a ${who === "author" ? "author" : "fact-checker"} first.`}</p>
      <textarea value={value} onChange={(e) => setValue(e.target.value)} rows={5} placeholder="A short, article-specific bio in the house voice..." className={fieldSm} />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <GenBtn busy={busy === "author-bio"} has={!!value} onClick={() => void generate()} label="Regenerate Bio" />
        {value ? <InsertBtn onClick={() => onInsert(`<p><em>${value}</em></p>`)} label="Insert Bio into content" /> : null}
      </div>
    </div>
  );
}

function FaqTab({ busy, source, result, onGenerate, onEdit }: { busy: boolean; source: "oge" | "fallback" | undefined; result?: FaqItem[] | undefined; onGenerate: () => void; onEdit?: ((items: FaqItem[]) => void) | undefined }): ReactNode {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[0.78rem] text-slate-500">5 to 7 questions with precise answers.</p>
        <Badge source={source} />
      </div>
      {/* Editable in place.
          A generated question is a first draft: the wording is often nearly right and the answer
          often needs a figure corrected. Regenerating the whole set to fix one word threw away the
          six that were already good, so each is editable and each can be removed on its own. */}
      {result ? (
        <div className="mb-3 space-y-2">
          {result.map((f, i) => (
            <details key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
              <summary className="cursor-pointer text-[0.82rem] font-600 text-slate-800">{i + 1}. {f.question}</summary>
              {onEdit ? (
                <div className="mt-2 flex flex-col gap-2">
                  <input
                    value={f.question}
                    onChange={(e) => onEdit(result.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)))}
                    aria-label={`Question ${i + 1}`}
                    className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-[0.8rem] font-600 focus:border-[#543CDA] focus:outline-none"
                  />
                  <textarea
                    rows={3}
                    value={f.answer}
                    onChange={(e) => onEdit(result.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)))}
                    aria-label={`Answer ${i + 1}`}
                    className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-[0.8rem] focus:border-[#543CDA] focus:outline-none"
                  />
                  <button type="button" onClick={() => onEdit(result.filter((_, j) => j !== i))}
                    className="self-start text-[0.74rem] font-600 text-slate-500 hover:text-[#B91C1C]">
                    Remove this question
                  </button>
                </div>
              ) : (
                <p className="mt-1.5 text-[0.8rem] text-slate-600">{f.answer}</p>
              )}
            </details>
          ))}
        </div>
      ) : null}
      {/* Generating saves the set to the page's own faqs field, which is what the published page
          renders and what faqPageNode turns into FAQPage schema. There is deliberately no "insert
          into content" any more: pasting the same questions into the body published them twice,
          and that second copy was plain markup carrying no schema at all. */}
      <p className="mb-3 text-[0.74rem] text-slate-500">
        {result
          ? `Saved with this page. ${result.length} question${result.length === 1 ? "" : "s"} will publish in the FAQ section, wrapped in FAQPage schema.`
          : "Generated questions are saved with the page and published with FAQPage schema."}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <GenBtn busy={busy} has={!!result} onClick={onGenerate} label={result ? "Regenerate FAQs" : "Generate FAQs"} />
      </div>
    </div>
  );
}

function LinksTab({ busy, source, result, onGenerate, getBody, linkInline }: {
  busy: boolean;
  source: "oge" | "fallback" | undefined;
  result?: InternalLink[] | undefined;
  onGenerate: () => void;
  getBody?: (() => string) | undefined;
  linkInline?: ((anchor: string, target: string) => boolean) | undefined;
}): ReactNode {
  // What happened to each suggestion once acted on, so a row can report its own outcome.
  const [done, setDone] = useState<Record<string, "placed" | "missing">>({});

  const body = getBody?.() ?? "";

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[0.78rem] leading-relaxed text-slate-600">
          Each link is placed on the phrase where it already appears in your writing, not added as a
          list at the end.
        </p>
        <Badge source={source} />
      </div>

      {result && result.length ? (
        <div className="mb-3 space-y-2">
          {result.map((l, i) => {
            const key = `${l.anchor}|${l.target}`;
            const found = body ? findAnchor(body, l.anchor) : null;
            const linked = body ? alreadyLinks(body, l.target) : false;
            const state = done[key];

            return (
              <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-[0.8rem]">
                <p className="break-all font-mono text-[0.7rem] text-slate-600">{l.target}</p>

                {found ? (
                  <>
                    <p className="mt-1.5 text-[0.7rem] font-600 uppercase tracking-wide text-slate-500">
                      Paragraph {found.paragraphNumber}
                    </p>
                    {/* The exact sentence, with the anchor text marked where the link will go. */}
                    <p className="mt-1 rounded-md border border-slate-200 bg-white p-2 text-[0.78rem] leading-relaxed text-slate-700">
                      <span>{trimEnd(found.before)}</span>
                      <mark className="rounded bg-[#EEEBFC] px-0.5 font-600 text-[#543CDA]">{found.match}</mark>
                      <span>{trimStart(found.after)}</span>
                    </p>
                  </>
                ) : (
                  <p className="mt-1.5 rounded-md border border-dashed border-slate-300 bg-white p-2 text-[0.76rem] leading-relaxed text-slate-600">
                    &ldquo;{l.anchor}&rdquo; does not appear in the article yet, so there is nowhere to put
                    this link. Write the phrase into a sentence and refresh.
                  </p>
                )}

                <p className="mt-1.5 text-[0.74rem] text-slate-600">{l.rationale}</p>

                <div className="mt-2 flex items-center justify-end gap-2">
                  {state === "placed" || linked ? (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-[#DCFCE7] px-2.5 py-1.5 text-[0.74rem] font-600 text-[#15803D]">
                      <Check size={12} /> Linked
                    </span>
                  ) : state === "missing" ? (
                    <span className="text-[0.74rem] font-600 text-[#B45309]">Could not place it</span>
                  ) : (
                    <button type="button" disabled={!found || !linkInline}
                      /*
                       * Place the link, then record what happened. Not the other way round.
                       *
                       * This used to call linkInline inside the setDone updater. React runs an
                       * updater during the next render, so placing the link — which writes the new
                       * body back into the editor — happened while this component was rendering, and
                       * React warned that one component was updating another mid-render. An updater
                       * has to be pure; the work belongs in the handler.
                       */
                      onClick={() => {
                        const placed = linkInline?.(l.anchor, l.target) ?? false;
                        setDone((d) => ({ ...d, [key]: placed ? "placed" : "missing" }));
                      }}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#543CDA] px-2.5 py-1.5 text-[0.74rem] font-600 text-white hover:bg-[#4330B8] disabled:cursor-not-allowed disabled:bg-slate-300">
                      <CornerDownLeft size={12} /> Place link
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : result ? (
        <p className="mb-3 text-[0.8rem] text-slate-600">No strong matches yet. Add more content, then regenerate.</p>
      ) : null}

      <GenBtn busy={busy} has={!!result} onClick={onGenerate} label="Refresh Suggestions" />
    </div>
  );
}

/** Keep the sentence readable in a narrow panel without cutting the anchor out of its context. */
function trimEnd(s: string): string { return s.length > 90 ? `…${s.slice(-90)}` : s; }
function trimStart(s: string): string { return s.length > 90 ? `${s.slice(0, 90)}…` : s; }


function MoreTab(): ReactNode {
  const items = ["Recommended Reads", "Content Optimizer", "Structured Data", "Oge Recommendations"];
  return (
    <div>
      <p className="mb-3 text-[0.78rem] leading-relaxed text-slate-500">More Oge helpers work from the article once it has a body:</p>
      <ul className="space-y-1.5">
        {items.map((i) => <li key={i} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-[0.82rem] font-600 text-slate-600"><ChevronDown size={13} className="text-slate-500" /> {i}</li>)}
      </ul>
    </div>
  );
}
