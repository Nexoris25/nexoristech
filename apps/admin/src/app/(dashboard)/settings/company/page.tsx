/**
 * Company (PRD 15). The single company record used on every document and invoice: legal profile,
 * registration (RC and registration numbers, TIN - never a BVN), contact, logo, the fiscal calendar,
 * the default VAT rate, and which notification channels are on. Branches, Business Units, and generic
 * third-party Integrations are not built: the PRD does not describe them, and Nexoris Technologies is
 * a single legal entity. Admin only.
 */
import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { requireAdmin } from "../../../../lib/auth.js";
import { db } from "../../../../lib/db.js";

export const dynamic = "force-dynamic";

interface Row {
  legal_name: string; tin: string | null; rc_number: string | null; registration_number: string | null;
  address: string; email: string; phone: string; logo_url: string | null;
  fiscal_year_start_month: number; vat_rate: string; notify_email: boolean; notify_sms: boolean; notify_inapp: boolean;
}
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const field = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-[0.86rem] text-slate-900 focus:border-[#543CDA] focus:outline-none focus:ring-2 focus:ring-[#543CDA]/15";
const lbl = "text-[0.78rem] font-600 text-slate-700";

export default async function CompanyPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }): Promise<ReactNode> {
  await requireAdmin();
  const { saved } = await searchParams;
  const c = (await db().query<Row>(
    `SELECT legal_name, tin, rc_number, registration_number, address, email, phone, logo_url,
            fiscal_year_start_month, vat_rate::text, notify_email, notify_sms, notify_inapp
       FROM company_settings WHERE id=true`)).rows[0]!;

  const notify = [
    ["notify_email", "Email", "Invoices, receipts, and alerts by email.", c.notify_email],
    ["notify_sms", "SMS", "Time-critical alerts by text.", c.notify_sms],
    ["notify_inapp", "In-app", "Action Center and in-dashboard notices.", c.notify_inapp],
  ] as const;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-[1.4rem] font-700 text-slate-900">Company</h1>
      <p className="mt-1 text-[0.88rem] text-slate-500">The single company record used across the platform.</p>
      {saved ? <div className="mt-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-[0.84rem] text-green-700"><CheckCircle2 size={16} /> Saved.</div> : null}

      <form action="/api/settings/company" method="post" className="mt-5 flex flex-col gap-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.95rem] font-700 text-slate-900">Company information</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 sm:col-span-2"><span className={lbl}>Legal name</span><input name="legal_name" defaultValue={c.legal_name} required className={field} /></label>
            <label className="flex flex-col gap-1.5 sm:col-span-2"><span className={lbl}>Registered address</span><input name="address" defaultValue={c.address} className={field} /></label>
            <label className="flex flex-col gap-1.5"><span className={lbl}>Logo URL</span><input name="logo_url" defaultValue={c.logo_url ?? ""} placeholder="/logo-mark-white.png" className={field} /></label>
            <label className="flex flex-col gap-1.5"><span className={lbl}>Default VAT rate (%)</span><input name="vat_rate" type="number" step="0.1" min="0" max="100" defaultValue={c.vat_rate} className={field} /></label>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.95rem] font-700 text-slate-900">Registration details</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1.5"><span className={lbl}>Tax ID (TIN)</span><input name="tin" defaultValue={c.tin ?? ""} placeholder="Not set" className={field} /></label>
            <label className="flex flex-col gap-1.5"><span className={lbl}>RC number</span><input name="rc_number" defaultValue={c.rc_number ?? ""} placeholder="CAC RC" className={field} /></label>
            <label className="flex flex-col gap-1.5"><span className={lbl}>Registration no.</span><input name="registration_number" defaultValue={c.registration_number ?? ""} className={field} /></label>
          </div>
          <p className="mt-2 text-[0.74rem] text-slate-500">No Bank Verification Number is stored anywhere on the platform.</p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.95rem] font-700 text-slate-900">Contact &amp; fiscal calendar</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1.5"><span className={lbl}>Billing email</span><input name="email" type="email" defaultValue={c.email} className={field} /></label>
            <label className="flex flex-col gap-1.5"><span className={lbl}>Phone</span><input name="phone" defaultValue={c.phone} className={field} /></label>
            <label className="flex flex-col gap-1.5"><span className={lbl}>Fiscal year starts</span><select name="fiscal_year_start_month" defaultValue={String(c.fiscal_year_start_month)} className={`cursor-pointer ${field}`}>{MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select></label>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.95rem] font-700 text-slate-900">Notifications</h2>
          <div className="mt-3 flex flex-col divide-y divide-slate-100">
            {notify.map(([name, title, desc, on]) => (
              <label key={name} className="flex cursor-pointer items-center gap-3 py-3">
                <input type="checkbox" name={name} defaultChecked={on} className="h-4 w-4 shrink-0 cursor-pointer rounded accent-[#543CDA]" />
                <span><span className="block text-[0.87rem] font-600 text-slate-900">{title}</span><span className="block text-[0.78rem] text-slate-500">{desc}</span></span>
              </label>
            ))}
          </div>
        </section>

        <div className="flex justify-end"><button className="rounded-lg bg-[#543CDA] px-6 py-2.5 text-[0.86rem] font-600 text-white hover:bg-[#4330B8]">Save</button></div>
      </form>
    </div>
  );
}
