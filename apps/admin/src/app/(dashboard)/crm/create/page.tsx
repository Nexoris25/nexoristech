/**
 * CRM - Create Lead (Batch 3, screen 3). The Lead Information form: name, owner, email, status,
 * phone, an auto-calculated score note, company, budget, job title, potential value, source,
 * industry, and notes. Posts natively to the create-lead route, which inserts the lead, computes a
 * baseline score, and opens the new lead. Not available to viewers.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { INDUSTRIES } from "@nexoris/recommend";
import { requireStaff } from "../../../../lib/auth.js";
import { db } from "../../../../lib/db.js";
import { STAGES } from "../../../../lib/crm-constants.js";
import { SOURCE_LABEL } from "../../../../lib/lead-ui.js";

export const dynamic = "force-dynamic";

const FIELD =
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-[0.88rem] text-slate-900 placeholder:text-slate-500 focus:border-[#543CDA] focus:outline-none focus:ring-2 focus:ring-[#543CDA]/15";
const LABEL = "text-[0.8rem] font-600 text-slate-700";
const BUDGETS = ["Under ₦1M", "₦1M – ₦5M", "₦5M – ₦20M", "₦20M – ₦50M", "Over ₦50M"];
const SOURCES = Object.keys(SOURCE_LABEL);

export default async function CreateLeadPage(): Promise<ReactNode> {
  const staff = await requireStaff();
  if (staff.role === "viewer") {
    return <p className="text-[0.9rem] text-slate-500">Viewers cannot create leads.</p>;
  }
  const { rows: owners } = await db().query<{ id: string; name: string }>(
    "SELECT id, name FROM staff WHERE active = true AND role IN ('admin','salesperson') ORDER BY name",
  );

  return (
    <div className="mx-auto max-w-5xl">
      <nav className="flex items-center gap-1.5 text-[0.78rem] text-slate-500">
        <Link href="/crm" className="hover:text-[#543CDA]">Leads</Link>
        <ChevronRight size={13} strokeWidth={2} />
        <span className="text-slate-700">Create Lead</span>
      </nav>
      <h1 className="mt-2 text-[1.4rem] font-700 text-slate-900">Create Lead</h1>

      <form action="/api/crm/leads" method="post" className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle sm:p-6">
        <h2 className="text-[0.95rem] font-700 text-slate-900">Lead Information</h2>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Full Name <span className="text-[#EF4444]">*</span></span>
            <input name="name" required placeholder="Enter full name" className={FIELD} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Lead Owner <span className="text-[#EF4444]">*</span></span>
            <select name="owner" defaultValue={staff.id} className={`cursor-pointer ${FIELD}`}>
              {owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Email <span className="text-[#EF4444]">*</span></span>
            <input name="email" type="email" required placeholder="email@address.com" className={FIELD} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Lead Status</span>
            <select name="status" defaultValue="New" className={`cursor-pointer ${FIELD}`}>
              {STAGES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Phone <span className="text-[#EF4444]">*</span></span>
            <div className="flex gap-2">
              <select name="dialCode" defaultValue="+234" className={`w-24 shrink-0 cursor-pointer ${FIELD}`}>
                <option value="+234">🇳🇬 +234</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+44">🇬🇧 +44</option>
              </select>
              <input name="phone" placeholder="Enter phone number" className={`flex-1 ${FIELD}`} />
            </div>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Lead Score</span>
            <input disabled value="Auto calculated by Oge on save" className={`${FIELD} cursor-not-allowed bg-slate-50 text-slate-500`} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Company</span>
            <input name="company" placeholder="Search or enter company" className={FIELD} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Budget Range</span>
            <select name="budget" defaultValue="" className={`cursor-pointer ${FIELD}`}>
              <option value="">Select budget range</option>
              {BUDGETS.map((b) => <option key={b}>{b}</option>)}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Job Title</span>
            <input name="jobTitle" placeholder="Enter job title" className={FIELD} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Potential Value (₦)</span>
            <input name="potentialValue" type="number" min="0" placeholder="Enter potential value" className={FIELD} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Lead Source <span className="text-[#EF4444]">*</span></span>
            <select name="source" defaultValue="referral" className={`cursor-pointer ${FIELD}`}>
              {SOURCES.map((s) => <option key={s} value={s}>{SOURCE_LABEL[s]}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Industry</span>
            <select name="industry" defaultValue="" className={`cursor-pointer ${FIELD}`}>
              <option value="">Select industry</option>
              {INDUSTRIES.map((i) => <option key={i.slug} value={i.slug}>{i.label}</option>)}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className={LABEL}>Notes</span>
            <textarea name="notes" rows={3} maxLength={500} placeholder="Add notes about this lead..." className={FIELD} />
          </label>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Link href="/crm" className="cursor-pointer rounded-lg border border-slate-200 px-5 py-2.5 text-[0.86rem] font-600 text-slate-700 hover:bg-slate-50">Cancel</Link>
          <button type="submit" className="cursor-pointer rounded-lg bg-[#543CDA] px-6 py-2.5 text-[0.86rem] font-600 text-white transition-colors hover:bg-[#4330B8]">Create Lead</button>
        </div>
      </form>
    </div>
  );
}
