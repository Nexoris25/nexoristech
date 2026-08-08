/**
 * Roles. The four CMS roles the access table grants, what each one holds, and who holds it.
 *
 * The list used to offer nine roles with permission counts of 142, 118, 71, 45, 32, 22, 54, 8 and 28,
 * and a "Create Role" button. The counts were written into the file, five of the roles did not exist,
 * and there was no way to create one. Roles are defined in lib/cms-roles and enforced by the gate, so
 * the count is now how many capabilities a role actually carries and the invented ones are gone.
 *
 * CMS access only. Responsive.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { ShieldCheck, Users, ChevronRight } from "lucide-react";
import { requireCmsAccess } from "../../../../../lib/auth.js";
import { db } from "../../../../../lib/db.js";
import {
  CMS_ROLES, CMS_CAPABILITIES, CAPABILITY_LABEL, ROLE_DESCRIPTION, ROLE_CAPABILITIES, capabilityCount,
} from "../../../../../lib/cms-roles.js";

export const dynamic = "force-dynamic";

/** A stable colour per role, so the same role reads the same wherever it appears. */
const ROLE_COLOR: Record<string, string> = {
  "CMS Admin": "#543CDA",
  Editor: "#2563EB",
  "Content Writer": "#15803D",
  "Fact-Checker": "#B45309",
};

export default async function RolesPage(): Promise<ReactNode> {
  await requireCmsAccess();
  const pool = db();
  const [{ rows: counts }, { rows: [adminCount] }] = await Promise.all([
    pool.query<{ role: string; n: string }>("SELECT role, count(*)::text n FROM module_access WHERE module='cms' GROUP BY role"),
    pool.query<{ n: string }>("SELECT count(*)::text n FROM staff WHERE role='admin' AND active = true"),
  ]);
  const holders = (role: string): number => Number(counts.find((c) => c.role === role)?.n ?? 0);
  const assigned = CMS_ROLES.reduce((sum, r) => sum + holders(r), 0);
  const platformAdmins = Number(adminCount?.n ?? 0);

  const kpis = [
    { label: "Roles", value: String(CMS_ROLES.length), fg: "#543CDA" },
    { label: "Capabilities", value: String(CMS_CAPABILITIES.length), fg: "#2563EB" },
    { label: "People with a CMS role", value: String(assigned), fg: "#15803D" },
    { label: "Platform administrators", value: String(platformAdmins), fg: "#B45309" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900">Roles</h1>
          <p className="mt-1 max-w-2xl text-[0.86rem] leading-relaxed text-slate-600">
            The roles the access table grants, and what each one may do. Roles are part of the code the
            gate enforces, so they are defined rather than created here.
          </p>
        </div>
        <Link href="/cms/admin/permissions" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-[0.82rem] font-600 text-slate-700 hover:bg-slate-50">
          <ShieldCheck size={15} strokeWidth={2} /> Full matrix
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle">
            <p className="text-[1.6rem] font-700" style={{ color: c.fg }}>{c.value}</p>
            <p className="text-[0.76rem] font-600 text-slate-700">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {CMS_ROLES.map((r) => {
          const held = ROLE_CAPABILITIES[r] ?? [];
          const color = ROLE_COLOR[r] ?? "#543CDA";
          return (
            <section key={r} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg font-mono text-[0.66rem] font-700 text-white" style={{ background: color }}>
                    {r.split(/\s+|-/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-[0.95rem] font-700 text-slate-900">{r}</h2>
                    <p className="mt-0.5 text-[0.8rem] leading-relaxed text-slate-600">{ROLE_DESCRIPTION[r]}</p>
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[0.74rem] font-600 text-slate-700">
                  <Users size={13} /> {holders(r)}
                </span>
              </div>

              <p className="mt-4 text-[0.74rem] font-700 uppercase tracking-wide text-slate-600">
                Holds {capabilityCount(r)} of {CMS_CAPABILITIES.length}
              </p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {held.map((c) => (
                  <li key={c} className="rounded-md px-2 py-1 text-[0.72rem] font-600" style={{ background: `${color}14`, color }}>
                    {CAPABILITY_LABEL[c]}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <p className="mt-4 flex items-center gap-1 text-[0.8rem] text-slate-600">
        Grant a role to someone in
        <Link href="/settings/access" className="inline-flex items-center gap-0.5 font-600 text-[#543CDA] hover:underline">
          module access <ChevronRight size={13} />
        </Link>
      </p>
    </div>
  );
}
