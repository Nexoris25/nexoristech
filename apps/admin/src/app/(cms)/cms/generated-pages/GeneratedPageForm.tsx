"use client";
/**
 * Create / edit generated page (CMS Programmatic SEO design, PRD §9.6). Left column: page information
 * (title, slug, primary service, industry, target location, target keyword, search intent, short
 * description), the page body in the rich text editor, then the featured image and publish settings.
 * Right column: the Oge AI Assistant (SEO gauge, recommendations, TL;DR). Balanced, responsive to 360px.
 * Native POST to /api/cms/generated-pages. A page only publishes when it clears the quality + readiness
 * gates (PRD §9.7); the editor surfaces the SEO score here.
 */
import { useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { RichTextEditor, type RichTextApi } from "../../../../components/cms/RichTextEditor.js";
import { OgeAssistant } from "../../../../components/cms/OgeAssistant.js";
import { metaChecks, metaFindings, metaScore } from "../../../../lib/meta-quality.js";
import type { FaqItem, PageRef } from "../../../../components/cms/OgeAssistant.js";
import { ImageUpload } from "../../../../components/cms/ImageUpload.js";
// The publish gate's own floor, so the editor and the gate can never disagree about the number.
import { MIN_BODY_WORDS, MIN_READINESS } from "../../../../lib/pseo-gate.js";
import { computeReadiness } from "../../../../lib/pseo-readiness.js";
import { PSEO_LOCATIONS } from "../../../../lib/pseo-constants.js";
import { SERVICES as CATALOGUE_SERVICES, INDUSTRIES as CATALOGUE_INDUSTRIES } from "@nexoris/recommend";

interface Option { id: string; name: string }
interface Initial {
  id?: string; title?: string; slug?: string; primaryService?: string; industry?: string; targetLocation?: string;
  targetKeyword?: string; searchIntent?: string; excerpt?: string; body?: string; status?: string; template?: string;
  featuredImage?: string; featuredImageAlt?: string; metaTitle?: string; metaDescription?: string; publishDate?: string; noindex?: boolean;
  authorId?: string; factCheckerId?: string; authorBio?: string; factCheckerBio?: string; shortTitle?: string;
  categoryId?: string;
}
const field = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[0.86rem] text-slate-900 placeholder:text-slate-400 focus:border-[#543CDA] focus:outline-none focus:ring-2 focus:ring-[#543CDA]/15 resize-none";
const label = "text-[0.8rem] font-600 text-slate-700";
const slugify = (s: string): string => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
// A concise label from the full title, used in breadcrumbs and the Generated Pages list.
const shortify = (s: string): string => {
  const base = (s.split(/[:—–|]/)[0] ?? s).trim() || s.trim();
  if (base.length <= 48) return base;
  const cut = base.slice(0, 48);
  return (cut.includes(" ") ? cut.slice(0, cut.lastIndexOf(" ")) : cut).trim();
};
const wordsOf = (html: string): number => html.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
/**
 * The real catalogue, not a second one written by hand.
 *
 * These three lists used to be hardcoded here: six services ("AI Solutions", "Cloud Services", …), six
 * industries, and four locations. None of them matched what the site actually sells or what the pSEO
 * generator proposes against — it reads the same catalogue the recommender and the service pages use.
 * So a page created through this form could be filed under a service that does not exist as a page,
 * and its location could be one the generator never scores.
 */
const SERVICES = CATALOGUE_SERVICES.map((s) => s.label);
const INDUSTRIES = CATALOGUE_INDUSTRIES.map((i) => i.label);
const LOCATIONS = [...PSEO_LOCATIONS];
const INTENTS = ["Informational", "Commercial", "Transactional", "Navigational"];


export function GeneratedPageForm({ initial, templates, authors = [], categories = [], pages = [] }: { initial?: Initial; templates: string[]; authors?: Option[]; categories?: Option[]; pages?: PageRef[] }): ReactNode {
  const edit = Boolean(initial?.id);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(initial?.slug));
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [shortEdited, setShortEdited] = useState(Boolean(initial?.shortTitle));
  const [shortTitle, setShortTitle] = useState(initial?.shortTitle ?? "");
  const [keyword, setKeyword] = useState(initial?.targetKeyword ?? "");
  // Controlled, so the chosen template can be sent with the generate request. It used to be
  // uncontrolled and reached only the form post, which is why the picker never shaped the page.
  const [template, setTemplate] = useState(initial?.template ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [tldr, setTldr] = useState<string[]>([]);
  const [metaTitle, setMetaTitle] = useState(initial?.metaTitle ?? "");
  const [metaDesc, setMetaDesc] = useState(initial?.metaDescription ?? "");
  const [industry, setIndustry] = useState(initial?.industry ?? "");
  const [service, setService] = useState(initial?.primaryService ?? "");
  const [authorId, setAuthorId] = useState(initial?.authorId ?? "");
  // Controlled, because the readiness checklist below judges local specificity against it and has to
  // react when it changes rather than only on save.
  const [targetLocation, setTargetLocation] = useState(initial?.targetLocation ?? "Global");
  const [factCheckerId, setFactCheckerId] = useState(initial?.factCheckerId ?? "");
  const [authorBio, setAuthorBio] = useState(initial?.authorBio ?? "");
  const [factCheckerBio, setFactCheckerBio] = useState(initial?.factCheckerBio ?? "");
  const [generating, setGenerating] = useState(false);
  const nameOf = (id: string): string | undefined => authors.find((a) => a.id === id)?.name;
  const rte = useRef<RichTextApi | null>(null);
  const shownSlug = slugEdited ? slug : slugify(title);
  const shownShort = shortEdited ? shortTitle : shortify(title);

  async function generateContent(): Promise<void> {
    if (generating) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/cms/oge/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "page-body", title, focusKeyword: keyword, industry, service, template }),
      });
      const json = (await res.json().catch(() => ({}))) as { result?: string };
      if (typeof json.result === "string" && json.result.trim()) rte.current?.setHtml(json.result);
    } finally { setGenerating(false); }
  }
  const words = useMemo(() => wordsOf(body), [body]);
  const findings = metaFindings({
    title, metaTitle, metaDesc, body, words,
    minWords: MIN_BODY_WORDS, requireStructure: true, requireLinks: true,
  });
  const checks = metaChecks({
    title, metaTitle, metaDesc, body, words,
    minWords: MIN_BODY_WORDS, requireStructure: true, requireLinks: true,
  });
  const score = metaScore(checks);

  /*
   * The publish gate's own verdict, shown while the page is being written.
   *
   * The gate holds a failing page at draft and forces noindex, which is the right thing to do and
   * was invisible: the save came back, the status said Draft, and nothing said why. Someone would
   * set Published, save, and find it draft again with no explanation to act on.
   *
   * This calls the same function the route calls, so the checklist and the gate cannot disagree.
   */
  const readiness = useMemo(
    () => computeReadiness({ body, authorId, metaDescription: metaDesc, targetLocation }),
    [body, authorId, metaDesc, targetLocation],
  );

  return (
    <form action="/api/cms/generated-pages" method="post">
      {edit ? <input type="hidden" name="id" value={initial!.id} /> : null}
      <input type="hidden" name="meta_title" value={metaTitle} />
      <input type="hidden" name="meta_description" value={metaDesc} />
      <input type="hidden" name="target_keyword" value={keyword} />
      <input type="hidden" name="author_bio" value={authorBio} />
      <input type="hidden" name="fact_checker_bio" value={factCheckerBio} />
      {/* Generated FAQs and TL;DR travel with the save, so they reach the page's schema rather than
          living only in the body text. */}
      <input type="hidden" name="faqs" value={faqs.length ? JSON.stringify(faqs) : ""} />
      <input type="hidden" name="tldr" value={tldr.length ? JSON.stringify(tldr) : ""} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.75fr_1fr]">
        <div className="flex min-w-0 flex-col gap-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle sm:p-5">
            <h2 className="text-[0.95rem] font-700 text-slate-900">Page Information</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 sm:col-span-2"><span className={label}>Page Title <span className="text-[#EF4444]">*</span></span><input name="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. AI in Healthcare Solutions" className={field} /></label>
              <label className="flex flex-col gap-1.5 sm:col-span-2"><span className={label}>Slug</span><input name="slug" value={shownSlug} onChange={(e) => { setSlugEdited(true); setSlug(e.target.value); }} placeholder="ai-in-healthcare-solutions" className={`${field} font-mono`} /></label>
              <label className="flex flex-col gap-1.5 sm:col-span-2"><span className={label}>Short title</span>
                <input name="short_title" value={shownShort} maxLength={60} onChange={(e) => { setShortEdited(true); setShortTitle(e.target.value); }} placeholder="Auto-generated from the title" className={field} />
                <span className="text-[0.7rem] text-slate-500">Used in breadcrumbs and the Generated Pages list. Auto-filled from the title; edit to override.</span>
              </label>
              <label className="flex flex-col gap-1.5"><span className={label}>Primary Service <span className="text-[#EF4444]">*</span></span>
                <select name="service_industry" value={service} onChange={(e) => setService(e.target.value)} className={`cursor-pointer ${field}`}><option value="">Select service</option>{SERVICES.map((s) => <option key={s}>{s}</option>)}</select>
              </label>
              <label className="flex flex-col gap-1.5"><span className={label}>Industry <span className="text-[#EF4444]">*</span></span>
                <select name="industry" value={industry} onChange={(e) => setIndustry(e.target.value)} className={`cursor-pointer ${field}`}><option value="">Select industry</option>{INDUSTRIES.map((s) => <option key={s}>{s}</option>)}</select>
              </label>
              <label className="flex flex-col gap-1.5"><span className={label}>Target Location</span>
                {/*
                  * A stored location outside the catalogue stays selectable. The editor has always
                  * defaulted to "Global", which is not one of the seven the generator scores, so a
                  * plain catalogue list would silently rewrite an existing page's location on save.
                  */}
                <select name="target_location" value={targetLocation} onChange={(e) => setTargetLocation(e.target.value)} className={`cursor-pointer ${field}`}>{(LOCATIONS.includes(targetLocation as (typeof LOCATIONS)[number]) ? LOCATIONS : [targetLocation, ...LOCATIONS]).map((s) => <option key={s}>{s}</option>)}</select>
              </label>
              <label className="flex flex-col gap-1.5"><span className={label}>Search Intent <span className="text-[#EF4444]">*</span></span>
                <select name="search_intent" defaultValue={initial?.searchIntent ?? "Informational"} className={`cursor-pointer ${field}`}>{INTENTS.map((s) => <option key={s}>{s}</option>)}</select>
              </label>
              {/* A named author and fact-checker are what make a programmatic page credible (E-E-A-T). */}
              <label className="flex flex-col gap-1.5"><span className={label}>Author</span>
                <select name="author_id" value={authorId} onChange={(e) => setAuthorId(e.target.value)} className={`cursor-pointer ${field}`}><option value="">Unassigned</option>{authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
              </label>
              <label className="flex flex-col gap-1.5"><span className={label}>Fact-Checker</span>
                <select name="fact_checker_id" value={factCheckerId} onChange={(e) => setFactCheckerId(e.target.value)} className={`cursor-pointer ${field}`}><option value="">Unassigned</option>{authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
              </label>
              {/* A programmatic page belongs somewhere, the same as an article does. Without this there
                  was no way to group these pages or tell a reader what they sit under. */}
              <label className="flex flex-col gap-1.5"><span className={label}>Category</span>
                <select name="category_id" defaultValue={initial?.categoryId ?? ""} className={`cursor-pointer ${field}`}>
                  <option value="">Uncategorised</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {categories.length === 0
                  ? <span className="text-[0.72rem] text-slate-500">No categories exist yet. Create one under Categories.</span>
                  : null}
              </label>
              <label className="flex flex-col gap-1.5 sm:col-span-2"><span className={label}>Target Keyword</span><input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="e.g. ai in healthcare" className={field} /></label>
              <label className="flex flex-col gap-1.5 sm:col-span-2"><span className="flex items-center justify-between"><span className={label}>Short Description</span><span className="text-[0.72rem] text-slate-500">{excerpt.length}/160</span></span><textarea name="excerpt" value={excerpt} maxLength={160} onChange={(e) => setExcerpt(e.target.value)} rows={2} placeholder="A short description of what this page covers..." className={field} /></label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[0.95rem] font-700 text-slate-900">Content</h2>
              <div className="flex items-center gap-2.5">
                {/* The floor is enforced at save, so it is stated here rather than discovered there. */}
                <span className={`text-[0.76rem] font-600 ${words >= MIN_BODY_WORDS ? "text-[#15803D]" : "text-[#B45309]"}`}>
                  {/* A floor, not a target: "412 / 500" read as a quota to fill and stop at. */}
                  {words} words{words < MIN_BODY_WORDS ? ` (${MIN_BODY_WORDS} minimum)` : ""}
                </span>
                <button type="button" onClick={generateContent} disabled={generating || !title.trim()} title={!title.trim() ? "Add a page title first" : "Auto-generate the full page with Oge"} className="inline-flex items-center gap-1.5 rounded-lg border border-[#543CDA]/25 bg-[#F4F1FD] px-3 py-1.5 text-[0.78rem] font-600 text-[#543CDA] hover:bg-[#EEEBFC] disabled:cursor-not-allowed disabled:opacity-50">
                  {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}{generating ? "Generating…" : words > 0 ? "Regenerate with Oge" : "Generate with Oge"}
                </button>
              </div>
            </div>
            <RichTextEditor name="body" onChange={setBody} registerApi={(api) => { rte.current = api; }} allowImages uploadImages {...(initial?.body ? { initialHtml: initial.body } : {})} />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle sm:p-5">
            <h2 className="text-[0.95rem] font-700 text-slate-900">Featured Image &amp; Publishing</h2>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><ImageUpload name="featured_image" altName="featured_image_alt" label="Featured Image" folder="Programmatic SEO" aspect="aspect-[16/9]" initialUrl={initial?.featuredImage ?? ""} initialAlt={initial?.featuredImageAlt ?? ""} /></div>
              <label className="flex flex-col gap-1.5"><span className={label}>Template</span>
                <select name="template" value={template} onChange={(e) => setTemplate(e.target.value)} className={`cursor-pointer ${field}`}><option value="">No template</option>{templates.map((t) => <option key={t}>{t}</option>)}</select>
              </label>
              <label className="flex flex-col gap-1.5"><span className={label}>Status</span>
                <select name="status" defaultValue={initial?.status ?? "draft"} className={`cursor-pointer ${field}`}><option value="draft">Draft</option><option value="in_review">In Review</option><option value="scheduled">Scheduled</option><option value="published">Published</option><option value="archived">Archived</option></select>
              </label>
              <label className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50/60 p-3 sm:col-span-2">
                <input type="checkbox" name="noindex" defaultChecked={initial?.noindex ?? false} className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#543CDA]" />
                <span><span className="block text-[0.82rem] font-600 text-slate-700">Hide from search engines (noindex)</span><span className="block text-[0.74rem] text-slate-500">On means this page emits a noindex tag and is left out of the sitemap. Leave off to let it rank normally.</span></span>
              </label>
            </div>

            {/*
              * What publishing requires, checked as you write.
              *
              * A page that does not clear this is held at draft and forced to noindex by the API.
              * That protection is worth keeping and was silent, so the only signal was a status that
              * refused to change. Every unmet line here says what to do, not merely what is wrong.
              */}
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-[0.84rem] font-700 text-slate-800">Publishing requirements</h3>
                <span
                  className="text-[0.78rem] font-700"
                  style={{ color: readiness.score >= MIN_READINESS ? "#15803D" : "#B45309" }}
                >
                  {readiness.score}% ready
                </span>
              </div>
              <p className="mt-1 text-[0.74rem] text-slate-500">
                {readiness.score >= MIN_READINESS
                  ? "This page meets every requirement and can be published."
                  : "Until all of these are met, saving as Published keeps the page as a draft and hidden from search engines."}
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {readiness.conditions.map((c) => (
                  <li key={c.label} className="flex items-start gap-2 text-[0.78rem]">
                    <span aria-hidden="true" className={`mt-px shrink-0 font-700 ${c.passed ? "text-[#15803D]" : "text-[#B45309]"}`}>
                      {c.passed ? "✓" : "•"}
                    </span>
                    <span>
                      <span className={`font-600 ${c.passed ? "text-slate-600" : "text-slate-800"}`}>{c.label}</span>
                      {c.passed ? null : <span className="block text-[0.74rem] text-slate-500">{c.hint}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <a href="/cms/generated-pages" className="rounded-lg border border-slate-200 px-5 py-2.5 text-[0.85rem] font-600 text-slate-600 hover:bg-slate-50">Cancel</a>
              <button type="submit" className="rounded-lg bg-[#543CDA] px-6 py-2.5 text-[0.85rem] font-600 text-white hover:bg-[#4330B8]">{edit ? "Update" : "Publish"}</button>
            </div>
          </section>
        </div>

        <div className="min-w-0 lg:sticky lg:top-6 lg:self-start">
          <OgeAssistant
            tabs={["seo", "tldr", "excerpt", "author-bio", "faqs", "internal-links", "more"]}
            getContext={() => ({ title, body, focusKeyword: keyword, authorName: nameOf(authorId) ?? "Nexoris Technologies", expertise: service ? [service] : [], pages })}
            seo={{ score, findings, metaTitle, setMetaTitle, metaDesc, setMetaDesc }}
            bios={{
              ...(nameOf(authorId) ? { authorName: nameOf(authorId) } : {}),
              ...(nameOf(factCheckerId) ? { factCheckerName: nameOf(factCheckerId) } : {}),
              authorBio, factCheckerBio, setAuthorBio, setFactCheckerBio,
            }}
            apply={{
              seo: (r) => { setMetaTitle(r.metaTitle); setMetaDesc(r.metaDescription); },
              excerpt: (r) => setExcerpt(r.slice(0, 160)),
              insertTop: (html: string) => rte.current?.prependHtml(html),
              insertBottom: (html: string) => rte.current?.appendHtml(html),
              getBody: () => rte.current?.getHtml() ?? "",
              linkInline: (anchor: string, target: string) => rte.current?.linkInline(anchor, target) ?? false,
              storeFaqs: (items) => setFaqs(items),
              storeTldr: (items) => setTldr(items),
            }}
          />
        </div>
      </div>
    </form>
  );
}
