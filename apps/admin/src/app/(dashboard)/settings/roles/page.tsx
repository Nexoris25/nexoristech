/**
 * Roles & Permissions (PRD 3, 4). The platform's role model is fixed in code, not user-defined: each
 * module recognises a small set of roles (§5.5, §6.9, §7.9, §8.11), granted per person in People &
 * Access. This screen is the read-only matrix of those roles and what each can do, plus how many
 * people currently hold each module grant. There is no "create role" - roles are deliberately fixed
 * so a permissions audit only ever checks one table (§14).
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { requireAdmin } from "../../../../lib/auth.js";
import { db } from "../../../../lib/db.js";
import { MODULES, MODULE_LABEL, MODULE_ROLES } from "../../../../lib/shell-constants.js";

export const dynamic = "force-dynamic";

const ROLE_DESC: Record<string, string> = {
  "CRM Admin": "Full CRM: pipeline, reassignment, templates, targets.",
  Salesperson: "Own leads and deals; request reassignment.",
  Viewer: "Read-only access to the module.",
  "Finance Admin": "Full Finance: invoices, expenses, void, chart of accounts.",
  "Finance Viewer": "Read-only Finance, for leadership.",
  "HR Admin": "Full HR: onboarding, records, leave, offboarding.",
  "HR Assistant": "Day-to-day HR without offboarding or sensitive edits.",
  "Payroll Admin": "Run payroll, approve, disburse, manage statutory settings.",
};
const PLATFORM = [
  ["admin", "Full platform access, including People & Access and Settings."],
  ["salesperson", "A working user; module access is granted per module."],
  ["viewer", "Read-only platform access for leadership."],
] as const;

export default async function RolesPage(): Promise<ReactNode> {
  await requireAdmin();
  const { rows } = await db().query<{ module: string; role: string; c: string }>(
    "SELECT module, role, count(*)::text c FROM module_access GROUP BY module, role");
  const count = (module: string, role: string): string => rows.find((r) => r.module === module && r.role === role)?.c ?? "0";

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-[1.4rem] font-700 text-slate-900">Roles &amp; Permissions</h1>
      <p className="mt-1 text-[0.88rem] text-slate-500">The platform role model is fixed by design. Grant these to people in <Link href="/settings/access" className="font-600 text-[#543CDA]">People &amp; Access</Link>.</p>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
        <h2 className="text-[0.95rem] font-700 text-slate-900">Platform roles</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {PLATFORM.map(([role, desc]) => (
            <div key={role} className="rounded-xl border border-slate-100 bg-slate-50 p-3.5"><p className="text-[0.85rem] font-700 capitalize text-slate-900">{role}</p><p className="mt-1 text-[0.78rem] text-slate-500">{desc}</p></div>
          ))}
        </div>
      </section>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {MODULES.map((m) => (
          <section key={m} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
            <h2 className="flex items-center gap-2 text-[0.95rem] font-700 text-slate-900"><ShieldCheck size={16} className="text-[#543CDA]" /> {MODULE_LABEL[m]}</h2>
            <div className="mt-3 flex flex-col divide-y divide-slate-100">
              {MODULE_ROLES[m].map((role) => (
                <div key={role} className="flex items-start justify-between gap-3 py-2.5">
                  <div className="min-w-0"><p className="text-[0.85rem] font-600 text-slate-900">{role}</p><p className="text-[0.76rem] text-slate-500">{ROLE_DESC[role] ?? ""}</p></div>
                  <span className="shrink-0 rounded-full bg-[#EEEBFC] px-2.5 py-1 text-[0.72rem] font-600 text-[#543CDA]">{count(m, role)} {count(m, role) === "1" ? "person" : "people"}</span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
