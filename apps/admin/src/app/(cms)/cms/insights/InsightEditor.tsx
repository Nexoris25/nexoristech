"use client";
/**
 * Insight editor (CMS design). Left column: title + slug, category / author / fact-checker, the rich text
 * body with a live word count, then the featured image and publish settings. Right column: the Oge AI
 * Assistant only, with tabs on top and a balanced width so the editor keeps most of the room. The SEO
 * score gauge, meta fields, TL;DR (inserted at the top), FAQs (5-7, stored for
 * FAQPage schema), and per-article author and fact-checker bios all live in the assistant. Submits as a
 * native POST to /api/cms/insights. Everything the search and answer engines read is edited here.
 */
import { useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { RichTextEditor, type RichTextApi } from "../../../../components/cms/RichTextEditor.js";
import { OgeAssistant } from "../../../../components/cms/OgeAssistant.js";
import { metaChecks, metaScore } from "../../../../lib/meta-quality.js";
import { ImageUpload } from "../../../../components/cms/ImageUpload.js";

interface Option { id: string; name: string }

/**
 * An author as the bio generator needs them.
 *
 * A per-article bio is an E-E-A-T signal, so it has to be true about the person as well as about
 * the article. Passing only a name gave the model nothing factual to work from, which is exactly
 * the condition under which one invents a job title or a number of years.
 */
export interface AuthorOption extends Option {
  job_title?: string | null;
  years_experience?: string | null;
  expertise?: string[] | null;
  bio?: string | null;
}
interface FaqItem { question: string; answer: string }
interface Initial {
  id?: string; title?: string; shortTitle?: string; slug?: string; body?: string; excerpt?: string; categoryId?: string;
  authorId?: string; factCheckerId?: string; status?: string; featuredImage?: string; featuredImageAlt?: string;
  metaTitle?: string; metaDescription?: string; authorBio?: string; factCheckerBio?: string;
  publishDate?: string; noindex?: boolean; schemaType?: string;
}
interface PageRef { title: string; url: string }
const field = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[0.86rem] text-slate-900 placeholder:text-slate-400 focus:border-[#543CDA] focus:outline-none focus:ring-2 focus:ring-[#543CDA]/15 resize-none";
const label = "text-[0.8rem] font-600 text-slate-700";
const slugify = (s: string): string => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
// A concise label from the full title: drop any trailing clause after a colon/dash, then trim to ~48
// characters on a word boundary. Used in breadcrumbs and the Insights list.
const shortify = (s: string): string => {
  const base = (s.split(/[:—–|]/)[0] ?? s).trim() || s.trim();
  if (base.length <= 48) return base;
  const cut = base.slice(0, 48);
  return (cut.includes(" ") ? cut.slice(0, cut.lastIndexOf(" ")) : cut).trim();
};
const wordsOf = (html: string): number => html.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
/** The schema.org Article variants an editor can pick, with a plain description of when each fits. */
const SCHEMA_TYPES: { value: string; label: string; hint: string }[] = [
  { value: "BlogPosting", label: "Blog Posting", hint: "An editorial post or opinion piece" },
  { value: "Article", label: "Article", hint: "A general article, the safe default" },
  { value: "NewsArticle", label: "News Article", hint: "Reporting on something that happened" },
  { value: "TechArticle", label: "Technical Article", hint: "A how-to or technical guide" },
  { value: "ScholarlyArticle", label: "Scholarly Article", hint: "Research or a study" },
  { value: "Report", label: "Report", hint: "A formal report or whitepaper" },
  // Not an Article subtype: a HowTo carries a required list of steps, built from this article's own
  // H2 headings. Choose it only for a guide that really is a sequence of steps.
  { value: "HowTo", label: "How-To Guide", hint: "A sequence of steps, taken from your H2 headings" },
];

export function InsightEditor({ initial, categories, authors, pages = [] }: { initial?: Initial; categories: Option[]; authors: AuthorOption[]; pages?: PageRef[] }): ReactNode {
  const edit = Boolean(initial?.id);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(initial?.slug));
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [shortEdited, setShortEdited] = useState(Boolean(initial?.shortTitle));
  const [shortTitle, setShortTitle] = useState(initial?.shortTitle ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [metaTitle, setMetaTitle] = useState(initial?.metaTitle ?? "");
  const [metaDesc, setMetaDesc] = useState(initial?.metaDescription ?? "");
  const [authorId, setAuthorId] = useState(initial?.authorId ?? "");
  const [factCheckerId, setFactCheckerId] = useState(initial?.factCheckerId ?? "");
  const [authorBio, setAuthorBio] = useState(initial?.authorBio ?? "");
  const [factCheckerBio, setFactCheckerBio] = useState(initial?.factCheckerBio ?? "");
  const [schemaType, setSchemaType] = useState(initial?.schemaType ?? "BlogPosting");
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [tldr, setTldr] = useState<string[]>([]);
  const rte = useRef<RichTextApi | null>(null);

  const shownSlug = slugEdited ? slug : slugify(title);
  const shownShort = shortEdited ? shortTitle : shortify(title);
  const words = useMemo(() => wordsOf(body), [body]);
  const readTime = Math.max(1, Math.round(words / 200));
  const nameOf = (id: string): string | undefined => authors.find((a) => a.id === id)?.name;

  /**
   * The assigned person's real record, for the bio and the SEO context. Only fields that are
   * actually set are sent, so a missing job title is absent rather than an empty string the model
   * might read as a fact.
   */
  const authorContext = (id: string, role?: string): Record<string, unknown> => {
    const a = authors.find((x) => x.id === id);
    if (!a) return {};
    return {
      authorName: a.name,
      ...(role ?? a.job_title ? { authorRole: role ?? a.job_title } : {}),
      ...(a.years_experience ? { yearsExperience: a.years_experience } : {}),
      ...(a.expertise && a.expertise.length ? { expertise: a.expertise } : {}),
      ...(a.bio ? { authorProfileBio: a.bio } : {}),
    };
  };

  const checks = metaChecks({
    title, metaTitle, metaDesc, body, words,
    minWords: 300, requireStructure: true, requireLinks: true,
  });
  const score = metaScore(checks);

  return (
    <form action="/api/cms/insights" method="post">
      {edit ? <input type="hidden" name="id" value={initial!.id} /> : null}
      <input type="hidden" name="read_time_min" value={readTime} />
      {/* Oge-edited fields submit via these hidden inputs regardless of the active assistant tab. */}
      <input type="hidden" name="meta_title" value={metaTitle} />
      <input type="hidden" name="meta_description" value={metaDesc} />
      <input type="hidden" name="author_bio" value={authorBio} />
      <input type="hidden" name="fact_checker_bio" value={factCheckerBio} />
      <input type="hidden" name="faqs" value={JSON.stringify(faqs)} />
      <input type="hidden" name="tldr" value={JSON.stringify(tldr)} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.75fr_1fr]">
        {/* Left: the article */}
        <div className="flex min-w-0 flex-col gap-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle sm:p-5">
            <input name="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Insight title..."
              className="w-full border-none bg-transparent text-[1.15rem] font-700 text-slate-900 placeholder:text-slate-300 focus:outline-none sm:text-[1.35rem]" />
            <div className="mt-2 flex items-center gap-1 text-[0.78rem] text-slate-500">
              <span className="shrink-0">/insights/</span>
              <input name="slug" value={shownSlug} onChange={(e) => { setSlugEdited(true); setSlug(e.target.value); }} placeholder="insight-slug"
                className="min-w-0 flex-1 border-none bg-transparent font-mono text-[0.78rem] text-slate-500 focus:outline-none" />
            </div>
            <div className="mt-3 border-t border-slate-100 pt-3">
              <label className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2.5">
                <span className="shrink-0 text-[0.78rem] font-600 text-slate-600">Short title</span>
                <input name="short_title" value={shownShort} maxLength={60} onChange={(e) => { setShortEdited(true); setShortTitle(e.target.value); }} placeholder="Auto-generated from the title"
                  className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[0.82rem] text-slate-700 focus:border-[#543CDA] focus:bg-white focus:outline-none" />
              </label>
              <p className="mt-1 text-[0.7rem] text-slate-500">Used in breadcrumbs and the Insights list. Auto-filled from the title; edit to override.</p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle sm:p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <label className="flex flex-col gap-1.5"><span className={label}>Category</span>
                <select name="category_id" defaultValue={initial?.categoryId ?? ""} className={`cursor-pointer ${field}`}><option value="">Uncategorized</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              </label>
              <label className="flex flex-col gap-1.5"><span className={label}>Author</span>
                <select name="author_id" value={authorId} onChange={(e) => setAuthorId(e.target.value)} className={`cursor-pointer ${field}`}><option value="">Unassigned</option>{authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
              </label>
              <label className="flex flex-col gap-1.5"><span className={label}>Fact-Checker</span>
                <select name="fact_checker_id" value={factCheckerId} onChange={(e) => setFactCheckerId(e.target.value)} className={`cursor-pointer ${field}`}><option value="">Unassigned</option>{authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="text-[0.95rem] font-700 text-slate-900">Content</h2><span className="text-[0.76rem] text-slate-500">{words} words · {readTime} min read</span></div>
            <RichTextEditor name="body" onChange={setBody} registerApi={(api) => { rte.current = api; }} {...(initial?.body ? { initialHtml: initial.body } : {})} />
            <label className="mt-4 flex flex-col gap-1.5">
              <span className="flex items-center justify-between"><span className={label}>Excerpt</span><span className="text-[0.72rem] text-slate-500">{excerpt.length}/200</span></span>
              <textarea name="excerpt" value={excerpt} maxLength={200} onChange={(e) => setExcerpt(e.target.value)} rows={2} placeholder="A short summary used in cards and search results..." className={field} />
            </label>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle sm:p-5">
            <h2 className="text-[0.95rem] font-700 text-slate-900">Featured Image &amp; Publishing</h2>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <ImageUpload name="featured_image" altName="featured_image_alt" label="Featured Image" folder="Insights" aspect="aspect-[16/9]" initialUrl={initial?.featuredImage ?? ""} initialAlt={initial?.featuredImageAlt ?? ""} />
              </div>
              <label className="flex flex-col gap-1.5"><span className={label}>Publish Status</span>
                <select name="status" defaultValue={initial?.status ?? "draft"} className={`cursor-pointer ${field}`}>
                  <option value="draft">Draft</option><option value="in_review">In Review</option><option value="scheduled">Scheduled</option><option value="published">Published</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5"><span className={label}>Publish Date</span>
                <input type="datetime-local" name="publish_date" defaultValue={initial?.publishDate ?? ""} className={field} />
              </label>
              <label className="flex flex-col gap-1.5 sm:col-span-2"><span className={label}>Schema markup</span>
                <select name="schema_type" value={schemaType} onChange={(e) => setSchemaType(e.target.value)} className={`cursor-pointer ${field}`}>
                  {SCHEMA_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <span className="text-[0.72rem] text-slate-500">{SCHEMA_TYPES.find((t) => t.value === schemaType)?.hint ?? ""} — emitted as the article&apos;s JSON-LD type.</span>
              </label>
              <label className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50/60 p-3 sm:col-span-2">
                <input type="checkbox" name="noindex" defaultChecked={initial?.noindex ?? false} className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#543CDA]" />
                <span><span className="block text-[0.82rem] font-600 text-slate-700">Hide from search engines (noindex)</span><span className="block text-[0.74rem] text-slate-500">On means this page emits a noindex tag and is left out of the sitemap. Leave off to let it rank normally.</span></span>
              </label>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <a href="/cms/insights" className="rounded-lg border border-slate-200 px-5 py-2.5 text-[0.85rem] font-600 text-slate-600 hover:bg-slate-50">Cancel</a>
              <button type="submit" className="rounded-lg bg-[#543CDA] px-6 py-2.5 text-[0.85rem] font-600 text-white hover:bg-[#4330B8]">{edit ? "Update" : "Publish"}</button>
            </div>
          </section>
        </div>

        {/* Right: Oge AI Assistant only */}
        <div className="min-w-0 lg:sticky lg:top-6 lg:self-start">
          <OgeAssistant
            tabs={["seo", "tldr", "excerpt", "author-bio", "faqs", "internal-links", "more"]}
            getContext={() => ({ title, body, ...authorContext(authorId), pages })}
            seo={{ score, metaTitle, setMetaTitle, metaDesc, setMetaDesc }}
            bios={{
              ...(nameOf(authorId) ? { authorName: nameOf(authorId) } : {}),
              ...(nameOf(factCheckerId) ? { factCheckerName: nameOf(factCheckerId) } : {}),
              authorContext: authorContext(authorId),
              factCheckerContext: authorContext(factCheckerId, "Fact-Checker"),
              authorBio, factCheckerBio, setAuthorBio, setFactCheckerBio,
            }}
            apply={{
              seo: (r) => { setMetaTitle(r.metaTitle); setMetaDesc(r.metaDescription); },
              excerpt: (r) => setExcerpt(r),
              insertTop: (html) => rte.current?.prependHtml(html),
              insertBottom: (html) => rte.current?.appendHtml(html),
              getBody: () => rte.current?.getHtml() ?? "",
              linkInline: (anchor, target) => rte.current?.linkInline(anchor, target) ?? false,
              storeFaqs: (items) => setFaqs(items),
              storeTldr: (items) => setTldr(items),
            }}
          />
        </div>
      </div>
    </form>
  );
}
