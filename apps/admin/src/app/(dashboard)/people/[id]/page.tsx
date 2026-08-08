/**
 * HR - Employee record (PRD 7.10 record view; 7.3). The full record in clearly separated sections:
 * personal, employment, salary structure, bank and statutory identifiers, next of kin, and the
 * guarantor section (third-party data, kept apart). Offboarding lives here and, on save, revokes
 * every module access grant through the shared model (3.3). No BVN field exists (7.3). HR Admin.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { requireAdmin } from "../../../../lib/auth.js";
import { db } from "../../../../lib/db.js";

export const dynamic = "force-dynamic";

interface Emp {
  id: string;
  full_name: string;
  date_of_birth: string | null;
  gender: string | null;
  marital_status: string | null;
  phone: string | null;
  personal_email: string | null;
  address: string | null;
  staff_number: string | null;
  job_title: string | null;
  department: string | null;
  employment_type: string;
  date_joined: string | null;
  employment_status: string;
  manager: string | null;
  work_email: string | null;
  basic_salary: string;
  housing_allowance: string;
  transport_allowance: string;
  other_allowances: string;
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  tin: string | null;
  pension_pin: string | null;
  pension_fund_administrator: string | null;
  nhf_number: string | null;
  nok_name: string | null;
  nok_relationship: string | null;
  nok_phone: string | null;
  nok_address: string | null;
  commission_eligible: boolean;
  commission_rate: string | null;
  commission_basis: string | null;
  last_working_day: string | null;
  exit_reason: string | null;
}

const STATUS: Record<string, string> = {
  Probation: "bg-[#FEF3C7] text-[#B45309]",
  Confirmed: "bg-[#DCFCE7] text-[#15803D]",
  "On Leave": "bg-[#DBEAFE] text-[#1D4ED8]",
  Exited: "bg-slate-100 text-slate-600",
};

function naira(v: string): string {
  return `₦${Number.parseFloat(v).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function Field({ label, value }: { label: string; value: string | null }): ReactNode {
  return (
    <div>
      <dt className="text-[0.72rem] text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-[0.85rem] font-600 text-slate-900">{value || "—"}</dd>
    </div>
  );
}
function Card({ title, sub, children }: { title: string; sub?: string; children: ReactNode }): ReactNode {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
      <h2 className="text-[0.9rem] font-700 text-slate-900">{title}</h2>
      {sub ? <p className="mt-0.5 text-[0.76rem] text-slate-500">{sub}</p> : null}
      <dl className="mt-4 grid grid-cols-2 gap-4">{children}</dl>
    </section>
  );
}

export default async function EmployeeRecordPage({ params }: { params: Promise<{ id: string }> }): Promise<ReactNode> {
  await requireAdmin();
  const { id } = await params;
  const [{ rows }, { rows: guarantors }] = await Promise.all([
    db().query<Emp>(
      `SELECT e.*, d.name AS department, m.full_name AS manager
         FROM employee e LEFT JOIN hr_department d ON d.id = e.department_id
         LEFT JOIN employee m ON m.id = e.manager_id WHERE e.id = $1`,
      [id],
    ),
    db().query<{ id: string; full_name: string; relationship: string | null; phone: string | null; occupation: string | null }>(
      "SELECT id, full_name, relationship, phone, occupation FROM employee_guarantor WHERE employee_id = $1",
      [id],
    ),
  ]);
  const e = rows[0];
  if (!e) notFound();

  const gross = ["basic_salary", "housing_allowance", "transport_allowance", "other_allowances"]
    .reduce((s, key) => s + (Number.parseFloat(e[key as keyof Emp] as string) || 0), 0);

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/people" className="inline-flex items-center gap-1.5 text-[0.8rem] font-600 text-[#543CDA] hover:text-[#4330B8]"><ArrowLeft size={15} strokeWidth={2.2} /> Directory</Link>

      <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-slate-100 font-mono text-[1rem] font-700 text-slate-600">{e.full_name.split(/\s+/).map((p) => p[0]).join("").slice(0, 2)}</span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[1.25rem] font-700 text-slate-900">{e.full_name}</h1>
                <span className={`rounded-full px-2.5 py-0.5 text-[0.72rem] font-600 ${STATUS[e.employment_status]}`}>{e.employment_status}</span>
                {e.commission_eligible ? <span className="rounded-full bg-[#EEEBFC] px-2.5 py-0.5 text-[0.7rem] font-600 text-[#543CDA]">Commission eligible</span> : null}
              </div>
              <p className="mt-0.5 text-[0.85rem] text-slate-500">{[e.job_title, e.department, e.staff_number].filter(Boolean).join(" · ")}</p>
            </div>
          </div>
          <Link href="/settings/access" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-[0.84rem] font-600 text-slate-700 hover:bg-slate-50"><ShieldCheck size={15} strokeWidth={2} /> Grant module access</Link>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Personal">
          <Field label="Date of birth" value={e.date_of_birth ? new Date(e.date_of_birth).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }) : null} />
          <Field label="Gender" value={e.gender} />
          <Field label="Marital status" value={e.marital_status} />
          <Field label="Phone" value={e.phone} />
          <Field label="Personal email" value={e.personal_email} />
          <div className="col-span-2"><Field label="Residential address" value={e.address} /></div>
        </Card>

        <Card title="Employment">
          <Field label="Staff ID" value={e.staff_number} />
          <Field label="Type" value={e.employment_type} />
          <Field label="Department" value={e.department} />
          <Field label="Reporting manager" value={e.manager} />
          <Field label="Date joined" value={e.date_joined ? new Date(e.date_joined).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }) : null} />
          <Field label="Work email" value={e.work_email} />
        </Card>

        <Card title="Salary structure" sub="Pension is computed on basic + housing + transport only.">
          <Field label="Basic salary" value={naira(e.basic_salary)} />
          {e.commission_eligible ? <Field label="Commission" value={e.commission_rate ? `${Number(e.commission_rate)}% of ${e.commission_basis === "closed_deal" ? "closed deal value" : "salary"}` : "Rate not set"} /> : null}
          <Field label="Housing allowance" value={naira(e.housing_allowance)} />
          <Field label="Transport allowance" value={naira(e.transport_allowance)} />
          <Field label="Other allowances" value={naira(e.other_allowances)} />
          <div className="col-span-2 border-t border-slate-100 pt-3"><Field label="Gross monthly salary" value={naira(String(gross))} /></div>
        </Card>

        <Card title="Bank and statutory">
          <Field label="Bank" value={e.bank_name} />
          <Field label="Account number" value={e.account_number} />
          <Field label="Account name" value={e.account_name} />
          <Field label="TIN" value={e.tin} />
          <Field label="Pension PIN" value={e.pension_pin} />
          <Field label="Pension Fund Administrator" value={e.pension_fund_administrator} />
          <Field label="NHF number" value={e.nhf_number} />
        </Card>

        <Card title="Next of kin">
          <Field label="Name" value={e.nok_name} />
          <Field label="Relationship" value={e.nok_relationship} />
          <Field label="Phone" value={e.nok_phone} />
          <Field label="Address" value={e.nok_address} />
        </Card>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.9rem] font-700 text-slate-900">Guarantors</h2>
          <p className="mt-0.5 text-[0.76rem] text-slate-500">Third-party personal data, kept in its own section.</p>
          {guarantors.length === 0 ? (
            <p className="mt-4 text-[0.83rem] text-slate-500">No guarantor recorded yet.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {guarantors.map((g) => (
                <li key={g.id} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[0.85rem] font-600 text-slate-900">{g.full_name}</p>
                  <p className="text-[0.78rem] text-slate-500">{[g.relationship, g.occupation, g.phone].filter(Boolean).join(" · ")}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {e.employment_status !== "Exited" ? (
        <section className="mt-4 rounded-2xl border border-red-200 bg-red-50/40 p-5 shadow-subtle">
          <h2 className="text-[0.9rem] font-700 text-slate-900">Offboard employee</h2>
          <p className="mt-0.5 text-[0.8rem] text-slate-600">Saving this sets the exit and, in the same action, revokes every module access grant for this person (PRD 3.3). History is preserved.</p>
          <form action="/api/hr/offboard" method="post" className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input type="hidden" name="id" value={e.id} />
            <label className="flex flex-col gap-1.5"><span className="text-[0.8rem] font-600 text-slate-700">Last working day</span><input name="last_working_day" type="date" className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-[0.88rem] text-slate-900 focus:border-[#543CDA] focus:outline-none" /></label>
            <label className="flex flex-col gap-1.5"><span className="text-[0.8rem] font-600 text-slate-700">Exit reason</span><input name="exit_reason" placeholder="Resignation, end of contract, ..." className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-[0.88rem] text-slate-900 placeholder:text-slate-500 focus:border-[#543CDA] focus:outline-none" /></label>
            <label className="flex items-center gap-2.5 sm:col-span-2"><input type="checkbox" name="final_settlement" className="h-4 w-4 cursor-pointer rounded accent-[#543CDA]" /><span className="text-[0.83rem] text-slate-700">Flag final settlement for Payroll</span></label>
            <div className="sm:col-span-2"><button type="submit" className="rounded-lg bg-[#DC2626] px-5 py-2.5 text-[0.84rem] font-600 text-white hover:bg-[#B91C1C]">Offboard employee</button></div>
          </form>
        </section>
      ) : (
        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <p className="text-[0.85rem] text-slate-600">Exited on {e.last_working_day ? new Date(e.last_working_day).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }) : "—"}{e.exit_reason ? ` · ${e.exit_reason}` : ""}. Module access was revoked.</p>
        </section>
      )}
    </div>
  );
}
