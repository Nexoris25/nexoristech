"use client";
/**
 * Create / edit department form (CMS Careers design). Name, slug, description, display order, and status.
 * Native POST to /api/cms/departments. Slug auto-generates from the name until edited. Responsive.
 */
import { useState } from "react";
import type { ReactNode } from "react";

interface Initial { id?: string; name?: string; slug?: string; description?: string; displayOrder?: number; active?: boolean }
const field = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[0.86rem] text-slate-900 placeholder:text-slate-400 focus:border-[#543CDA] focus:outline-none focus:ring-2 focus:ring-[#543CDA]/15 resize-none";
const label = "text-[0.8rem] font-600 text-slate-700";
const slugify = (s: string): string => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export function DepartmentForm({ initial }: { initial?: Initial }): ReactNode {
  const edit = Boolean(initial?.id);
  const [name, setName] = useState(initial?.name ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(initial?.slug));
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [active, setActive] = useState(initial?.active ?? true);
  const shownSlug = slugEdited ? slug : slugify(name);

  return (
    <form action="/api/cms/departments" method="post" className="max-w-2xl">
      {edit ? <input type="hidden" name="id" value={initial!.id} /> : null}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle sm:p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 sm:col-span-2"><span className={label}>Department Name <span className="text-[#EF4444]">*</span></span><input name="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Engineering" className={field} /></label>
          <label className="flex flex-col gap-1.5 sm:col-span-2"><span className={label}>Slug</span><input name="slug" value={shownSlug} onChange={(e) => { setSlugEdited(true); setSlug(e.target.value); }} placeholder="engineering" className={`${field} font-mono`} /></label>
          <label className="flex flex-col gap-1.5 sm:col-span-2"><span className={label}>Description</span><textarea name="description" defaultValue={initial?.description ?? ""} rows={3} placeholder="Software development and engineering roles..." className={field} /></label>
          <label className="flex flex-col gap-1.5"><span className={label}>Display Order</span><input name="display_order" type="number" min={0} defaultValue={initial?.displayOrder ?? 0} className={field} /><span className="text-[0.74rem] text-slate-500">Lower numbers appear first.</span></label>
          <label className="flex cursor-pointer items-center justify-between gap-3 self-start rounded-lg border border-slate-200 px-3 py-2.5">
            <span className="text-[0.82rem] font-600 text-slate-700">Active</span>
            <input type="checkbox" name="active" checked={active} onChange={(e) => setActive(e.target.checked)} className="peer sr-only" />
            <span aria-hidden="true" className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${active ? "bg-[#543CDA]" : "bg-slate-300"}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${active ? "left-[1.4rem]" : "left-0.5"}`} /></span>
          </label>
        </div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <a href="/cms/departments" className="rounded-lg border border-slate-200 px-5 py-2.5 text-[0.85rem] font-600 text-slate-600 hover:bg-slate-50">Cancel</a>
          <button type="submit" className="rounded-lg bg-[#543CDA] px-6 py-2.5 text-[0.85rem] font-600 text-white hover:bg-[#4330B8]">{edit ? "Save Changes" : "Create Department"}</button>
        </div>
      </section>
    </form>
  );
}
