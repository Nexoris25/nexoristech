"use client";
/**
 * Create / edit testimonial form (CMS design). Left: customer details including their headshot, the
 * quote, rating, and publish settings. Right: a live preview of the card as the website draws it.
 * Native POST to /api/cms/proof with kind=testimonial. The customer name is stored in the content
 * title and the headshot in featured_image.
 *
 * The headshot is the client own photo or nothing at all. A quote with a face behind it carries more
 * than one with two initials, and stock photography standing in for a real customer is a lie about who
 * said it. With no photo the card falls back to a monogram, here and on the site.
 *
 * The preview is the site card rather than an approximation of it: the same dark panel, the same quote
 * mark, the same avatar treatment and the same name block. A preview that does not match what ships is
 * worse than no preview, because it is trusted.
 */
import { useState } from "react";
import type { ReactNode } from "react";
import { Star } from "lucide-react";
import { ImageUpload } from "../../../../components/cms/ImageUpload.js";

interface Initial { id?: string; title?: string; customerTitle?: string; company?: string; rating?: number; body?: string; featured?: boolean; status?: string; displayOrder?: number; featuredImage?: string; featuredImageAlt?: string }
const field = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[0.86rem] text-slate-900 placeholder:text-slate-400 focus:border-[#543CDA] focus:outline-none focus:ring-2 focus:ring-[#543CDA]/15 resize-none";
const label = "text-[0.8rem] font-600 text-slate-700";
const stripTags = (s: string): string => s.replace(/<[^>]+>/g, "").trim();

export function TestimonialForm({ initial }: { initial?: Initial }): ReactNode {
  const edit = Boolean(initial?.id);
  const [name, setName] = useState(initial?.title ?? "");
  const [role, setRole] = useState(initial?.customerTitle ?? "");
  const [company, setCompany] = useState(initial?.company ?? "");
  const [rating, setRating] = useState(initial?.rating ?? 5);
  const [quote, setQuote] = useState(stripTags(initial?.body ?? ""));
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [photo, setPhoto] = useState(initial?.featuredImage ?? "");
  const initials = name.trim().split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "NA";

  return (
    <form action="/api/cms/proof" method="post">
      <input type="hidden" name="kind" value="testimonial" />
      {edit ? <input type="hidden" name="id" value={initial!.id} /> : null}
      <input type="hidden" name="rating" value={rating} />
      <input type="hidden" name="body" value={`<p>${quote.replace(/</g, "&lt;")}</p>`} />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
            <h2 className="text-[0.95rem] font-700 text-slate-900">Customer Information</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5"><span className={label}>Customer Name <span className="text-[#EF4444]">*</span></span><input name="title" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Bola Adeyemi" className={field} /></label>
              <label className="flex flex-col gap-1.5"><span className={label}>Job Title</span><input name="customer_title" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. CEO" className={field} /></label>
              <label className="flex flex-col gap-1.5 sm:col-span-2"><span className={label}>Company</span><input name="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. PayDay Africa" className={field} /></label>
            </div>
            <div className="mt-4 border-t border-slate-100 pt-4">
              <ImageUpload name="featured_image" altName="featured_image_alt" label="Client Headshot" folder="Testimonials"
                aspect="aspect-square" initialUrl={initial?.featuredImage ?? ""} initialAlt={initial?.featuredImageAlt ?? ""}
                onChange={(u) => setPhoto(u)} />
              <p className="mt-2 text-[0.76rem] leading-relaxed text-slate-600">
                The client&rsquo;s own photo, used with their permission. Leave it empty and the card
                shows their initials instead. Do not put a stock photo here.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
            <h2 className="text-[0.95rem] font-700 text-slate-900">Testimonial</h2>
            <div className="mt-4 flex flex-col gap-4">
              <label className="flex flex-col gap-1.5"><span className={label}>Rating</span>
                <span className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button key={i} type="button" aria-label={`${i} stars`} onClick={() => setRating(i)}><Star size={24} className={i <= rating ? "text-[#F59E0B]" : "text-slate-200"} fill={i <= rating ? "#F59E0B" : "#E2E8F0"} /></button>
                  ))}
                  <span className="ml-2 text-[0.8rem] font-600 text-slate-500">{rating}.0</span>
                </span>
              </label>
              <label className="flex flex-col gap-1.5"><span className={label}>Quote <span className="text-[#EF4444]">*</span></span>
                <textarea value={quote} onChange={(e) => setQuote(e.target.value)} rows={5} required placeholder="What did the customer say about working with Nexoris?" className={field} />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
            <h2 className="text-[0.95rem] font-700 text-slate-900">Publish</h2>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5"><span className={label}>Status</span>
                <select name="status" defaultValue={initial?.status ?? "draft"} className={`cursor-pointer ${field}`}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select>
              </label>
              <label className="flex flex-col gap-1.5"><span className={label}>Display Order</span><input name="display_order" type="number" min={0} defaultValue={initial?.displayOrder ?? 0} className={field} /></label>
            </div>
            <label className="mt-4 flex cursor-pointer items-center justify-between gap-3">
              <span><span className="block text-[0.85rem] font-600 text-slate-800">Featured testimonial</span><span className="block text-[0.76rem] text-slate-500">Highlight this quote on the homepage.</span></span>
              <input type="checkbox" name="featured" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="peer sr-only" />
              <span onClick={() => setFeatured((v) => !v)} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${featured ? "bg-[#543CDA]" : "bg-slate-300"}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${featured ? "left-[1.4rem]" : "left-0.5"}`} /></span>
            </label>
            <div className="mt-4 flex items-center justify-end gap-2">
              <a href="/cms/testimonials" className="rounded-lg border border-slate-200 px-5 py-2.5 text-[0.85rem] font-600 text-slate-600 hover:bg-slate-50">Cancel</a>
              <button type="submit" className="rounded-lg bg-[#543CDA] px-6 py-2.5 text-[0.85rem] font-600 text-white hover:bg-[#4330B8]">{edit ? "Update Testimonial" : "Save Testimonial"}</button>
            </div>
          </section>
        </div>

        <div>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle lg:sticky lg:top-4">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-[0.8rem] font-600 text-slate-500">Testimonial Preview</h2>
              <span className="text-[0.7rem] text-slate-400">As it appears on the site</span>
            </div>

            {/* The homepage card: dark panel, oversized quote mark, headshot or monogram, name block. */}
            <div className="mt-4 rounded-2xl border border-white/10 bg-[#0D0A1C] p-6 shadow-[0_18px_40px_rgba(13,10,28,0.18)]">
              <span aria-hidden="true" className="block font-mono text-[2.6rem] leading-[0.5] text-[#6A55F2]">&ldquo;</span>
              <p className="mt-5 text-[0.95rem] leading-[1.65] text-white/85">
                {quote || "The testimonial quote will appear here as you type."}
              </p>
              <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
                {photo
                  ? <img src={photo} alt="" className="h-11 w-11 shrink-0 rounded-full border-2 border-[#6A55F2]/50 object-cover" />
                  : <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-[#6A55F2]/50 bg-[#EEEBFC] font-mono text-[0.8rem] font-700 text-[#543CDA]">{initials}</span>}
                <span className="min-w-0">
                  <span className="block truncate text-[0.88rem] font-700 text-white">{name || "Customer Name"}</span>
                  <span className="block truncate text-[0.78rem] text-white/60">{[role, company].filter(Boolean).join(", ") || "Role, Company"}</span>
                </span>
              </div>
            </div>

            {/* The rating is recorded here and used for the aggregate rating, not drawn on the card. */}
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3">
              <span className="text-[0.78rem] text-slate-600">Recorded rating</span>
              <span className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={14} className={i <= rating ? "text-[#F59E0B]" : "text-slate-300"} fill={i <= rating ? "#F59E0B" : "#E2E8F0"} />)}
                <span className="ml-1.5 text-[0.78rem] font-600 text-slate-700">{rating}.0</span>
              </span>
            </div>
            {!photo ? (
              <p className="mt-3 text-[0.74rem] leading-relaxed text-slate-500">
                No headshot yet, so the card shows initials. Add the client&rsquo;s photo above and the
                preview updates.
              </p>
            ) : null}
          </section>
        </div>
      </div>
    </form>
  );
}
