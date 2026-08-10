"use client";
/**
 * Create / edit job form (CMS Careers design). Left column: job information (title, department, type, work
 * mode, location, salary range, application deadline, featured), the role description in the rich text
 * editor, a cover image, and publish settings. Right column: the Oge AI Assistant (SEO gauge, excerpt,
 * FAQs). Balanced widths, responsive to 360px. Native POST to /api/cms/jobs.
 */
import { useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { RichTextEditor, type RichTextApi } from "../../../../components/cms/RichTextEditor.js";
import { OgeAssistant } from "../../../../components/cms/OgeAssistant.js";
import { metaChecks, metaScore } from "../../../../lib/meta-quality.js";
import { ImageUpload } from "../../../../components/cms/ImageUpload.js";

interface Dept { id: string; name: string }
interface Initial {
  id?: string; title?: string; slug?: string; department?: string; employmentType?: string; workMode?: string;
  location?: string; salaryMin?: string; salaryMax?: string; deadline?: string; featured?: boolean; body?: string;
  excerpt?: string; status?: string; featuredImage?: string; featuredImageAlt?: string; metaTitle?: string;
  metaDescription?: string; publishDate?: string;
}
const field = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[0.86rem] text-slate-900 placeholder:text-slate-400 focus:border-[#543CDA] focus:outline-none focus:ring-2 focus:ring-[#543CDA]/15 resize-none";
const label = "text-[0.8rem] font-600 text-slate-700";
const slugify = (s: string): string => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const wordsOf = (html: string): number => html.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
const TYPES = ["Full-time", "Part-time", "Contract", "Freelance", "Internship"];
const MODES = ["Remote", "Hybrid", "On-site"];

export function JobForm({ initial, departments }: { initial?: Initial; departments: Dept[] }): ReactNode {
  const edit = Boolean(initial?.id);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(initial?.slug));
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [metaTitle, setMetaTitle] = useState(initial?.metaTitle ?? "");
  const [metaDesc, setMetaDesc] = useState(initial?.metaDescription ?? "");
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const rte = useRef<RichTextApi | null>(null);
  const shownSlug = slugEdited ? slug : slugify(title);
  const words = useMemo(() => wordsOf(body), [body]);
  const checks = metaChecks({ title, metaTitle, metaDesc, body, words, minWords: 120, requireStructure: true });
  const score = metaScore(checks);

  return (
    <form action="/api/cms/jobs" method="post">
      {edit ? <input type="hidden" name="id" value={initial!.id} /> : null}
      <input type="hidden" name="meta_title" value={metaTitle} />
      <input type="hidden" name="meta_description" value={metaDesc} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.75fr_1fr]">
        <div className="flex min-w-0 flex-col gap-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle sm:p-5">
            <h2 className="text-[0.95rem] font-700 text-slate-900">Job Information</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 sm:col-span-2"><span className={label}>Job Title <span className="text-[#EF4444]">*</span></span><input name="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Frontend Developer" className={field} /></label>
              <label className="flex flex-col gap-1.5 sm:col-span-2"><span className={label}>Slug</span><input name="slug" value={shownSlug} onChange={(e) => { setSlugEdited(true); setSlug(e.target.value); }} placeholder="frontend-developer" className={`${field} font-mono`} /></label>
              <label className="flex flex-col gap-1.5"><span className={label}>Department</span>
                <select name="department" defaultValue={initial?.department ?? ""} className={`cursor-pointer ${field}`}><option value="">Select department</option>{departments.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}</select>
              </label>
              <label className="flex flex-col gap-1.5"><span className={label}>Employment Type</span>
                <select name="employment_type" defaultValue={initial?.employmentType ?? "Full-time"} className={`cursor-pointer ${field}`}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
              </label>
              <label className="flex flex-col gap-1.5"><span className={label}>Work Mode</span>
                <select name="work_mode" defaultValue={initial?.workMode ?? "Remote"} className={`cursor-pointer ${field}`}>{MODES.map((m) => <option key={m}>{m}</option>)}</select>
              </label>
              <label className="flex flex-col gap-1.5"><span className={label}>Location</span><input name="job_location" defaultValue={initial?.location ?? ""} placeholder="e.g. Lagos, Nigeria" className={field} /></label>
              <label className="flex flex-col gap-1.5"><span className={label}>Salary Min (NGN)</span><input name="salary_min" type="number" min={0} defaultValue={initial?.salaryMin ?? ""} placeholder="800000" className={field} /></label>
              <label className="flex flex-col gap-1.5"><span className={label}>Salary Max (NGN)</span><input name="salary_max" type="number" min={0} defaultValue={initial?.salaryMax ?? ""} placeholder="1500000" className={field} /></label>
              <label className="flex flex-col gap-1.5"><span className={label}>Application Deadline</span><input name="application_deadline" type="date" defaultValue={initial?.deadline ?? ""} className={field} /></label>
              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2.5">
                <span className="text-[0.82rem] font-600 text-slate-700">Featured job</span>
                <input type="checkbox" name="featured" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="peer sr-only" />
                <span onClick={() => setFeatured((v) => !v)} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${featured ? "bg-[#543CDA]" : "bg-slate-300"}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${featured ? "left-[1.4rem]" : "left-0.5"}`} /></span>
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="text-[0.95rem] font-700 text-slate-900">About the Role &amp; Responsibilities</h2><span className="text-[0.76rem] text-slate-500">{words} words</span></div>
            <RichTextEditor name="body" onChange={setBody} registerApi={(api) => { rte.current = api; }} {...(initial?.body ? { initialHtml: initial.body } : {})} />
            <label className="mt-4 flex flex-col gap-1.5">
              <span className="flex items-center justify-between"><span className={label}>Short Summary</span><span className="text-[0.72rem] text-slate-500">{excerpt.length}/200</span></span>
              <textarea name="excerpt" value={excerpt} maxLength={200} onChange={(e) => setExcerpt(e.target.value)} rows={2} placeholder="A short summary used on the careers hub card..." className={field} />
            </label>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle sm:p-5">
            <h2 className="text-[0.95rem] font-700 text-slate-900">Cover Image &amp; Publishing</h2>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><ImageUpload name="featured_image" altName="featured_image_alt" label="Cover Image" folder="Careers" aspect="aspect-[16/9]" initialUrl={initial?.featuredImage ?? ""} initialAlt={initial?.featuredImageAlt ?? ""} /></div>
              <label className="flex flex-col gap-1.5"><span className={label}>Status</span>
                <select name="status" defaultValue={initial?.status ?? "draft"} className={`cursor-pointer ${field}`}><option value="draft">Draft</option><option value="in_review">In Review</option><option value="scheduled">Scheduled</option><option value="published">Open</option><option value="archived">Closed</option></select>
              </label>
              <label className="flex flex-col gap-1.5"><span className={label}>Publish Date</span><input type="datetime-local" name="publish_date" defaultValue={initial?.publishDate ?? ""} className={field} /></label>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <a href="/cms/jobs" className="rounded-lg border border-slate-200 px-5 py-2.5 text-[0.85rem] font-600 text-slate-600 hover:bg-slate-50">Cancel</a>
              <button type="submit" className="rounded-lg bg-[#543CDA] px-6 py-2.5 text-[0.85rem] font-600 text-white hover:bg-[#4330B8]">{edit ? "Save Job" : "Create Job"}</button>
            </div>
          </section>
        </div>

        <div className="min-w-0 lg:sticky lg:top-6 lg:self-start">
          <OgeAssistant
            tabs={["seo", "excerpt", "faqs", "more"]}
            getContext={() => ({ title, body })}
            seo={{ score, metaTitle, setMetaTitle, metaDesc, setMetaDesc }}
            apply={{
              seo: (r) => { setMetaTitle(r.metaTitle); setMetaDesc(r.metaDescription); },
              excerpt: (r) => setExcerpt(r),
              insertTop: (html: string) => rte.current?.prependHtml(html),
              insertBottom: (html: string) => rte.current?.appendHtml(html),
            }}
          />
        </div>
      </div>
    </form>
  );
}
