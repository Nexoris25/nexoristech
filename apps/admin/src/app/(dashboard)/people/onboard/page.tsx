/**
 * HR - Onboard new employee (PRD 7.10, guided form; record shape 7.3). One grouped form: personal,
 * employment, salary structure, bank and statutory identifiers, and next of kin. Creates the person
 * (the only place in the platform this happens, 3.1). No BVN field exists here, by design (7.3).
 * HR Admin only. Guarantors and documents are added on the record afterwards.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { requireCapability } from "../../../../lib/auth.js";
import { db } from "../../../../lib/db.js";
import { PayBreakdown } from "./PayBreakdown.js";

export const dynamic = "force-dynamic";

const FIELD = "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-[0.88rem] text-slate-900 placeholder:text-slate-500 focus:border-[#543CDA] focus:outline-none focus:ring-2 focus:ring-[#543CDA]/15";
const LABEL = "text-[0.8rem] font-600 text-slate-700";

function Section({ title, sub, children }: { title: string; sub?: string; children: ReactNode }): ReactNode {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle sm:p-6">
      <h2 className="text-[0.95rem] font-700 text-slate-900">{title}</h2>
      {sub ? <p className="mt-0.5 text-[0.8rem] text-slate-500">{sub}</p> : null}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}
function F({ label, name, type = "text", required = false, placeholder }: { label: string; name: string; type?: string; required?: boolean; placeholder?: string }): ReactNode {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={LABEL}>{label}{required ? <span className="text-[#EF4444]"> *</span> : null}</span>
      <input name={name} type={type} required={required} placeholder={placeholder} className={FIELD} />
    </label>
  );
}

export default async function OnboardPage(): Promise<ReactNode> {
  await requireCapability("hr.onboard");
  const [{ rows: depts }, { rows: managers }] = await Promise.all([
    db().query<{ id: string; name: string }>("SELECT id, name FROM hr_department ORDER BY name"),
    db().query<{ id: string; full_name: string }>("SELECT id, full_name FROM employee WHERE employment_status <> 'Exited' ORDER BY full_name"),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <nav className="flex items-center gap-1.5 text-[0.78rem] text-slate-500">
        <Link href="/people" className="hover:text-[#543CDA]">HR</Link>
        <ChevronRight size={13} strokeWidth={2} />
        <span className="text-slate-700">Onboard Employee</span>
      </nav>
      <h1 className="mt-2 text-[1.4rem] font-700 text-slate-900">Onboard Employee</h1>
      <p className="mt-1 text-[0.88rem] text-slate-500">HR is the one place a person is created. Module access is granted separately, in Settings.</p>

      <form action="/api/hr/employees" method="post" className="mt-5 flex flex-col gap-4">
        <Section title="Personal" sub="Nexoris Technologies does not collect a BVN.">
          <F label="Full name" name="full_name" required placeholder="Legal name" />
          <F label="Date of birth" name="date_of_birth" type="date" />
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Gender</span>
            <select name="gender" defaultValue="" className={`cursor-pointer ${FIELD}`}><option value="">Select</option><option>Female</option><option>Male</option><option>Prefer not to say</option></select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Marital status</span>
            <select name="marital_status" defaultValue="" className={`cursor-pointer ${FIELD}`}><option value="">Select</option><option>Single</option><option>Married</option><option>Other</option></select>
          </label>
          <F label="Phone" name="phone" placeholder="+234 801 234 5678" />
          <F label="Personal email" name="personal_email" type="email" placeholder="name@personal.com" />
          <label className="flex flex-col gap-1.5 sm:col-span-2"><span className={LABEL}>Residential address</span><input name="address" className={FIELD} /></label>
        </Section>

        <Section title="Employment">
          <F label="Job title" name="job_title" placeholder="e.g. Frontend Developer" />
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Department</span>
            <select name="department_id" defaultValue="" className={`cursor-pointer ${FIELD}`}><option value="">Select department</option>{depts.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Employment type</span>
            <select name="employment_type" defaultValue="Full-time" className={`cursor-pointer ${FIELD}`}><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Consultant</option></select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Employment status</span>
            <select name="employment_status" defaultValue="Probation" className={`cursor-pointer ${FIELD}`}><option>Probation</option><option>Confirmed</option></select>
          </label>
          <F label="Date joined" name="date_joined" type="date" />
          <F label="Work email" name="work_email" type="email" placeholder="name@nexoris.com" />
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Reporting manager</span>
            <select name="manager_id" defaultValue="" className={`cursor-pointer ${FIELD}`}><option value="">None</option>{managers.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}</select>
          </label>
          <label className="flex items-center gap-2.5 rounded-lg border border-slate-200 px-3.5 py-2.5 sm:col-span-2">
            <input type="checkbox" name="commission_eligible" className="h-4 w-4 cursor-pointer rounded accent-[#543CDA]" />
            <span className="text-[0.84rem] text-slate-700">Commission eligible <span className="text-slate-500">— paid through the Commission Engine, regardless of type or department</span></span>
          </label>
          {/* Commission terms. Only used when the person is commission eligible; a commission-only rep
              typically sits on the closed deal basis, where pay follows what they sell. */}
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Commission rate (%)</span>
            <input type="number" name="commission_rate" min={3} max={20} step={0.5} placeholder="3 to 20" className={FIELD} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Commission applied to</span>
            <select name="commission_basis" defaultValue="" className={`cursor-pointer ${FIELD}`}>
              <option value="">Not applicable</option>
              <option value="salary">Employee salary</option>
              <option value="closed_deal">Closed deal value</option>
            </select>
          </label>
        </Section>

        <Section title="Pay and statutory deductions" sub="Enter gross pay and tick what applies. Everything below recalculates as you type.">
          <PayBreakdown fieldClass={FIELD} labelClass={LABEL} />
        </Section>

        <Section title="Bank and statutory">
          <F label="Bank name" name="bank_name" />
          <F label="Account number" name="account_number" />
          <F label="Account name" name="account_name" placeholder="Must match legal name" />
          <F label="Tax Identification Number (TIN)" name="tin" />
          <F label="Pension PIN" name="pension_pin" />
          <F label="Pension Fund Administrator" name="pension_fund_administrator" />
          <F label="NHF number (if registered)" name="nhf_number" />
        </Section>

        <Section title="Next of kin">
          <F label="Name" name="nok_name" />
          <F label="Relationship" name="nok_relationship" />
          <F label="Phone" name="nok_phone" />
          <F label="Address" name="nok_address" />
        </Section>

        <div className="flex items-center justify-end gap-3">
          <Link href="/people" className="cursor-pointer rounded-lg border border-slate-200 px-5 py-2.5 text-[0.86rem] font-600 text-slate-700 hover:bg-slate-50">Cancel</Link>
          <button type="submit" className="cursor-pointer rounded-lg bg-[#543CDA] px-6 py-2.5 text-[0.86rem] font-600 text-white hover:bg-[#4330B8]">Create Employee</button>
        </div>
      </form>
    </div>
  );
}
