"use client";
/**
 * Create / edit legal page form (CMS design). Left: title, slug, version, effective date, and the policy
 * content in the rich text editor. Right: page settings (footer visibility, acceptance requirement) and
 * SEO. Native POST to /api/cms/proof with kind=legal_page. Legal copy is stored as semantic HTML.
 */
import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { RichTextEditor, type RichTextApi } from "../../../../components/cms/RichTextEditor.js";
import { OgeAssistant } from "../../../../components/cms/OgeAssistant.js";

interface Initial { id?: string; title?: string; slug?: string; version?: string; effectiveDate?: string; body?: string; status?: string; visibleInFooter?: boolean; requireAcceptance?: boolean; metaTitle?: string; metaDescription?: string }
const field = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[0.86rem] text-slate-900 placeholder:text-slate-400 focus:border-[#543CDA] focus:outline-none focus:ring-2 focus:ring-[#543CDA]/15 resize-none";
const label = "text-[0.8rem] font-600 text-slate-700";
const slugify = (s: string): string => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export function LegalPageForm({ initial }: { initial?: Initial }): ReactNode {
  const edit = Boolean(initial?.id);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(initial?.slug));
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [footer, setFooter] = useState(initial?.visibleInFooter ?? true);
  const [accept, setAccept] = useState(initial?.requireAcceptance ?? false);
  const [body, setBody] = useState(initial?.body ?? "");
  const [metaTitle, setMetaTitle] = useState(initial?.metaTitle ?? "");
  const [metaDesc, setMetaDesc] = useState(initial?.metaDescription ?? "");
  const rte = useRef<RichTextApi | null>(null);
  const shownSlug = slugEdited ? slug : slugify(title);

  // The panel shows a score, so there has to be something real behind it. Same shape of check the
  // insight editor uses, asked of this page: is it titled, described, and long enough to be a page.
  const bodyWords = body.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  const legalChecks = [
    title.trim().length >= 8,
    metaTitle.length >= 20 && metaTitle.length <= 65,
    metaDesc.length >= 120 && metaDesc.length <= 165,
    bodyWords >= 300,
    /<h[23]/i.test(body),
  ];
  const seoScore = Math.round((legalChecks.filter(Boolean).length / legalChecks.length) * 100);

  return (
    <form action="/api/cms/proof" method="post">
      <input type="hidden" name="kind" value="legal_page" />
      {/* The meta fields live in the Oge panel's SEO tab and submit from here. */}
      <input type="hidden" name="meta_title" value={metaTitle} />
      <input type="hidden" name="meta_description" value={metaDesc} />
      {edit ? <input type="hidden" name="id" value={initial!.id} /> : null}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 sm:col-span-2"><span className={label}>Title <span className="text-[#EF4444]">*</span></span><input name="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Privacy Policy" className={field} /></label>
              <label className="flex flex-col gap-1.5 sm:col-span-2"><span className={label}>Slug</span><input name="slug" value={shownSlug} onChange={(e) => { setSlugEdited(true); setSlug(e.target.value); }} placeholder="privacy-policy" className={`${field} font-mono`} /></label>
              <label className="flex flex-col gap-1.5"><span className={label}>Version</span><input name="version" defaultValue={initial?.version ?? "1.0"} placeholder="1.0" className={`${field} font-mono`} /></label>
              <label className="flex flex-col gap-1.5"><span className={label}>Effective Date</span><input name="effective_date" type="date" defaultValue={initial?.effectiveDate ?? ""} className={field} /></label>
            </div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
            <h2 className="mb-3 text-[0.95rem] font-700 text-slate-900">Content</h2>
            <RichTextEditor name="body" onChange={setBody} registerApi={(api) => { rte.current = api; }} {...(initial?.body ? { initialHtml: initial.body } : {})} />
          </section>
        </div>

        <div className="flex flex-col gap-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
            <h2 className="text-[0.95rem] font-700 text-slate-900">Page Settings</h2>
            <div className="mt-3 flex flex-col gap-4">
              <label className="flex flex-col gap-1.5"><span className={label}>Status</span>
                <select name="status" defaultValue={initial?.status ?? "draft"} className={`cursor-pointer ${field}`}><option value="draft">Draft</option><option value="in_review">In Review</option><option value="published">Published</option><option value="archived">Archived</option></select>
              </label>
              <Toggle name="visible_in_footer" checked={footer} set={setFooter} title="Visible in footer" sub="Link this page from the site footer." />
              <Toggle name="require_acceptance" checked={accept} set={setAccept} title="Require acceptance checkbox" sub="Ask users to accept before continuing." />
            </div>
          </section>
          <OgeAssistant
            tabs={["seo", "faqs", "more"]}
            getContext={() => ({ title, body, expertise: [] })}
            seo={{ score: seoScore, metaTitle, setMetaTitle, metaDesc, setMetaDesc}}
            apply={{
              seo: (r) => { setMetaTitle(r.metaTitle); setMetaDesc(r.metaDescription); },
              insertBottom: (html: string) => rte.current?.appendHtml(html),
            }}
          />

          <div className="flex items-center justify-end gap-2">
            <a href="/cms/legal-pages" className="rounded-lg border border-slate-200 px-5 py-2.5 text-[0.85rem] font-600 text-slate-600 hover:bg-slate-50">Cancel</a>
            <button type="submit" className="rounded-lg bg-[#543CDA] px-6 py-2.5 text-[0.85rem] font-600 text-white hover:bg-[#4330B8]">{edit ? "Update Page" : "Save Draft"}</button>
          </div>
        </div>
      </div>
    </form>
  );
}

function Toggle({ name, checked, set, title, sub }: { name: string; checked: boolean; set: (v: boolean) => void; title: string; sub: string }): ReactNode {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span><span className="block text-[0.85rem] font-600 text-slate-800">{title}</span><span className="block text-[0.76rem] text-slate-500">{sub}</span></span>
      <input type="checkbox" name={name} checked={checked} onChange={(e) => set(e.target.checked)} className="peer sr-only" />
      <span onClick={() => set(!checked)} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-[#543CDA]" : "bg-slate-300"}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${checked ? "left-[1.4rem]" : "left-0.5"}`} /></span>
    </label>
  );
}
