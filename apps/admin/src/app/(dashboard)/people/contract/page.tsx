/**
 * HR - Contract staff register (PRD 7.10, 7.4). A lighter record than a full employee: contract and
 * consultant staff, paid by retainer/per-project (withholding tax), with no pension or NHF and no
 * mandatory guarantor. The commission-eligible flag decides whether the Commission Engine pays them.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { Briefcase } from "lucide-react";
import { requireAdmin } from "../../../../lib/auth.js";
import { db } from "../../../../lib/db.js";

export const dynamic = "force-dynamic";

interface Row {
  id: string;
  full_name: string;
  staff_number: string | null;
  job_title: string | null;
  employment_type: string;
  department: string | null;
  commission_eligible: boolean;
  employment_status: string;
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");
}

export default async function ContractRegisterPage(): Promise<ReactNode> {
  await requireAdmin();
  const { rows } = await db().query<Row>(
    `SELECT e.id, e.full_name, e.staff_number, e.job_title, e.employment_type, d.name AS department,
            e.commission_eligible, e.employment_status
       FROM employee e LEFT JOIN hr_department d ON d.id = e.department_id
      WHERE e.employment_type IN ('Contract','Consultant') ORDER BY e.full_name LIMIT 100`,
  );

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900">Contract Staff Register</h1>
          <p className="mt-1 text-[0.88rem] text-slate-500">Contract and consultant staff, paid on withholding tax. Commission-eligible staff are paid through the Commission Engine.</p>
        </div>
        <Link href="/people/onboard" className="inline-flex items-center gap-1.5 rounded-lg bg-[#543CDA] px-4 py-2 text-[0.84rem] font-600 text-white hover:bg-[#4330B8]"><Briefcase size={15} strokeWidth={2} /> Add Contractor</Link>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-subtle">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-14 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#EEEBFC] text-[#543CDA]"><Briefcase size={22} strokeWidth={2} /></span>
            <p className="text-[0.92rem] font-600 text-slate-700">No contract staff yet</p>
            <p className="max-w-sm text-[0.85rem] text-slate-500">Onboard a person with type Contract or Consultant and they appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[0.7rem] uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-600">Name</th>
                  <th className="px-5 py-3 font-600">Staff ID</th>
                  <th className="px-5 py-3 font-600">Role</th>
                  <th className="px-5 py-3 font-600">Type</th>
                  <th className="px-5 py-3 font-600">Commission</th>
                  <th className="px-5 py-3 font-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <Link href={`/people/${r.id}`} className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 font-mono text-[0.64rem] font-700 text-slate-600">{initials(r.full_name)}</span>
                        <span className="text-[0.85rem] font-600 text-slate-900 hover:text-[#543CDA]">{r.full_name}</span>
                      </Link>
                    </td>
                    <td className="px-5 py-3 font-mono text-[0.82rem] text-slate-600">{r.staff_number ?? "—"}</td>
                    <td className="px-5 py-3 text-[0.83rem] text-slate-600">{r.job_title ?? "—"}</td>
                    <td className="px-5 py-3 text-[0.83rem] text-slate-600">{r.employment_type}</td>
                    <td className="px-5 py-3">{r.commission_eligible ? <span className="rounded-full bg-[#EEEBFC] px-2.5 py-1 text-[0.72rem] font-600 text-[#543CDA]">Eligible</span> : <span className="text-[0.8rem] text-slate-500">—</span>}</td>
                    <td className="px-5 py-3 text-[0.83rem] text-slate-600">{r.employment_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
