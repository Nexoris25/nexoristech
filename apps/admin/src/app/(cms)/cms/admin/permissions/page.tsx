/**
 * Permission Matrix. What each CMS role may do, read from the model the gate enforces.
 *
 * The matrix used to list seven roles — Super Admin, Admin, Editor, Reviewer, Author, Contributor,
 * Analyst — against thirteen modules, with a full/partial/none mark in every cell. None of it was real:
 * four of those roles do not exist in the access table, and the gate did not read roles at all, so every
 * granted user held identical access whatever the matrix said.
 *
 * Every cell here is `roleCan(role, capability)` from lib/cms-roles, which is the same function
 * `requireCmsCapability` calls. If a cell says no, the action is refused.
 *
 * CMS access only. Responsive: the matrix scrolls inside its own container down to 360px.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import { requireCmsAccess } from "../../../../../lib/auth.js";
import { db } from "../../../../../lib/db.js";
import {
  CMS_ROLES, CMS_CAPABILITIES, CAPABILITY_LABEL, ROLE_DESCRIPTION, roleCan,
} from "../../../../../lib/cms-roles.js";

export const dynamic = "force-dynamic";

export default async function PermissionsPage(): Promise<ReactNode> {
  await requireCmsAccess();
  // How many people actually hold each role, so the matrix says who it applies to.
  const { rows: counts } = await db().query<{ role: string; n: string }>(
    "SELECT role, count(*)::text n FROM module_access WHERE module='cms' GROUP BY role");
  const holders = (role: string): number => Number(counts.find((c) => c.role === role)?.n ?? 0);

  return (
    <div>
      <h1 className="text-[1.4rem] font-700 text-slate-900">Permission matrix</h1>
      <p className="mt-1 max-w-3xl text-[0.86rem] leading-relaxed text-slate-600">
        What each CMS role may do. This is the model the access gate reads, so a cell marked no is an
        action the system refuses, not a note about intent.
      </p>

      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#543CDA]/20 bg-[#F4F1FD] p-3.5">
        <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#543CDA]" />
        <p className="text-[0.8rem] leading-relaxed text-slate-700">
          Platform administrators sit above this model and hold everything, including the modules outside
          the CMS. They are not listed as a CMS role because the grant is not what gives them access.
        </p>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-subtle">
        <table className="w-full min-w-[40rem] text-left">
          <caption className="sr-only">CMS capabilities by role</caption>
          <thead className="border-b border-slate-200 bg-slate-50/70">
            <tr>
              <th scope="col" className="px-4 py-3 text-[0.72rem] font-700 uppercase tracking-wide text-slate-600">Capability</th>
              {CMS_ROLES.map((r) => (
                <th key={r} scope="col" className="px-4 py-3 text-center">
                  <span className="block text-[0.78rem] font-700 text-slate-800">{r}</span>
                  <span className="block text-[0.68rem] font-400 text-slate-600">
                    {holders(r)} {holders(r) === 1 ? "person" : "people"}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {CMS_CAPABILITIES.map((c) => (
              <tr key={c} className="hover:bg-slate-50/70">
                <th scope="row" className="px-4 py-3 text-[0.84rem] font-600 text-slate-800">{CAPABILITY_LABEL[c]}</th>
                {CMS_ROLES.map((r) => {
                  const yes = roleCan(r, c);
                  return (
                    <td key={r} className="px-4 py-3 text-center">
                      <span className="sr-only">{yes ? "Allowed" : "Not allowed"}</span>
                      {yes
                        ? <CheckCircle2 size={17} className="mx-auto text-[#15803D]" aria-hidden />
                        : <XCircle size={17} className="mx-auto text-slate-300" aria-hidden />}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CMS_ROLES.map((r) => (
          <section key={r} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle">
            <h2 className="text-[0.9rem] font-700 text-slate-900">{r}</h2>
            <p className="mt-1 text-[0.8rem] leading-relaxed text-slate-600">{ROLE_DESCRIPTION[r]}</p>
          </section>
        ))}
      </div>

      <p className="mt-4 text-[0.78rem] text-slate-600">
        Roles are granted per person in <Link href="/settings/access" className="font-600 text-[#543CDA] hover:underline">module access</Link>.
      </p>
    </div>
  );
}
