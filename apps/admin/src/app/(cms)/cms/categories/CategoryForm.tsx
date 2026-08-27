"use client";
/**
 * Create / edit category form (CMS design). Left: the category fields and the active toggle. Right: a
 * live preview that updates as you type. Submits as a native POST to /api/cms/categories. The slug is
 * auto-generated from the name until the user edits it.
 */
import { useState } from "react";
import type { ReactNode } from "react";
import { Hash } from "lucide-react";

interface Parent { id: string; name: string }
interface Initial { id?: string; name?: string; slug?: string; description?: string; parent_id?: string; active?: boolean; count?: number; created?: string; updated?: string }
const field = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[0.86rem] text-slate-900 placeholder:text-slate-400 focus:border-[#543CDA] focus:outline-none focus:ring-2 focus:ring-[#543CDA]/15 resize-none";
const label = "text-[0.8rem] font-600 text-slate-700";
const slugify = (s: string): string => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export function CategoryForm({ initial, parents }: { initial?: Initial; parents: Parent[] }): ReactNode {
  const edit = Boolean(initial?.id);
  const [name, setName] = useState(initial?.name ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(initial?.slug));
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [desc, setDesc] = useState(initial?.description ?? "");
  const [active, setActive] = useState(initial?.active ?? true);
  const shownSlug = slugEdited ? slug : slugify(name);

  return (
    <form action="/api/cms/categories" method="post">
      {edit ? <input type="hidden" name="id" value={initial!.id} /> : null}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
            <h2 className="text-[0.95rem] font-700 text-slate-900">Category Information</h2>
            <div className="mt-4 flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="flex items-center justify-between"><span className={label}>Category Name <span className="text-[#EF4444]">*</span></span><span className="text-[0.72rem] text-slate-500">{name.length}/100</span></span>
                <input name="name" value={name} maxLength={100} onChange={(e) => setName(e.target.value)} placeholder="Enter category name..." required className={field} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={label}>Slug <span className="text-[#EF4444]">*</span></span>
                <input name="slug" value={shownSlug} onChange={(e) => { setSlugEdited(true); setSlug(e.target.value); }} placeholder="category-slug" required className={`${field} font-mono`} />
                <span className="text-[0.74rem] text-slate-500">Auto-generated from the category name. You can edit it.</span>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="flex items-center justify-between"><span className={label}>Short Description</span><span className="text-[0.72rem] text-slate-500">{desc.length}/160</span></span>
                <textarea name="description" value={desc} maxLength={160} onChange={(e) => setDesc(e.target.value)} rows={3} placeholder="Enter a short description for this category..." className={field} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={label}>Parent Category (Optional)</span>
                <select name="parent_id" defaultValue={initial?.parent_id ?? ""} className={`cursor-pointer ${field}`}><option value="">Select parent category</option>{parents.filter((p) => p.id !== initial?.id).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                <span className="text-[0.74rem] text-slate-500">Choose a parent to create a sub-category.</span>
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
            <h2 className="text-[0.95rem] font-700 text-slate-900">Settings</h2>
            <label className="mt-3 flex cursor-pointer items-center justify-between gap-3">
              <span><span className="block text-[0.85rem] font-600 text-slate-800">Status</span><span className="block text-[0.78rem] text-slate-500">Choose whether this category is active and available for content.</span></span>
              <input type="checkbox" name="active" checked={active} onChange={(e) => setActive(e.target.checked)} className="peer sr-only" />
              <span onClick={() => setActive((v) => !v)} className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${active ? "bg-[#543CDA]" : "bg-slate-300"}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${active ? "left-[1.4rem]" : "left-0.5"}`} /></span>
            </label>
          </section>

          {/* A category has no draft state of its own; "active" is what decides whether it appears
              on the site. These name that in the words an editor uses, so taking one out of
              circulation does not mean remembering which checkbox means what. */}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <a href="/cms/categories" className="rounded-lg border border-slate-200 px-5 py-2.5 text-[0.85rem] font-600 text-slate-600 hover:bg-slate-50">Cancel</a>
            {edit && initial?.active !== false ? (
              <button type="submit" name="intent" value="unpublish"
                className="rounded-lg border border-[#DC2626]/30 px-5 py-2.5 text-[0.85rem] font-600 text-[#DC2626] hover:bg-red-50">
                Unpublish
              </button>
            ) : null}
            <button type="submit" name="intent" value="draft"
              className="rounded-lg border border-slate-200 px-5 py-2.5 text-[0.85rem] font-600 text-slate-700 hover:bg-slate-50">
              Save as Draft
            </button>
            <button type="submit" name="intent" value="save" className="rounded-lg bg-[#543CDA] px-6 py-2.5 text-[0.85rem] font-600 text-white hover:bg-[#4330B8]">{edit ? "Save Changes" : "Create Category"}</button>
          </div>
        </div>

        {/* Live preview */}
        <div>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
            <h2 className="text-[0.8rem] font-600 text-slate-500">Category Preview</h2>
            <div className="mt-4 flex flex-col items-center text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#543CDA] to-[#6A55F2] text-white"><Hash size={24} strokeWidth={2.2} /></span>
              <p className="mt-3 text-[1.05rem] font-700 text-slate-900">{name || "Category Name"}</p>
              <span className="mt-1 rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-[0.72rem] text-slate-600">{shownSlug || "category-slug"}</span>
              {desc ? <p className="mt-2 max-w-[16rem] text-[0.78rem] text-slate-500">{desc}</p> : null}
              <p className="mt-4 text-[0.72rem] text-slate-500">Insights in this category</p>
              <p className="text-[1.6rem] font-700 text-slate-900">{initial?.count ?? 0}</p>
              <p className="mt-2 text-[0.72rem] text-slate-500">Status</p>
              <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-600 ${active ? "bg-[#DCFCE7] text-[#15803D]" : "bg-slate-100 text-slate-600"}`}>{active ? "Active" : "Inactive"}</span>
            </div>
            {edit && (initial?.created || initial?.updated) ? (
              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-[0.72rem] font-600 uppercase tracking-wide text-slate-500">Details</p>
                <div className="mt-2 space-y-1.5 text-[0.78rem]">
                  <div className="flex justify-between"><span className="text-slate-500">Created</span><span className="font-600 text-slate-700">{initial?.created}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Last Updated</span><span className="font-600 text-slate-700">{initial?.updated}</span></div>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </form>
  );
}
