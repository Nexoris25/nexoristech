"use client";
/**
 * Create / edit case study form (CMS design's multi-step wizard, presented as one precise form with
 * sections).
 *
 * No Oge panel here, deliberately. A case study is a record of work actually done for a named client;
 * the facts are the salesperson's and the client's, not something to draft from a prompt.
 *
 * Basic info, the project overview in the rich text editor, highlights + technologies as
 * comma lists that render live as chips, a cover image, and publish settings. Native POST to
 * /api/cms/proof with kind=case_study.
 */
import { useRef, useState } from "react";
import type { ReactNode } from "react";
const field = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[0.86rem] text-slate-900 placeholder:text-slate-400 focus:border-[#543CDA] focus:outline-none focus:ring-2 focus:ring-[#543CDA]/15 resize-none";
const label = "text-[0.8rem] font-600 text-slate-700";
const slugify = (s: string): string => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
import { RichTextEditor, type RichTextApi } from "../../../../components/cms/RichTextEditor.js";
import { ImageUpload } from "../../../../components/cms/ImageUpload.js";
import { ImageGallery, type GalleryImage } from "../../../../components/cms/ImageGallery.js";
import { SERVICE_PAGES, SERVICE_LABELS } from "../../../../lib/site-pages.js";
import { OgeAssistant } from "../../../../components/cms/OgeAssistant.js";

interface Initial { id?: string; title?: string; slug?: string; serviceIndustry?: string; gallery?: GalleryImage[]; servicePaths?: string[]; excerpt?: string; body?: string; highlights?: string; technologies?: string; featuredImage?: string; featuredImageAlt?: string; status?: string; featured?: boolean; displayOrder?: number; metaTitle?: string; metaDescription?: string }

export function CaseStudyForm({ initial }: { initial?: Initial }): ReactNode {
  const edit = Boolean(initial?.id);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(initial?.slug));
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [highlights, setHighlights] = useState(initial?.highlights ?? "");
  const [technologies, setTechnologies] = useState(initial?.technologies ?? "");
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [metaTitle, setMetaTitle] = useState(initial?.metaTitle ?? "");
  const [metaDesc, setMetaDesc] = useState(initial?.metaDescription ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const rte = useRef<RichTextApi | null>(null);

  // The panel shows a score, so there has to be something real behind it.
  const bodyWords = body.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  const checks = [
    title.trim().length >= 8,
    excerpt.trim().length > 0,
    metaTitle.length >= 20 && metaTitle.length <= 65,
    metaDesc.length >= 120 && metaDesc.length <= 165,
    bodyWords >= 300,
  ];
  const seoScore = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  const shownSlug = slugEdited ? slug : slugify(title);
  const chips = (s: string): string[] => s.split(",").map((x) => x.trim()).filter(Boolean);

  return (
    <form action="/api/cms/proof" method="post">
      <input type="hidden" name="kind" value="case_study" />
      {/* The meta fields live in the Oge panel's SEO tab and submit from here. */}
      <input type="hidden" name="meta_title" value={metaTitle} />
      <input type="hidden" name="meta_description" value={metaDesc} />
      {edit ? <input type="hidden" name="id" value={initial!.id} /> : null}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
            <h2 className="text-[0.95rem] font-700 text-slate-900">Basic Information</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 sm:col-span-2"><span className={label}>Title <span className="text-[#EF4444]">*</span></span><input name="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. NexPay Payment Gateway" className={field} /></label>
              <label className="flex flex-col gap-1.5 sm:col-span-2"><span className={label}>Slug</span><input name="slug" value={shownSlug} onChange={(e) => { setSlugEdited(true); setSlug(e.target.value); }} placeholder="nexpay-payment-gateway" className={`${field} font-mono`} /></label>
              <label className="flex flex-col gap-1.5"><span className={label}>Industry</span><input name="service_industry" defaultValue={initial?.serviceIndustry ?? ""} placeholder="e.g. Fintech" className={field} /></label>
              <label className="flex flex-col gap-1.5"><span className={label}>Display Order</span><input name="display_order" type="number" min={0} defaultValue={initial?.displayOrder ?? 0} className={field} /></label>
              <label className="flex flex-col gap-1.5 sm:col-span-2"><span className={label}>Short Summary</span><textarea name="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} maxLength={200} placeholder="A short, scannable summary of the project..." className={field} /></label>

              <div className="sm:col-span-2">
                <span className={label}>Proof for these services</span>
                <p className="mt-0.5 text-[0.74rem] leading-relaxed text-slate-600">
                  This case study appears in the proof section of every service you tick. Those sections
                  showed placeholder cards until a case study named the service it proves.
                </p>
                <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {SERVICE_PAGES.map((path) => (
                    <label key={path} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2">
                      <input type="checkbox" name="service_paths" value={path}
                        defaultChecked={(initial?.servicePaths ?? []).includes(path)}
                        className="h-4 w-4 shrink-0 cursor-pointer accent-[#543CDA]" />
                      <span className="min-w-0 truncate text-[0.8rem] text-slate-700">{SERVICE_LABELS[path] ?? path}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
            <h2 className="mb-3 text-[0.95rem] font-700 text-slate-900">Project Overview</h2>
            <RichTextEditor name="body" onChange={setBody} registerApi={(api) => { rte.current = api; }} {...(initial?.body ? { initialHtml: initial.body } : {})} />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
            <h2 className="text-[0.95rem] font-700 text-slate-900">Highlights & Technologies</h2>
            <div className="mt-4 flex flex-col gap-4">
              <label className="flex flex-col gap-1.5"><span className={label}>Highlights</span>
                <input name="highlights" value={highlights} onChange={(e) => setHighlights(e.target.value)} placeholder="Comma separated, e.g. Secure, Scalable, Compliant" className={field} />
                {chips(highlights).length ? <div className="flex flex-wrap gap-1.5">{chips(highlights).map((c) => <span key={c} className="rounded-md bg-[#DCFCE7] px-2 py-0.5 text-[0.72rem] font-500 text-[#15803D]">{c}</span>)}</div> : null}
              </label>
              <label className="flex flex-col gap-1.5"><span className={label}>Technologies Used</span>
                <input name="technologies" value={technologies} onChange={(e) => setTechnologies(e.target.value)} placeholder="Comma separated, e.g. Next.js, Node.js, PostgreSQL" className={field} />
                {chips(technologies).length ? <div className="flex flex-wrap gap-1.5">{chips(technologies).map((c) => <span key={c} className="rounded-md bg-[#EEEBFC] px-2 py-0.5 text-[0.72rem] font-500 text-[#543CDA]">{c}</span>)}</div> : null}
              </label>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
            <h2 className="text-[0.95rem] font-700 text-slate-900">Publish</h2>
            <div className="mt-3 flex flex-col gap-4">
              <label className="flex flex-col gap-1.5"><span className={label}>Status</span>
                <select name="status" defaultValue={initial?.status ?? "draft"} className={`cursor-pointer ${field}`}><option value="draft">Draft</option><option value="in_review">In Review</option><option value="published">Published</option><option value="archived">Archived</option></select>
              </label>
              <ImageUpload name="featured_image" altName="featured_image_alt" label="Cover Image" folder="Case Studies" aspect="aspect-[16/9]" initialUrl={initial?.featuredImage ?? ""} initialAlt={initial?.featuredImageAlt ?? ""} />
              <div className="mt-4 border-t border-slate-100 pt-4">
                <ImageGallery name="gallery" label="Project images" folder="Case Studies" initial={initial?.gallery ?? []} />
              </div>
            </div>
            <label className="mt-4 flex cursor-pointer items-center justify-between gap-3">
              <span><span className="block text-[0.85rem] font-600 text-slate-800">Featured</span><span className="block text-[0.76rem] text-slate-500">Show this case study first.</span></span>
              <input type="checkbox" name="featured" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="peer sr-only" />
              <span onClick={() => setFeatured((v) => !v)} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${featured ? "bg-[#543CDA]" : "bg-slate-300"}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${featured ? "left-[1.4rem]" : "left-0.5"}`} /></span>
            </label>
          </section>

          {/* SEO only. The narrative is still not drafted from a prompt — a case study reports work done
              for a named client — but the meta fields belong in this panel like every other page's. */}
          <OgeAssistant
            tabs={["seo"]}
            getContext={() => ({ title, body, expertise: [] })}
            seo={{ score: seoScore, metaTitle, setMetaTitle, metaDesc, setMetaDesc, keyword: title, setKeyword: () => undefined }}
            apply={{ seo: (r) => { setMetaTitle(r.metaTitle); setMetaDesc(r.metaDescription); } }}
          />


          <div className="flex items-center justify-end gap-2">
            <a href="/cms/case-studies" className="rounded-lg border border-slate-200 px-5 py-2.5 text-[0.85rem] font-600 text-slate-600 hover:bg-slate-50">Cancel</a>
            <button type="submit" className="rounded-lg bg-[#543CDA] px-6 py-2.5 text-[0.85rem] font-600 text-white hover:bg-[#4330B8]">{edit ? "Update Case Study" : "Save & Continue"}</button>
          </div>
        </div>
      </div>
    </form>
  );
}
