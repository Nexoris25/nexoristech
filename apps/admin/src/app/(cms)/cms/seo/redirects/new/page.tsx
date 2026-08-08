/**
 * Create Redirect (CMS SEO Operations design). A native form for a new URL redirect: old URL, destination,
 * type, redirect group, start/expiry dates, case sensitivity, slash handling, match pattern, and notes.
 * Native POST to /api/cms/redirects. CMS access only. Responsive to 360px.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { requireCmsAccess } from "../../../../../../lib/auth.js";

export const dynamic = "force-dynamic";

const field = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[0.86rem] text-slate-900 placeholder:text-slate-400 focus:border-[#543CDA] focus:outline-none focus:ring-2 focus:ring-[#543CDA]/15 resize-none";
const label = "text-[0.8rem] font-600 text-slate-700";

export default async function NewRedirectPage(): Promise<ReactNode> {
  await requireCmsAccess();
  return (
    <div>
      <Link href="/cms/seo/redirects" className="inline-flex items-center gap-1.5 text-[0.8rem] font-600 text-slate-500 hover:text-[#543CDA]"><ArrowLeft size={15} /> Back to Redirects</Link>
      <h1 className="mt-3 text-[1.4rem] font-700 text-slate-900">Create Redirect</h1>
      <p className="mt-1 text-[0.86rem] text-slate-500">Create a new URL redirect.</p>

      <form action="/api/cms/redirects" method="post" className="mt-5 max-w-2xl">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle sm:p-5">
          <h2 className="text-[0.95rem] font-700 text-slate-900">Redirect Details</h2>
          <div className="mt-4 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5"><span className={label}>Old URL <span className="text-[#EF4444]">*</span></span><input name="old_url" required placeholder="/old-page-url" className={`${field} font-mono`} /></label>
            <label className="flex flex-col gap-1.5"><span className={label}>Destination URL <span className="text-[#EF4444]">*</span></span><input name="new_url" required placeholder="/new-page-url" className={`${field} font-mono`} /></label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5"><span className={label}>Redirect Type</span>
                <select name="type" defaultValue="301" className={`cursor-pointer ${field}`}>
                  <option value="301">301 - Moved Permanently</option><option value="302">302 - Found (Temporary)</option>
                  <option value="307">307 - Temporary Redirect</option><option value="410">410 - Gone</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5"><span className={label}>Status</span>
                <select name="status" defaultValue="Active" className={`cursor-pointer ${field}`}><option>Active</option><option>Inactive</option></select>
              </label>
              <label className="flex flex-col gap-1.5"><span className={label}>Start Date</span><input type="date" name="start_date" className={field} /></label>
              <label className="flex flex-col gap-1.5"><span className={label}>Expiry Date (optional)</span><input type="date" name="expiry_date" className={field} /></label>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle sm:p-5">
          <h2 className="text-[0.95rem] font-700 text-slate-900">Advanced Options</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5"><span className={label}>Case Sensitivity</span><select name="case_sensitivity" defaultValue="Ignore Case" className={`cursor-pointer ${field}`}><option>Ignore Case</option><option>Match Case</option></select></label>
            <label className="flex flex-col gap-1.5"><span className={label}>Slash Handling</span><select name="slash_handling" defaultValue="Ignore Trailing Slash" className={`cursor-pointer ${field}`}><option>Ignore Trailing Slash</option><option>Exact Match</option></select></label>
            <label className="flex flex-col gap-1.5 sm:col-span-2"><span className={label}>Match Pattern</span><select name="pattern" defaultValue="Exact match" className={`cursor-pointer ${field}`}><option>Exact match</option><option>Pattern match (RegEx)</option></select></label>
            <label className="flex flex-col gap-1.5 sm:col-span-2"><span className={label}>Notes (optional)</span><textarea name="notes" rows={2} placeholder="Why this redirect exists..." className={field} /></label>
          </div>
        </section>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="inline-flex items-center gap-1.5 text-[0.76rem] text-slate-500"><Info size={13} /> The redirect is active immediately after saving. Ensure the destination is live.</p>
          <div className="flex items-center gap-2">
            <a href="/cms/seo/redirects" className="rounded-lg border border-slate-200 px-5 py-2.5 text-[0.85rem] font-600 text-slate-600 hover:bg-slate-50">Cancel</a>
            <button type="submit" className="rounded-lg bg-[#543CDA] px-6 py-2.5 text-[0.85rem] font-600 text-white hover:bg-[#4330B8]">Save Redirect</button>
          </div>
        </div>
      </form>
    </div>
  );
}
