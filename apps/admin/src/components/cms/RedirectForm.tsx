/**
 * The redirect form, shared by Create and Edit.
 *
 * There was no Edit. The row menu's "Edit" pointed back at the list, so a redirect could be created
 * and deleted but never corrected — and since a mistyped source saves silently and simply never
 * fires, the only fix available was to delete the rule and write it again. One component serves both
 * screens so they cannot drift apart the way the two account menus did.
 *
 * Every control here is now stored and honoured. Until this change, five of them — Start Date, Expiry
 * Date, Case Sensitivity, Slash Handling and Match Pattern — were posted with each save and dropped,
 * because the API wrote five columns and the table had nowhere to put the rest.
 */
import type { ReactNode } from "react";
import { Info, TriangleAlert } from "lucide-react";

const field =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[0.86rem] text-slate-900 placeholder:text-slate-400 focus:border-[#543CDA] focus:outline-none focus:ring-2 focus:ring-[#543CDA]/15 resize-none";
const label = "text-[0.8rem] font-600 text-slate-700";

export interface RedirectValues {
  id?: string;
  old_url?: string;
  new_url?: string | null;
  type?: string;
  status?: string;
  start_date?: string | null;
  expiry_date?: string | null;
  case_sensitivity?: string;
  slash_handling?: string;
  pattern?: string;
  notes?: string | null;
}

export function RedirectForm({ values = {}, error }: { values?: RedirectValues; error?: string }): ReactNode {
  const editing = Boolean(values.id);
  return (
    <form action="/api/cms/redirects" method="post" className="mt-5 max-w-2xl">
      {editing ? <input type="hidden" name="id" value={values.id} /> : null}

      {/* The save used to fail silently on a bad value. It says why now. */}
      {error ? (
        <p className="mb-4 flex items-start gap-2 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[0.84rem] text-[#B91C1C]">
          <TriangleAlert size={15} className="mt-0.5 shrink-0" /> {error}
        </p>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle sm:p-5">
        <h2 className="text-[0.95rem] font-700 text-slate-900">Redirect Details</h2>
        <div className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className={label}>Old URL <span className="text-[#EF4444]">*</span></span>
            <input name="old_url" required defaultValue={values.old_url ?? ""}
              placeholder="/old-page-url or https://nexoristech.com/old-page-url"
              className={`${field} font-mono`} />
            <span className="text-[0.74rem] text-slate-500">
              A path or a full URL — a full URL is reduced to its path. For a RegEx rule, write the
              expression instead, such as <code className="font-mono">^/blog/(.+)$</code>.
            </span>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={label}>Destination URL</span>
            <input name="new_url" defaultValue={values.new_url ?? ""}
              placeholder="/new-page-url or https://example.com/page"
              className={`${field} font-mono`} />
            <span className="text-[0.74rem] text-slate-500">
              A path on this site, or a full URL to send visitors elsewhere. Use
              <code className="font-mono"> $1</code> to insert a RegEx capture group. Leave empty for 410.
            </span>
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5"><span className={label}>Redirect Type</span>
              <select name="type" defaultValue={values.type ?? "301"} className={`cursor-pointer ${field}`}>
                <option value="301">301 - Moved Permanently</option>
                <option value="302">302 - Found (Temporary)</option>
                <option value="307">307 - Temporary Redirect</option>
                <option value="410">410 - Gone</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5"><span className={label}>Status</span>
              <select name="status" defaultValue={values.status ?? "Active"} className={`cursor-pointer ${field}`}>
                <option>Active</option><option>Inactive</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5"><span className={label}>Start Date (optional)</span>
              <input type="date" name="start_date" defaultValue={values.start_date ?? ""} className={field} />
            </label>
            <label className="flex flex-col gap-1.5"><span className={label}>Expiry Date (optional)</span>
              <input type="date" name="expiry_date" defaultValue={values.expiry_date ?? ""} className={field} />
            </label>
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle sm:p-5">
        <h2 className="text-[0.95rem] font-700 text-slate-900">Advanced Options</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5"><span className={label}>Case Sensitivity</span>
            <select name="case_sensitivity" defaultValue={values.case_sensitivity ?? "Ignore Case"} className={`cursor-pointer ${field}`}>
              <option>Ignore Case</option><option>Match Case</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5"><span className={label}>Slash Handling</span>
            <select name="slash_handling" defaultValue={values.slash_handling ?? "Ignore Trailing Slash"} className={`cursor-pointer ${field}`}>
              <option>Ignore Trailing Slash</option><option>Exact Match</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-2"><span className={label}>Match Pattern</span>
            <select name="pattern" defaultValue={values.pattern ?? "Exact match"} className={`cursor-pointer ${field}`}>
              <option>Exact match</option><option>Pattern match (RegEx)</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-2"><span className={label}>Notes (optional)</span>
            <textarea name="notes" rows={2} defaultValue={values.notes ?? ""}
              placeholder="Why this redirect exists..." className={field} />
          </label>
        </div>
      </section>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-1.5 text-[0.76rem] text-slate-500">
          <Info size={13} /> Live within about twenty seconds of saving. Check the destination works first.
        </p>
        <div className="flex items-center gap-2">
          <a href="/cms/seo/redirects" className="rounded-lg border border-slate-200 px-5 py-2.5 text-[0.85rem] font-600 text-slate-600 hover:bg-slate-50">Cancel</a>
          <button type="submit" className="rounded-lg bg-[#543CDA] px-6 py-2.5 text-[0.85rem] font-600 text-white hover:bg-[#4330B8]">
            {editing ? "Save Changes" : "Save Redirect"}
          </button>
        </div>
      </div>
    </form>
  );
}
